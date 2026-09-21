# DcXuserbot v5 — one-container deployment
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# ffmpeg → .song/.video conversion · fonts-dejavu → image rendering fallback
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# state (sessions, JSON store, cache) survives container recreation
VOLUME ["/app/data"]

# auto-restart on `.restart` / crash  →  launch with --restart unless-stopped
CMD ["python", "-m", "dcx"]
