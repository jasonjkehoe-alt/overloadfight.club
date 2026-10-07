# Build stage: compiles better-sqlite3, builds the client, then drops dev dependencies.
FROM node:22-alpine AS build

WORKDIR /app

# Toolchain for native modules (better-sqlite3). .git is not in the build context,
# so generate-version.js keeps the hash already in public/version.json.
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# Runtime stage: no compiler or git, runs as the image's unprivileged node user (uid 1000).
FROM node:22-alpine

WORKDIR /app

# ffmpeg and yt-dlp for audio import; pip is removed again in the same layer
RUN apk add --no-cache ffmpeg python3 py3-pip \
    && pip install --no-cache-dir --break-system-packages yt-dlp \
    && apk del py3-pip

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# The server writes databases and backups to /app/data (the volume) and admin uploads to /app/uploads
RUN mkdir -p data uploads && chown node:node data uploads

USER node

EXPOSE 3000

ENV NODE_ENV=production

# /api/health queries both databases. The start period covers the one-time game_players backfill.
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# node as PID 1, not npm, so docker stop's SIGTERM reaches the server's shutdown handler
CMD ["node", "server/index.js"]
