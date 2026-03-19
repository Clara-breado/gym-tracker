import asyncio
import logging

from fastapi import Depends, FastAPI, HTTPException, Request

from api.auth import verify_api_key
from api.models.schemas import (
    ChatRequest,
    GeneratePlanRequest,
    SaveWorkoutRequest,
    SuggestAlternativesRequest,
    SuggestAlternativesResponse,
    WorkoutPlanResponse,
)
from api.services import cosmos_service, gemini_service

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Fitness Tracker",
    version="1.0.0",
    dependencies=[Depends(verify_api_key)],
)


@app.post("/api/generate-plan", response_model=WorkoutPlanResponse)
async def generate_plan(request: GeneratePlanRequest, http_request: Request):
    lang = http_request.headers.get("accept-language", "en-US")
    language = "Chinese" if lang.startswith("zh") else "English"

    try:
        history = await cosmos_service.get_history(request.body_part)
    except Exception as exc:
        logger.error("Cosmos DB query failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to retrieve workout history")

    # Fetch user profile for personalized coaching
    try:
        user_profile = await cosmos_service.get_user_profile()
    except Exception as exc:
        logger.warning("Failed to fetch user profile, using defaults: %s", exc)
        user_profile = {}

    try:
        plan = await gemini_service.generate_workout_plan(
            body_part=request.body_part,
            special_request=request.special_request,
            user_body_measurements=request.user_body_measurements,
            history=history,
            language=language,
            user_profile=user_profile,
        )
    except Exception as exc:
        logger.error("AI plan generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to generate workout plan")

    return plan


@app.post("/api/save-workout")
async def save_workout(request: SaveWorkoutRequest, http_request: Request):
    lang = http_request.headers.get("accept-language", "en-US")
    language = "Chinese" if lang.startswith("zh") else "English"

    workout_data = request.model_dump()

    # Step 1: Run AI reflection on the workout
    try:
        user_profile = await cosmos_service.get_user_profile()
    except Exception as exc:
        logger.warning("Failed to fetch profile for reflection: %s", exc)
        user_profile = {}

    try:
        reflection = await gemini_service.reflect_on_workout(
            workout_data=workout_data,
            current_profile=user_profile,
            language=language,
        )
        # Step 2: Update user profile with new insights
        await cosmos_service.update_user_profile(
            weak_points=reflection.get("weak_points_and_reminders", ""),
            current_doubts=reflection.get("current_doubts", ""),
        )
        # Step 3: Save workout with AI-generated session summary
        workout_data["ai_summary"] = reflection.get("session_summary", "")
    except Exception as exc:
        logger.error("AI reflection failed, saving workout without summary: %s", exc)

    # Step 4: Save the workout document
    try:
        document = await cosmos_service.save_workout(workout_data)
    except Exception as exc:
        logger.error("Cosmos DB save failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to save workout")

    return document


@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest, http_request: Request):
    try:
        from openai import AsyncAzureOpenAI
        from api.config import get_settings

        settings = get_settings()
        lang = http_request.headers.get("accept-language", "en-US")
        language = "Chinese" if lang.startswith("zh") else "English"

        # Fetch user profile for context
        try:
            user_profile = await cosmos_service.get_user_profile()
            profile_context = (
                f" The user's known weak points: {user_profile.get('weak_points_and_reminders', 'None')}."
                f" Their current doubts: {user_profile.get('current_doubts', 'None')}."
            )
        except Exception:
            user_profile = {}
            profile_context = ""

        client = AsyncAzureOpenAI(
            azure_endpoint=settings["AZURE_OPENAI_ENDPOINT"],
            api_key=settings["AZURE_OPENAI_KEY"],
            api_version=settings["AZURE_OPENAI_API_VERSION"],
        )

        system_msg = {
            "role": "system",
            "content": (
                f"You are a friendly, expert fitness coach assistant. Give brief, practical advice about "
                f"exercise form, technique, nutrition, and workout optimization. Keep responses concise "
                f"(2-3 sentences max) since users are reading this during their workout.{profile_context} "
                f"Respond in {language}."
            ),
        }
        messages = [system_msg] + [
            {"role": m.role, "content": m.content} for m in request.messages
        ]

        response = await client.chat.completions.create(
            model=settings["AZURE_OPENAI_DEPLOYMENT"],
            messages=messages,
            temperature=0.7,
            max_tokens=200,
        )

        reply = response.choices[0].message.content

        # Background task: extract insights from conversation
        conversation = [{"role": m.role, "content": m.content} for m in request.messages]
        conversation.append({"role": "assistant", "content": reply})

        async def _extract_and_update():
            try:
                profile = user_profile or await cosmos_service.get_user_profile()
                logger.info("[_extract_and_update] Starting insight extraction, conversation_len=%d", len(conversation))
                insights = await gemini_service.extract_chat_insights(conversation, profile)
                logger.info("[_extract_and_update] Insights result: %s", insights)
                if insights.get("has_new_insights"):
                    existing_weak = profile.get("weak_points_and_reminders", "")
                    existing_doubts = profile.get("current_doubts", "")
                    new_weak = existing_weak
                    if insights.get("weak_points_to_append"):
                        new_weak = f"{existing_weak}; {insights['weak_points_to_append']}" if existing_weak else insights["weak_points_to_append"]
                    new_doubts = existing_doubts
                    if insights.get("doubts_to_append"):
                        new_doubts = f"{existing_doubts}; {insights['doubts_to_append']}" if existing_doubts else insights["doubts_to_append"]
                    await cosmos_service.update_user_profile(new_weak, new_doubts)
                    logger.info("[_extract_and_update] Profile updated — weak_points: %s, doubts: %s", new_weak, new_doubts)
                else:
                    logger.info("[_extract_and_update] No new insights found, skipping profile update")
            except Exception as exc:
                logger.error("[_extract_and_update] Background chat insight extraction failed: %s", exc, exc_info=True)

        asyncio.create_task(_extract_and_update())

        return {"reply": reply}
    except Exception as exc:
        logger.error("Chat API failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to get AI response")


@app.post("/api/suggest-alternatives", response_model=SuggestAlternativesResponse)
async def suggest_alternatives(request: SuggestAlternativesRequest, http_request: Request):
    try:
        import json

        from openai import AsyncAzureOpenAI

        from api.config import get_settings

        settings = get_settings()
        lang = http_request.headers.get("accept-language", "en-US")
        language = "Chinese" if lang.startswith("zh") else "English"

        client = AsyncAzureOpenAI(
            azure_endpoint=settings["AZURE_OPENAI_ENDPOINT"],
            api_key=settings["AZURE_OPENAI_KEY"],
            api_version=settings["AZURE_OPENAI_API_VERSION"],
        )

        existing_names = ", ".join(
            e.get("exercise_name", "") for e in request.current_plan
        )

        system_prompt = f"""You are an elite strength and conditioning coach. The user wants to replace an exercise in their workout plan.

Current exercise to replace: {request.exercise_name}
Target muscle group: {request.body_part}
Reason for replacement: {request.reason}
Other exercises already in the plan (avoid duplicates): {existing_names}

Generate exactly 3 alternative exercises that:
1. Target the same muscle group ({request.body_part})
2. Are NOT already in the current plan
3. Provide similar or better training stimulus
4. Include progressive overload suggestions

Output strictly in valid JSON format:
{{
  "alternatives": [
    {{
      "exercise_name": "String",
      "target_sets": Integer,
      "target_reps": "String (e.g., 8-10)",
      "suggested_weight": "String",
      "coach_tip": "String (why this is a good alternative)"
    }}
  ]
}}

IMPORTANT: Respond entirely in {language}. All exercise names, coach tips must be in {language}."""

        response = await client.chat.completions.create(
            model=settings["AZURE_OPENAI_DEPLOYMENT"],
            messages=[{"role": "system", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=500,
        )

        data = json.loads(response.choices[0].message.content)

        return SuggestAlternativesResponse(
            original_exercise=request.exercise_name,
            alternatives=data["alternatives"],
        )
    except Exception as exc:
        logger.error("Suggest alternatives API failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to generate alternative exercises")
