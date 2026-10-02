# Overload Fight Club (overloadfight.club) 🚀

The official community platform and combat station for [Overload](https://playoverload.com/) and [OLMod](https://github.com/overload-development-community/olmod) 6DOF pilots.

**overloadfight.club** combines live server tracking, pilot and player profiles, a combat audio taunt workstation, and a real-time game bridge into a unified web application that runs on PC, Docker, and **Synology NAS (DS1515+ and more)**.

---

## ⚡ Platform Overview

### 1. 📡 Server Tracker & Match Browser
- Live visibility into active Overload community game servers and matches.
- Real-time player counts, match modes (Anarchy, Team Anarchy, Countdown), ping, and map rotations.
- Direct-connect helpers and lobby status.

### 2. 👤 Player Tracker & Pilot Profiles
- Pilot management and configuration parser for Overload's `.extendedconfig` files.
- Active pilot switching (e.g. `Soup` and custom pilot profiles).
- Pilot loadout configuration with keybinding mapping for in-game hotkeys (F1–F6).

### 3. 🎛️ Audio Taunt Workstation & Sound Designer
- **Waveform Timeline**: Interactive WaveSurfer.js waveform visualizer with drag-and-drop region selection, loop playback, and precise millisecond scrubbing.
- **Audio Processing Pipeline**:
  - Automatically trims leading silence.
  - Downmixes audio to **Mono** (mandatory for 3D positional game audio).
  - Encodes directly to **Vorbis .ogg** (Quality 4) in-browser using WebAssembly FFmpeg (`@ffmpeg/ffmpeg`).
  - Strict duration enforcement (0.5s – 3.0s).
  - Real-time payload size validation against Overload's 128 kB network packet limit.
  - DSP volume booster (+1 dB to +18 dB) and soft anti-click fades (10ms – 50ms).
- **Web & YouTube Audio Extractor**: Pull audio from YouTube and web URLs on-the-fly via server-side `yt-dlp`.
- **Internet Archive Miner**: Search and preview thousands of vintage arcade, sci-fi, and public domain sound effects directly into the timeline.
- **Microphone Recorder**: Record voice taunts directly in the browser with live input level meters.

### 4. 🔗 Live Overload Bridge & Vault
- **1-Click Game Installation**: Installs crafted taunts directly into your game's `AudioTaunts/` directory.
- **Auto-Promotion**: Automatically detects opponent taunts in `AudioTaunts/external/` and promotes them into your personal `AudioTaunts/` folder so OLMod accepts them in active loadouts.
- **Mandatory Automatic Backups**: Automatically backs up pilot config files with timestamped snapshots into `Pilot Backup/` before making any modifications.

### 5. 🐳 Docker & Synology NAS Host Ready
- Native multi-architecture container images (`linux/amd64` and `linux/arm64`).
- Specifically optimized for **Synology DS1515+** (Intel Atom C2538 64-bit quad-core) and any Synology DSM 7.x / 6.x NAS with Container Manager or Docker.
- Zero-click automatic updates with Watchtower.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3 with `yt-dlp` (optional, for YouTube audio extraction)

```bash
# Clone the repository
git clone https://github.com/jasonjkehoe-alt/overloadfight.club.git
cd overloadfight.club

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🐳 Docker & Synology NAS Deployment

Deploying **overloadfight.club** on a Synology NAS (such as the **DS1515+**) takes just a few clicks.

### Quick Start with Docker Compose

```yaml
version: '3.8'

services:
  overloadfight-club:
    image: ghcr.io/jasonjkehoe-alt/overloadfight.club:latest
    container_name: overloadfight-club
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - PORT=5173
      - OVERLOAD_PATH=/overload
    volumes:
      - ./overload-data:/overload

  # --------------------------------------------------------------------------
  # OPTIONAL: Watchtower for 100% Automated Zero-Click Updates
  # --------------------------------------------------------------------------
  watchtower:
    image: containrrr/watchtower:latest
    container_name: overloadfight-watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup overloadfight-club
```

Run:
```bash
docker compose up -d
```

Visit `http://<YOUR-SYNOLOGY-IP>:5173` in your browser.

📖 **For detailed step-by-step DSM GUI instructions, DSM Reverse Proxy configuration, and real-time game file syncing with Synology Drive, read the [Synology NAS Deployment Guide](SYNOLOGY_GUIDE.md).**

---

## 🔄 Automatic Updates When You Push to GitHub

When you push new code or features to GitHub (`git push origin main`):

1. **GitHub Actions** automatically builds multi-arch Docker images and pushes them to GitHub Container Registry (`ghcr.io/jasonjkehoe-alt/overloadfight.club:latest`).
2. **Watchtower** on your Synology NAS detects the updated image within 5 minutes, pulls the latest layers, and restarts the container automatically!
3. Alternatively, you can update manually with 1 click in DSM Container Manager or by running `sh synology-update.sh`.

---

## 📁 Overload Game File Locations (Reference)

- **Windows**: `%LOCALAPPDATA%Low\Revival\Overload`
  *(e.g., `C:\Users\<Username>\AppData\LocalLow\Revival\Overload`)*
  - Audio Taunts: `%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts`
  - Pilot Configs: `%LOCALAPPDATA%Low\Revival\Overload\<PilotName>.extendedconfig`
- **Linux**: `~/.config/unity3d/Revival/Overload`
- **macOS**: `~/Library/Application Support/Revival/Overload`
- **Docker / Synology**: `/overload`

---

## 🛠️ Build & Server Commands

```bash
# Build both the client SPA and standalone production server
npm run build

# Start the production server
npm start

# Run the standalone Node.js production server directly
node dist-server/index.js
```

---

## 📄 License

MIT License. Crafted for the Revival Productions Overload & OLMod 6DOF Community.
