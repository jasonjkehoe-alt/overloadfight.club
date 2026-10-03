# Overload Fight Club (overloadfight.club) Deployment Guide

This guide covers deployment for the complete **Overload Fight Club** platform (Historical Game Database, Real-time Ingestion, Pilot Profiles, Map Library, and Integrated Audio Taunt Maker workstation) to your **Synology NAS** or any Docker-enabled server.

---

## 1. Quick Deploy with Docker Compose (Recommended)

### On Synology NAS (Container Manager / Portainer / SSH)

1. **Clone or Copy the Project:**
   ```bash
   cd /volume1/docker
   git clone https://github.com/jasonjkehoe-alt/overloadfight.club.git
   cd overloadfight.club
   ```

2. **(Optional) Copy Existing Game Databases:**
   If you have an existing `cold_storage.db` (2.8 GB historical games archive) or `tracker.db`:
   - Copy them directly into the `/volume1/docker/overloadfight.club/data/` folder via Synology File Station, SCP, or Samba.
   - If starting fresh, the server will automatically create new SQLite databases upon startup and seed all official maps and live games.

3. **Start the Container:**
   - **Option A (Build from Source):**
     ```bash
     docker-compose up -d --build
     ```
   - **Option B (Use Pre-built GitHub Container Registry Image):**
     ```bash
     docker-compose -f docker-compose.prod.yml up -d
     ```

4. **Access the Application:**
   - Open your browser to `http://<YOUR_SYNOLOGY_IP>:3000` (e.g., `http://192.168.0.52:3000`).

---

## 2. Portainer Stack Setup

If deploying via Portainer on your Synology NAS:

1. In Portainer, go to **Stacks** > **+ Add stack**.
2. **Name:** `overloadfight-club`
3. **Build method:** Select **Repository**.
4. **Repository URL:** `https://github.com/jasonjkehoe-alt/overloadfight.club.git`
5. **Repository reference:** `refs/heads/main`
6. **Compose path:** `docker-compose.yml` (or `docker-compose.prod.yml` to pull pre-built GHCR image)
7. Click **Deploy the stack**.

---

## 3. Persistent Storage & Backup

All persistent data is stored in the host `./data` folder (`/volume1/docker/overloadfight.club/data`):
- `tracker.db` – Active / recent game matches, ELO ratings, pilot dossiers, and caches.
- `cold_storage.db` – Complete historical games archive (millions of rounds).
- `maps/` & `map_images/` – Synced custom maps and level preview screenshots.

To back up your platform, simply back up the `data/` folder.
