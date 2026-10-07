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
- `backups/` – Nightly copies of both databases (see below).

### File ownership

The container runs as the unprivileged `node` user (uid 1000, gid 1000), not as root. Images built before this change ran as root, so the files they left in `data/` belong to root and the new image cannot write to them. It then refuses to start and logs `Refusing to start: /app/data/tracker.db is not writable by uid 1000`. Once, before the first start of the new image:

```bash
cd /volume1/docker/overloadfight.club
sudo docker-compose -f docker-compose.prod.yml down
sudo chown -R 1000:1000 data
sudo docker-compose -f docker-compose.prod.yml up -d
```

### Nightly backups

At 03:00 (container time, `TZ=America/Chicago`) the server copies `tracker.db` and `cold_storage.db` through SQLite's backup API into `data/backups/YYYY-MM-DD/`, before that night's move of old games to cold storage. The copy is written to `data/backups/YYYY-MM-DD.partial/` and renamed when both files are complete, so a dated folder always holds a matching pair. The 7 newest dated folders are kept; older ones are deleted after each successful run. Each folder holds a full copy of both files, so the backups take about 7 times the size of the two databases (the cold archive is about 2.8 GB), plus one more copy while a run is in progress. They sit on the same volume as the live files, so they cover bad writes and bad deploys, not disk loss: include `data/backups/` in the NAS's own backup job to keep a copy elsewhere.

### Restoring

Only `tracker.db` (recent games and caches): upload `data/backups/<day>/tracker.db` on the admin page (Backup & Restore). The server writes it into the live database; no restart is needed.

Both files, or `cold_storage.db`: stop the container, replace the files, and remove the old write-ahead logs. A `-wal` file left from the old database must not be replayed onto the restored one.

```bash
cd /volume1/docker/overloadfight.club
sudo docker-compose -f docker-compose.prod.yml stop
cd data
sudo rm -f tracker.db-wal tracker.db-shm cold_storage.db-wal cold_storage.db-shm
sudo cp backups/2026-10-06/tracker.db backups/2026-10-06/cold_storage.db .
sudo chown 1000:1000 tracker.db cold_storage.db
cd ..
sudo docker-compose -f docker-compose.prod.yml start
```

The backups carry the `game_players` table and its version marker, so the server does not rebuild the table after a restore.

### Health and logs

The container's healthcheck calls `/api/health`, which runs a query on both databases and answers 503 if either fails. `docker ps` shows the result. Docker keeps at most three 10 MB log files for the container (`logging` in the compose files). `docker stop` lets the server close both databases before it exits.
