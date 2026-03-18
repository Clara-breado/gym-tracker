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
) -> dict:
    settings = get_settings()

    prompt = SYSTEM_PROMPT_TEMPLATE.format(
        body_part=body_part,
        special_request=special_request,
        user_body_measurements=json.dumps(user_body_measurements),
        history_json=json.dumps(history),
        language=language,
    )

    client = AsyncAzureOpenAI(
        azure_endpoint=settings["AZURE_OPENAI_ENDPOINT"],
        api_key=settings["AZURE_OPENAI_KEY"],
        api_version="2024-10-21",
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
