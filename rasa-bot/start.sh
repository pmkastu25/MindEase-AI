#!/bin/bash

# Start the Rasa Action Server in the background
echo "Starting Rasa Action Server on port 5055..."
rasa run actions --port 5055 &

# Wait a few seconds for the action server to start up
sleep 5

# Get the port from environment variable (Hugging Face Spaces uses PORT, typically 7860)
PORT=${PORT:-5005}

# Start the main Rasa Server in the foreground
echo "Starting Rasa Server on port $PORT..."
rasa run --enable-api --cors "*" --port $PORT
