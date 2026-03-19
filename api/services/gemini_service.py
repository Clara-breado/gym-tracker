import json

from openai import AsyncAzureOpenAI
from api.config import get_settings
from api.models.schemas import WorkoutPlanResponse

SYSTEM_PROMPT_TEMPLATE = """You are an elite strength and conditioning coach. Your task is to generate a highly customized, dynamic workout plan strictly in JSON format. Do not rely on a fixed exercise database. Select the most optimal exercises based on biomechanics.

INPUT CONTEXT:
- Target Muscle Group: {body_part}
- Today's User Request: {special_request}
- User's Current Body Measurements: {user_body_measurements}
- Historical Data (Last 3 sessions for this group, including weights and form cues): {history_json}
- Primary User Goals: Focus on hypertrophy, specifically building glutes and achieving visible abs.
- USER PROFILE & REMINDERS: {weak_points_and_reminders}
- CURRENT DOUBTS: {current_doubts}

You MUST specifically address the above weak points and doubts in your coach_tip for each exercise.

INSTRUCTIONS:
1. Analyze the historical weights and "form cues" to ensure progressive overload. Pay close attention to previous form issues.
2. Generate 4 to 6 exercises for today's session based on the target muscle group and user goals.
3. Output strictly in valid JSON format. Do not include any conversational text or markdown formatting outside the JSON block.

JSON SCHEMA REQUIREMENT:
{{
  "workout_plan": [
    {{
      "exercise_name": "String",
      "target_sets": "Integer",
      "target_reps": "String (e.g., 8-10)",
      "suggested_weight": "String (based strictly on progressive overload from history_json)",
      "coach_tip": "String (A brief, highly specific form cue tailored to correct the user's past feedback)"
    }}
  ],
  "warm_up_routine": "String"
}}
IMPORTANT: Respond entirely in {language}. All exercise names, coach tips, and the warm-up routine must be in {language}."""


async def generate_workout_plan(
    body_part: str,
    special_request: str,
    user_body_measurements: dict,
    history: list[dict],
    language: str = "English",
    user_profile: dict = None,
) -> dict:
    settings = get_settings()
    profile = user_profile or {}

    prompt = SYSTEM_PROMPT_TEMPLATE.format(
        body_part=body_part,
        special_request=special_request,
        user_body_measurements=json.dumps(user_body_measurements),
        history_json=json.dumps(history),
        language=language,
        weak_points_and_reminders=profile.get("weak_points_and_reminders", "None yet"),
        current_doubts=profile.get("current_doubts", "None yet"),
    )

    client = AsyncAzureOpenAI(
        azure_endpoint=settings["AZURE_OPENAI_ENDPOINT"],
        api_key=settings["AZURE_OPENAI_KEY"],
        api_version=settings["AZURE_OPENAI_API_VERSION"],
    )

    response = await client.chat.completions.create(
        model=settings["AZURE_OPENAI_DEPLOYMENT"],
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    parsed_json = json.loads(response.choices[0].message.content)
    validated = WorkoutPlanResponse.model_validate(parsed_json)
    return validated.model_dump()


REFLECTION_PROMPT_TEMPLATE = """You are an expert sports performance analyst. Analyze the user's completed workout session and extract insights for their continuous improvement profile.

COMPLETED WORKOUT DATA:
- Body Part: {body_part}
- Exercises Performed: {exercises_json}
- Current Profile Weak Points: {current_weak_points}
- Current Doubts: {current_doubts}

INSTRUCTIONS:
1. Analyze the user's actual weights, form cues, and voice-to-text notes for each exercise.
2. Identify any new form issues, muscular weaknesses, or recurring problems.
3. Note any questions or doubts the user expressed in their form notes.
4. Merge new insights with existing weak points and doubts (do not lose existing data, append or refine).
5. Create a brief session summary.

Output strictly in valid JSON format:
{{
  "weak_points_and_reminders": "String (updated cumulative list of all weak points and form reminders)",
  "current_doubts": "String (updated cumulative list of user's doubts and questions)",
  "session_summary": "String (2-3 sentence summary of today's workout performance)"
}}
IMPORTANT: Respond entirely in {language}."""


async def reflect_on_workout(
    workout_data: dict,
    current_profile: dict,
    language: str = "English",
) -> dict:
    """Analyze completed workout and return updated profile insights."""
    settings = get_settings()

    prompt = REFLECTION_PROMPT_TEMPLATE.format(
        body_part=workout_data.get("body_part", ""),
        exercises_json=json.dumps(workout_data.get("exercises", []), default=str),
        current_weak_points=current_profile.get("weak_points_and_reminders", "None yet"),
        current_doubts=current_profile.get("current_doubts", "None yet"),
        language=language,
    )

    client = AsyncAzureOpenAI(
        azure_endpoint=settings["AZURE_OPENAI_ENDPOINT"],
        api_key=settings["AZURE_OPENAI_KEY"],
        api_version=settings["AZURE_OPENAI_API_VERSION"],
    )

    response = await client.chat.completions.create(
        model=settings["AZURE_OPENAI_DEPLOYMENT"],
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        response_format={"type": "json_object"},
        max_tokens=500,
    )

    return json.loads(response.choices[0].message.content)


CHAT_INSIGHT_PROMPT = """Analyze this fitness coaching conversation. Did the user reveal any NEW muscular weaknesses, form issues, pain points, or training doubts?

CONVERSATION:
{conversation_json}

EXISTING PROFILE:
- Weak Points: {current_weak_points}
- Doubts: {current_doubts}

If the user revealed NEW insights not already captured in the existing profile, return a JSON object:
{{
  "has_new_insights": true,
  "weak_points_to_append": "String (new weak points to add, or empty string)",
  "doubts_to_append": "String (new doubts to add, or empty string)"
}}

If NO new insights were found, return:
{{
  "has_new_insights": false,
  "weak_points_to_append": "",
  "doubts_to_append": ""
}}

Output strictly valid JSON. No conversational text."""


async def extract_chat_insights(
    conversation: list[dict],
    current_profile: dict,
) -> dict:
    """Analyze chat for new user insights. Returns dict with has_new_insights flag."""
    settings = get_settings()

    prompt = CHAT_INSIGHT_PROMPT.format(
        conversation_json=json.dumps(conversation, default=str),
        current_weak_points=current_profile.get("weak_points_and_reminders", "None"),
        current_doubts=current_profile.get("current_doubts", "None"),
    )

    client = AsyncAzureOpenAI(
        azure_endpoint=settings["AZURE_OPENAI_ENDPOINT"],
        api_key=settings["AZURE_OPENAI_KEY"],
        api_version=settings["AZURE_OPENAI_API_VERSION"],
    )

    response = await client.chat.completions.create(
        model=settings["AZURE_OPENAI_DEPLOYMENT"],
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=300,
    )

    return json.loads(response.choices[0].message.content)
