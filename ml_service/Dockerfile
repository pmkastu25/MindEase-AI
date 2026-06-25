# Use python:3.10-slim as base to keep the image lightweight
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for Docker layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose the service port (HF Spaces defaults to 7860)
EXPOSE 7860

# Start FastAPI application using uvicorn, reading PORT env variable or defaulting to 7860
CMD ["sh", "-c", "uvicorn apps.app:app --host 0.0.0.0 --port ${PORT:-7860}"]
