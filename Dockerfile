FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install build dependencies for native modules (better-sqlite3), git for version info, plus ffmpeg and yt-dlp for audio import
RUN apk add --no-cache python3 py3-pip make g++ git ffmpeg curl \
    && pip install --no-cache-dir --break-system-packages yt-dlp

# Install ALL dependencies (including devDeps for building)
RUN npm install

# Copy application files
COPY . .

# Build the frontend
RUN npm run build

# Remove dev dependencies to keep image small
RUN npm prune --omit=dev

# Expose port
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
