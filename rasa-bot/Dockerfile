FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create models and other directories and make sure they are writable
RUN mkdir -p /app/models /app/.rasa && chmod -R 777 /app

# Clean pre-trained Windows models and train a fresh one on Linux
RUN rm -rf /app/models/* && rasa train

# Expose ports
EXPOSE 5005
EXPOSE 5055

# Ensure start.sh has execute permissions
RUN chmod +x /app/start.sh

# Run as non-root user for security and Hugging Face compatibility (UID 1000 is default on HF)
RUN useradd -m -u 1000 user && chown -R user:user /app
USER user

CMD ["/app/start.sh"]
