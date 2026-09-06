# Overload Audio Taunt Maker

A high-performance, standalone client-side audio tool for crafting game-compliant `.ogg` audio taunts for [Overload](https://playoverload.com/) and [OLMod](https://github.com/overload-development-community/olmod).

## Features

- **Interactive Waveform Visualizer**: WaveSurfer.js waveform display with drag-and-drop region selection and loop playback.
- **Audio Processing Pipeline**:
  - Automatically strips leading silence.
  - Downmixes audio to **Mono** (required for 3D positional game audio).
  - Encodes directly to **Vorbis .ogg** (Quality 4) in-browser using WebAssembly FFmpeg (`@ffmpeg/ffmpeg`).
  - Strict duration limit enforcement (0.5s – 3.0s).
  - Real-time size validation against Overload's 128 kB packet limit.
- **Local History Library**: Stores all recent exports in browser `IndexedDB` with inline audio preview, renaming, and re-downloading.
- **In-Game Guide**: Built-in instructions and folder path references for Windows, Linux, and macOS.

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
```

This compiles a fully static, standalone single-page application into `dist/`, which can be served by any static web server (Nginx, Docker, GitHub Pages, or Synology NAS).

## Taunt Installation Paths

Drop your exported `.ogg` files into your Overload `AudioTaunts` directory:

- **Windows**: `%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts`
  *(e.g., `C:\Users\<Username>\AppData\LocalLow\Revival\Overload\AudioTaunts`)*
- **Linux**: `~/.config/unity3d/Revival/Overload/AudioTaunts`
- **macOS**: `~/Library/Application Support/Revival/Overload/AudioTaunts`
