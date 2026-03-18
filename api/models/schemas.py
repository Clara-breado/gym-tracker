from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class ExercisePlan(BaseModel):
    exercise_name: str
    target_sets: int
    target_reps: str
    suggested_weight: str
    coach_tip: str


class WorkoutPlanResponse(BaseModel):
    workout_plan: list[ExercisePlan]
    warm_up_routine: str


class GeneratePlanRequest(BaseModel):
    body_part: str
    special_request: str = ""
    user_body_measurements: dict


class ExerciseLog(BaseModel):
    name: str
    actual_sets: int
    actual_reps: str
    actual_weight: str
    form_cues: str = ""  # voice-to-text feedback from frontend


class SaveWorkoutRequest(BaseModel):
    date: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    body_part: str
    user_body_measurements: dict
    exercises: list[ExerciseLog]
    ai_summary: str = ""


class WorkoutDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    date: str
    body_part: str
    user_body_measurements: dict
    exercises: list[ExerciseLog]
    ai_summary: str = ""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


class SuggestAlternativesRequest(BaseModel):
    exercise_name: str
    body_part: str
    reason: str = ""
    current_plan: list[dict] = []


class SuggestAlternativesResponse(BaseModel):
    original_exercise: str
    alternatives: list[ExercisePlan]
