# Overload Fight Club (overloadfight.club)

A full-stack community platform, analytics engine, and workstation for the 6DOF shooter **Overload**.

## Platform Highlights

- **Historical Games Database & Cold Storage**: High-performance SQLite engine querying millions of historical rounds and telemetry across 8+ years of Overload matches.
- **Real-Time Game Monitoring & Live Match Tracker**: Automatic ingestion of live games, active servers, scoreboard changes, and match timelines.
- **Pilot Dossiers & Glicko-2 Ratings**: In-depth player analytics, head-to-head records, power rankings, weapon accuracy matrices, and Pilot Performance Intelligence (PPI).
- **Interactive Map Library**: Full level catalog synchronized with overloadmaps.com, complete with 3D map telemetry, author attribution, and level previews.
- **Integrated Audio Taunt Maker**: Comprehensive in-browser DAW for composing Overload multiplayer audio taunts, complete with multi-track timeline, anti-click zero-crossing fades, parametric gain, live microphone recorder, Web/YouTube import, and instant loadout export.

---

## Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts, Wavesurfer.js, WebAssembly FFmpeg.
- **Backend**: Node.js 22, Express, `better-sqlite3`, native Python engine for yt-dlp/ffmpeg media ingestion, Redis cache with in-memory fallback.
- **Deployment**: Docker, Docker Compose, Synology Container Manager/Portainer, GitHub Container Registry (`ghcr.io/jasonjkehoe-alt/overloadfight.club`).

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start development servers (frontend + backend watcher concurrently)
npm run dev

# 3. Access local dev server
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

---

## Production Deployment (Docker / Synology NAS)

```bash
# Clone the repository
git clone https://github.com/jasonjkehoe-alt/overloadfight.club.git
cd overloadfight.club

# Start container with persistent data volume
docker-compose up -d --build
```

Access the production dashboard at `http://<server-ip>:3000`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions on Synology NAS and Portainer.
