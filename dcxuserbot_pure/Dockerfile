# Multi-stage lightweight Python 3.11 image
FROM python:3.11-slim-bullseye as base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install required system binaries for media processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ffmpeg \
    libmagic1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy source code
COPY . .

# Run DcXuserbot
CMD ["python3", "main.py"]
