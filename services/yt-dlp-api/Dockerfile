FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000 \
    PATH="/root/.deno/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        curl \
        unzip \
        ca-certificates \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install Deno for yt-dlp YouTube JavaScript challenge solving
RUN curl -fsSL https://deno.land/install.sh | sh

# Install BgUtils PO Token provider source.
# The yt-dlp plugin will use this as its local script provider.
RUN git clone \
        --depth 1 \
        --branch 2.0.0 \
        https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git \
        /root/bgutil-ytdlp-pot-provider

# Install the provider's Deno dependencies.
RUN cd /root/bgutil-ytdlp-pot-provider/server \
    && deno install --allow-scripts=npm:canvas --frozen

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./

EXPOSE 10000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}"]