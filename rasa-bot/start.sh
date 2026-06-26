#!/bin/bash

# Start the Rasa Action Server in the background
echo "🤖 Starting Rasa Action Server on port 5055..."
python -m rasa_sdk --actions actions --port 5055 > action_server.log 2>&1 &

# Wait a few seconds for the action server to start up
sleep 4

# Print action server logs to container stdout for debugging
echo "📝 --- Rasa Action Server Logs ---"
cat action_server.log
echo "📝 -------------------------------"

# Get the port from environment variable (Hugging Face Spaces uses PORT, typically 7860)
PORT=${PORT:-7860}

# Start the main Rasa Server in the foreground
echo "Starting Rasa Server on port $PORT..."
rasa run --enable-api --cors "*" --port $PORT -i 0.0.0.0
