import os


def get_settings():
    """Load settings from environment variables."""
    return {
        "COSMOS_ENDPOINT": os.environ.get("COSMOS_ENDPOINT", ""),
        "COSMOS_KEY": os.environ.get("COSMOS_KEY", ""),
        "COSMOS_DATABASE": os.environ.get("COSMOS_DATABASE", "gym-tracker-db"),
        "COSMOS_CONTAINER": os.environ.get("COSMOS_CONTAINER", "workouts"),
        "AZURE_OPENAI_ENDPOINT": os.environ.get("AZURE_OPENAI_ENDPOINT", ""),
        "AZURE_OPENAI_KEY": os.environ.get("AZURE_OPENAI_KEY", os.environ.get("AZURE_OPENAI_API_KEY", "")),
        "AZURE_OPENAI_DEPLOYMENT": os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1-mini"),
        "AZURE_OPENAI_API_VERSION": os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21"),
        "API_KEY": os.environ.get("API_KEY", ""),
    }
