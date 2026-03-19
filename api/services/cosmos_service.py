from azure.cosmos.aio import CosmosClient

from api.config import get_settings
from api.models.schemas import WorkoutDocument, UserProfile


async def _get_container():
    settings = get_settings()
    client = CosmosClient(
        url=settings["COSMOS_ENDPOINT"],
        credential=settings["COSMOS_KEY"],
    )
    database = client.get_database_client(settings["COSMOS_DATABASE"])
    container = database.get_container_client(settings["COSMOS_CONTAINER"])
    return container


async def get_history(body_part: str, limit: int = 3) -> list[dict]:
    query = (
        "SELECT * FROM c WHERE c.body_part = @body_part "
        f"ORDER BY c.date DESC OFFSET 0 LIMIT {limit}"
    )
    parameters = [
        {"name": "@body_part", "value": body_part},
    ]

    async with CosmosClient(
        url=get_settings()["COSMOS_ENDPOINT"],
        credential=get_settings()["COSMOS_KEY"],
    ) as client:
        database = client.get_database_client(get_settings()["COSMOS_DATABASE"])
        container = database.get_container_client(get_settings()["COSMOS_CONTAINER"])

        results = []
        async for item in container.query_items(
            query=query,
            parameters=parameters,
            partition_key=body_part,
        ):
            results.append(item)

    return results


async def save_workout(data: dict) -> dict:
    document = WorkoutDocument(**data).model_dump()

    async with CosmosClient(
        url=get_settings()["COSMOS_ENDPOINT"],
        credential=get_settings()["COSMOS_KEY"],
    ) as client:
        database = client.get_database_client(get_settings()["COSMOS_DATABASE"])
        container = database.get_container_client(get_settings()["COSMOS_CONTAINER"])
        await container.upsert_item(document)

    return document


async def get_user_profile() -> dict:
    """Get the singleton user profile, creating it with defaults if missing."""
    async with CosmosClient(
        url=get_settings()["COSMOS_ENDPOINT"],
        credential=get_settings()["COSMOS_KEY"],
    ) as client:
        database = client.get_database_client(get_settings()["COSMOS_DATABASE"])
        container = database.get_container_client(get_settings()["COSMOS_CONTAINER"])

        try:
            item = await container.read_item(
                item="user_knowledge_base",
                partition_key="global_profile",
            )
            return item
        except Exception:
            # Document doesn't exist yet — create with defaults
            default_profile = UserProfile().model_dump()
            await container.upsert_item(default_profile)
            return default_profile


async def update_user_profile(weak_points: str, current_doubts: str) -> dict:
    """Update the singleton user profile with new AI-extracted insights."""
    async with CosmosClient(
        url=get_settings()["COSMOS_ENDPOINT"],
        credential=get_settings()["COSMOS_KEY"],
    ) as client:
        database = client.get_database_client(get_settings()["COSMOS_DATABASE"])
        container = database.get_container_client(get_settings()["COSMOS_CONTAINER"])

        try:
            profile = await container.read_item(
                item="user_knowledge_base",
                partition_key="global_profile",
            )
        except Exception:
            profile = UserProfile().model_dump()

        profile["weak_points_and_reminders"] = weak_points
        profile["current_doubts"] = current_doubts
        await container.upsert_item(profile)
        return profile
