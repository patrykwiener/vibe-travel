FROM python:3.13-alpine

WORKDIR /app

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN set -x && \
    apk update && \
    apk add --no-cache \
    netcat-openbsd \
    gdal-dev \
    gcc \
    musl-dev \
    python3-dev \
    postgresql-dev \
    linux-headers \
    curl \
    libpq-dev

# Install Python dependencies
COPY ./requirements.txt ./requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r ./requirements.txt

# Copy application code
COPY . ./

# Expose port
EXPOSE 80

# Run the application
CMD ["./scripts/start.sh"]
