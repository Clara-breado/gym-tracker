# 🏋️ AI-Native Serverless Fitness Tracker

A full-stack, AI-powered personal strength training app. Instead of a fixed exercise database, it dynamically generates personalized workout plans using Azure OpenAI (GPT-4o-mini) based on your workout history, body measurements, and goals.

**Live Demo**: [https://orange-stone-062c7470f.1.azurestaticapps.net](https://orange-stone-062c7470f.1.azurestaticapps.net)

## ✨ Features

- **AI Workout Generation** — Generates 4-6 exercises with progressive overload based on your history
- **Interactive Workout Tracker** — Log actual weights, mark sets complete, track progress in real-time
- **Exercise Replacement** — Tap any exercise to get 3 AI-suggested alternatives or a form explanation with YouTube link
- **Voice Feedback** — Record form cues via speech-to-text (Web Speech API)
- **AI Coach Chat** — Ask real-time questions during your workout via a floating chat assistant
- **Bilingual Support** — Full EN / 中文 toggle for UI text and AI responses
- **Mobile-First Design** — Optimized for 390px (iPhone) viewport with native app feel

## 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────────────┐
│   React SPA         │     │   Azure Functions         │
│   (Static Web App)  │────▶│   (Python FastAPI)        │
│                     │     │                           │
│  • Tailwind CSS     │     │  POST /api/generate-plan  │
│  • lucide-react     │     │  POST /api/save-workout   │
│  • Web Speech API   │     │  POST /api/chat           │
└─────────────────────┘     │  POST /api/suggest-alt... │
                            └──────┬───────────┬────────┘
                                   │           │
                            ┌──────▼──────┐ ┌──▼───────────┐
                            │ Cosmos DB   │ │ Azure OpenAI  │
                            │ (Serverless)│ │ (GPT-4o-mini) │
                            └─────────────┘ └───────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3, lucide-react |
| Backend | Python, FastAPI, Azure Functions v2 |
| Database | Azure Cosmos DB for NoSQL (Serverless) |
| AI | Azure OpenAI (GPT-4o-mini) |
| Hosting | Azure Static Web Apps (frontend), Azure Functions Consumption Plan (backend) |
| Auth | API Key via `X-API-Key` header |

## 📋 Prerequisites

- **Python 3.11** (matches Azure Functions runtime)
- **Node.js 18+** and npm
- **Azure CLI** (`az`) — [Install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Azure Functions Core Tools v4** — `npm install -g azure-functions-core-tools@4`
- **Azure Subscription** with the following resources (or use `infra/deploy.sh` to create them)

## 🚀 Developer Setup

### 1. Clone the repository

```bash
git clone https://github.com/Clara-breado/gym-tracker.git
cd gym-tracker
```

### 2. Provision Azure resources (optional — if starting fresh)

```bash
# Login to Azure
az login

# Run the infrastructure script
chmod +x infra/deploy.sh
bash infra/deploy.sh
```

This creates: Resource Group, Cosmos DB (serverless), Storage Account, and Function App.

### 3. Create `local.settings.json`

This file stores secrets for local development. It is **gitignored** and must be created manually.

Create `local.settings.json` in the project root with the following template:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "COSMOS_ENDPOINT": "<your-cosmos-db-endpoint>",
    "COSMOS_KEY": "<your-cosmos-db-primary-key>",
    "COSMOS_DATABASE": "gym-tracker-db",
    "COSMOS_CONTAINER": "workouts",
    "AZURE_OPENAI_ENDPOINT": "<your-azure-openai-endpoint>",
    "AZURE_OPENAI_KEY": "<your-azure-openai-key>",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4o-mini",
    "API_KEY": "<any-secret-key-you-choose>"
  }
}
```

**How to get each value:**

| Key | Where to find it |
|-----|-----------------|
| `COSMOS_ENDPOINT` | Azure Portal → Cosmos DB account → Overview → URI |
| `COSMOS_KEY` | Azure Portal → Cosmos DB account → Keys → Primary Key |
| `COSMOS_DATABASE` | Name of your Cosmos DB database (default: `gym-tracker-db`) |
| `COSMOS_CONTAINER` | Name of your container (default: `workouts`, partition key: `/body_part`) |
| `AZURE_OPENAI_ENDPOINT` | Azure Portal → Azure OpenAI resource → Keys and Endpoint → Endpoint |
| `AZURE_OPENAI_KEY` | Azure Portal → Azure OpenAI resource → Keys and Endpoint → Key 1 |
| `AZURE_OPENAI_DEPLOYMENT` | The model deployment name in Azure OpenAI Studio (e.g., `gpt-4o-mini`) |
| `API_KEY` | Any secret string you choose — used for authenticating API requests |

### 4. Run the backend locally

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the Azure Functions local server
func start
```

The API will be available at `http://localhost:7071`.

### 5. Run the frontend locally

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` with API calls proxied to the backend (configured in `vite.config.js`).

## 📡 API Endpoints

All endpoints require the `X-API-Key` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-plan` | Generate an AI workout plan for a target muscle group |
| POST | `/api/save-workout` | Save completed workout data to Cosmos DB |
| POST | `/api/chat` | Chat with the AI fitness coach |
| POST | `/api/suggest-alternatives` | Get 3 alternative exercises for a given exercise |

### Example: Generate a plan

```bash
curl -X POST https://<your-function-app>.azurewebsites.net/api/generate-plan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{
    "body_part": "glutes",
    "special_request": "Focus on hip thrusts, only 30 mins",
    "user_body_measurements": {"height": "165cm", "weight": "58kg"}
  }'
```

## 🚢 Deployment

### Backend (Azure Functions)

```bash
func azure functionapp publish <your-function-app-name> --python
```

### Frontend (Azure Static Web Apps)

```bash
cd frontend

# Build with production API URL
VITE_API_URL=https://<your-function-app>.azurewebsites.net npm run build

# Deploy
swa deploy ./dist --deployment-token <your-swa-token> --env production
```

Don't forget to configure CORS on the Function App:
```bash
az functionapp cors add --name <function-app> --resource-group <rg> \
  --allowed-origins "https://<your-swa-domain>.azurestaticapps.net"
```

## 🌐 Bilingual Support

Toggle between English and Chinese (中文) via the button in the dashboard header. This affects:
- All frontend UI text (stored in `src/i18n.js`)
- AI-generated content — the `Accept-Language` header is sent with every API request, and the backend instructs the AI model to respond in the selected language

## 📁 Project Structure

```
gym-tracker/
├── api/                          # Backend Python package
│   ├── main.py                   # FastAPI app with 4 endpoints
│   ├── config.py                 # Environment variable loader
│   ├── auth.py                   # X-API-Key authentication
│   ├── models/schemas.py         # Pydantic request/response models
│   └── services/
│       ├── cosmos_service.py     # Async Cosmos DB CRUD
│       └── gemini_service.py     # Azure OpenAI integration
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── App.jsx               # Root component with view routing
│   │   ├── api.js                # Fetch wrapper with auth headers
│   │   ├── i18n.js               # Translation strings (EN/CN)
│   │   ├── data.js               # Body part definitions
│   │   ├── components/           # 10 React components
│   │   └── hooks/                # useLocalStorage, useSpeechRecognition
│   ├── vite.config.js            # Vite + API proxy config
│   └── staticwebapp.config.json  # Azure SWA routing
├── infra/deploy.sh               # Azure CLI provisioning script
├── function_app.py               # Azure Functions entry point
├── host.json                     # Azure Functions host config
├── requirements.txt              # Python dependencies
└── local.settings.json           # Local secrets (gitignored)
```

## 📄 License

MIT
