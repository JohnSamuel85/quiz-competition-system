# Multi-stage production container for unified Next.js + FastAPI single-service
FROM python:3.11-slim

# Install system dependencies & Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    build-essential \
    libpq-dev \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install and build frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ .
RUN npm run build

# Return to root workdir
WORKDIR /app
COPY backend/ ./backend/
COPY run_production.py .
COPY sample_rounds/ ./sample_rounds/

ENV PORT=3000
ENV BACKEND_PORT=8000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["python", "run_production.py"]
