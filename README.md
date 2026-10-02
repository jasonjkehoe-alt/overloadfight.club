# Overload Audio Taunt Maker 2.0 🚀

A high-performance audio workstation and bridge tool for crafting game-compliant `.ogg` audio taunts for [Overload](https://playoverload.com/) and [OLMod](https://github.com/overload-development-community/olmod).

Run it locally on your PC or deploy it effortlessly to a **Synology NAS (DS1515+ & more)**, Raspberry Pi, or any Docker server.

---

## ✨ Features

- **Interactive Waveform Visualizer**:
  - WaveSurfer.js waveform display with drag-and-drop region selection and loop playback.
  - Interactive playback head, time ruler, and live preview.
- **Audio Processing Pipeline**:
  - Automatically strips leading silence.
  - Downmixes audio to **Mono** (mandatory for 3D positional game audio).
  - Encodes directly to **Vorbis .ogg** (Quality 4) in-browser using WebAssembly FFmpeg (`@ffmpeg/ffmpeg`).
  - Strict duration limit enforcement (0.5s – 3.0s).
  - Real-time size validation against Overload's 128 kB packet limit.
  - DSP volume booster (+1 dB to +18 dB) and soft anti-click fades (10ms – 50ms).
- **Overload Vault & Live Bridge**:
  - Reads active pilot configs (`<PilotName>.extendedconfig`) directly.
  - Scans both personal taunts (`AudioTaunts/`) and opponent taunts (`AudioTaunts/external/`).
  - **1-Click Installation**: Writes directly into the game's `AudioTaunts/` folder.
  - **Mandatory Automatic Backups**: Automatically backs up pilot config files with timestamped snapshots into `Pilot Backup/` before making any modifications.
  - **Auto-Promotion**: Automatically promotes opponent taunts from `AudioTaunts/external/` to `AudioTaunts/` when assigned to a pilot slot.
- **6-Slot Loadout Manager**:
  - Visual 6-slot pilot loadout view matching in-game hotkeys.
  - Instant pilot switching, taunt assignment, and export.
- **Audio Import & Web Mining**:
  - **YouTube & Web Extractor**: Extract audio from YouTube and web URLs on-the-fly via server-side `yt-dlp`.
  - **Internet Archive Search**: Browse and import public domain sounds directly into the waveform editor.
  - **Microphone Recorder**: Record your own voice taunts directly in the browser with live level meters.
- **Cross-Platform & Synology Ready**:
  - Native Docker support with multi-arch images (`amd64` and `arm64`).
  - Dedicated Synology NAS support (DSM 7.2 Container Manager & DSM 7.0/6.x Docker).
  - Automated auto-updating via GitHub Actions and Watchtower.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3 with `yt-dlp` (optional, for YouTube audio extraction)

```bash
# Clone the repository
git clone https://github.com/<your-github-username>/overload-taunt-maker.git
cd overload-taunt-maker

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🐳 Docker & Synology NAS Deployment

Deploying on a Synology NAS (such as the **DS1515+**) takes just a few clicks.

### Quick Start with Docker Compose

```yaml
services:
  overload-taunt-maker:
    image: ghcr.io/<your-github-username>/overload-taunt-maker:latest
    container_name: overload-taunt-maker
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - PORT=5173
      - OVERLOAD_PATH=/overload
    volumes:
      - ./overload-data:/overload
```

Run:
```bash
docker compose up -d
```

Visit `http://<your-synology-ip>:5173` in your browser.

📖 **For detailed step-by-step DSM GUI instructions, automatic updating with Watchtower, and game directory sync instructions, read the [Synology NAS Deployment Guide](SYNOLOGY_GUIDE.md).**

---

## 🔄 Updating from GitHub

When you push new changes to GitHub, you can update your Synology NAS using any of these methods:

1. **Automatic (Zero clicks)**: Enable the optional `watchtower` service in `docker-compose.yml`. Watchtower will check GitHub Container Registry every 5 minutes and automatically update the container whenever you push to `main`!
2. **DSM Container Manager GUI**: In DSM Container Manager, go to **Project**, select `overload-taunt-maker`, and click **Action > Rebuild / Update**.
3. **Shell Script**: Run `sh synology-update.sh` on the NAS.

---

## 📁 Taunt Installation Paths (Reference)

Drop exported `.ogg` files into your Overload `AudioTaunts` directory:

- **Windows**: `%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts`
  *(e.g., `C:\Users\<Username>\AppData\LocalLow\Revival\Overload\AudioTaunts`)*
- **Linux**: `~/.config/unity3d/Revival/Overload/AudioTaunts`
- **macOS**: `~/Library/Application Support/Revival/Overload/AudioTaunts`
- **Docker / Synology**: `/overload/AudioTaunts`

---

## 🛠️ Build Commands

```bash
# Build both client and standalone production server
npm run build

# Start production server
npm start

# Run standalone server directly
node dist-server/index.js
```

---

## 📄 License

MIT License. Designed with ❤️ for the Revival Productions Overload 6DOF community.
