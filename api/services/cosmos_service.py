from azure.cosmos.aio import CosmosClient

from api.config import get_settings
from api.models.schemas import WorkoutDocument


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
