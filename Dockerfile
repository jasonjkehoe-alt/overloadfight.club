# ==============================================================================
# Overload Fight Club (overloadfight.club) - Multi-stage Production Dockerfile
# Community platform: Server tracker, Player stats, Audio taunt suite & Pilot bridge
# Optimized for Synology NAS (Container Manager / Docker) and standard Docker hosts
# Architecture: linux/amd64 (Intel Atom C2538 on DS1515+) and linux/arm64
# ==============================================================================

# Stage 1: Build client and standalone server
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy full source tree
COPY . .

# Build both static client (dist/) and standalone server (dist-server/)
RUN npm run build

# ==============================================================================
# Stage 2: Production runtime image
# ==============================================================================
FROM node:20-slim AS runner

WORKDIR /app

# Install system dependencies:
# - python3 & curl: for yt-dlp audio extraction
# - ffmpeg: audio inspection/conversion utilities
# - ca-certificates: secure HTTPS downloads from Internet Archive & YouTube
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    curl \
    ca-certificates \
    ffmpeg \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/package.json ./package.json

# Prepare default Overload data directory
RUN mkdir -p /overload/AudioTaunts /overload/AudioTaunts/external

# Environment defaults
ENV NODE_ENV=production \
    PORT=5173 \
    HOST=0.0.0.0 \
    OVERLOAD_PATH=/overload

# Synology / Docker port
EXPOSE 5173

# Persistent volume for Overload taunts and pilot profiles
VOLUME ["/overload"]

# Built-in lightweight healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5173) + '/healthz').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the standalone production server
CMD ["node", "dist-server/index.js"]
