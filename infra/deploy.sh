#!/bin/bash
set -e

# ---------------------
# Configurable variables
# ---------------------
RESOURCE_GROUP="gym-tracker-rg"
LOCATION="eastus"
COSMOS_ACCOUNT="gym-tracker-cosmos"
STORAGE_ACCOUNT="gymtrackerstorage"
FUNCTION_APP="gym-tracker-func"
COSMOS_DATABASE="gym-tracker-db"
COSMOS_CONTAINER="workouts"

# ---------------------
# 1. Resource Group
# ---------------------
echo "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"

# ---------------------
# 2. Cosmos DB Account (NoSQL API, Serverless)
# ---------------------
echo "Creating Cosmos DB account: $COSMOS_ACCOUNT..."
az cosmosdb create \
  --name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --locations regionName="$LOCATION" \
  --capabilities EnableServerless

# ---------------------
# 3. Cosmos DB SQL Database
# ---------------------
echo "Creating Cosmos DB database: $COSMOS_DATABASE..."
az cosmosdb sql database create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --name "$COSMOS_DATABASE"

# ---------------------
# 4. Cosmos DB SQL Container
# ---------------------
echo "Creating Cosmos DB container: $COSMOS_CONTAINER with partition key /body_part..."
az cosmosdb sql container create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --database-name "$COSMOS_DATABASE" \
  --name "$COSMOS_CONTAINER" \
  --partition-key-path "/body_part"

# ---------------------
# 5. Storage Account
# ---------------------
echo "Creating Storage Account: $STORAGE_ACCOUNT..."
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS

# ---------------------
# 6. Azure Function App (Python 3.11, Linux, Consumption)
# ---------------------
echo "Creating Function App: $FUNCTION_APP..."
az functionapp create \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --storage-account "$STORAGE_ACCOUNT" \
  --consumption-plan-location "$LOCATION" \
  --runtime python \
  --runtime-version 3.11 \
  --os-type Linux \
  --functions-version 4

# ---------------------
# 7. Configure App Settings
# ---------------------
echo "Retrieving Cosmos DB endpoint and key..."
COSMOS_ENDPOINT=$(az cosmosdb show \
  --name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query "documentEndpoint" \
  --output tsv)

COSMOS_KEY=$(az cosmosdb keys list \
  --name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query "primaryMasterKey" \
  --output tsv)

echo "Configuring Function App settings..."
az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" \
    COSMOS_KEY="$COSMOS_KEY" \
    COSMOS_DATABASE="$COSMOS_DATABASE" \
    COSMOS_CONTAINER="$COSMOS_CONTAINER" \
    GEMINI_API_KEY="<your-gemini-api-key>" \
    API_KEY="<your-api-key>"

# ---------------------
# Summary
# ---------------------
echo ""
echo "============================="
echo "  Deployment Summary"
echo "============================="
echo "Resource Group:    $RESOURCE_GROUP"
echo "Location:          $LOCATION"
echo "Cosmos DB Account: $COSMOS_ACCOUNT"
echo "Cosmos DB Database:$COSMOS_DATABASE"
echo "Cosmos DB Container:$COSMOS_CONTAINER"
echo "Storage Account:   $STORAGE_ACCOUNT"
echo "Function App:      $FUNCTION_APP"
echo "Cosmos DB Endpoint:$COSMOS_ENDPOINT"
echo "============================="
echo "Deployment complete!"
