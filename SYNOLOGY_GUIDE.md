# Synology NAS Deployment & Auto-Update Guide
## Overload Fight Club (overloadfight.club)

Complete step-by-step guide for hosting and automatically updating the **Overload Fight Club (`overloadfight.club`)** platform on a **Synology DiskStation DS1515+** (and any other x86_64 or ARM64 Synology NAS).

---

## ⚡ What is Overload Fight Club (`overloadfight.club`)?

**Overload Fight Club** is the unified community and combat station for the Overload 6DOF pilot community:

1. **Server & Match Tracking**: Monitor active community game servers, maps, and match states.
2. **Player Tracker & Pilot Profiles**: Manage pilot identities, configs, and in-game assignments.
3. **Audio Taunt Workstation**: Interactive audio editor, mono downmixing, Vorbis `.ogg` encoding, YouTube audio extraction, and Internet Archive audio mining.
4. **Live Overload Bridge**: Automatically parses pilot configuration files (`.extendedconfig`), provides 1-click taunt installation, opponent taunt promotion, and mandatory timestamped config backups.

---

## 🖥️ Synology DS1515+ Hardware & Architecture Note

- **Processor**: Intel Atom C2538 (64-bit quad-core x86_64 / amd64).
- **RAM**: 2 GB – 16 GB DDR3.
- **DSM Version**: DSM 7.1 (or DSM 7.2).
- **Container Package**: **Container Manager** (DSM 7.2+) or **Docker** (DSM 7.1 / 7.0 / 6.x).
- **Architecture**: Native `linux/amd64` container support. Runs seamlessly with zero emulation overhead.

---

## 🚀 Method 1: Synology Container Manager (DSM 7.2+ UI) — Recommended

### Step 1: Create the Folder in File Station
1. Open **File Station** in DSM.
2. Inside your `docker/` shared folder (e.g. `/volume1/docker/`), create a new folder named `overloadfight.club`.
3. Inside `overloadfight.club`, create an `overload-data` folder (this stores persistent game taunts, pilot backups, and server data).

### Step 2: Create Container Manager Project
1. Open **Container Manager** from the DSM Main Menu.
2. In the left sidebar, click **Project**, then click **Create**.
3. Fill in the fields:
   - **Project Name**: `overloadfight.club`
   - **Path**: Click **Set Path** and select `/docker/overloadfight.club`
   - **Source**: Select **Create docker-compose.yml**
4. Paste the following configuration:

```yaml
version: '3.8'

services:
  overloadfight-club:
    image: ghcr.io/<YOUR_GITHUB_USERNAME>/overloadfight.club:latest
    container_name: overloadfight-club
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - PORT=5173
      - HOST=0.0.0.0
      - OVERLOAD_PATH=/overload
    volumes:
      - ./overload-data:/overload

  # --------------------------------------------------------------------------
  # OPTIONAL: Watchtower for 100% Automated Zero-Click Updates
  # Watchtower checks GitHub Container Registry every 5 minutes and automatically
  # redeploys the container whenever you push new changes to GitHub!
  # --------------------------------------------------------------------------
  watchtower:
    image: containrrr/watchtower:latest
    container_name: overloadfight-watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup overloadfight-club
```
*(Replace `<YOUR_GITHUB_USERNAME>` with your GitHub username or organization).*

5. Click **Next** -> **Next** -> **Done**.
6. Container Manager will download the container and start `overloadfight.club`.
7. Open your browser and navigate to:
   ```
   http://<YOUR-SYNOLOGY-IP>:5173
   ```

---

## 🛠️ Method 2: Git Clone & Local Build on Synology (DSM 7.1 Docker)

If your DS1515+ runs DSM 7.1 or you want to build directly from the git repository on the NAS:

### Step 1: SSH into your Synology NAS
Enable SSH in DSM under **Control Panel > Terminal & SNMP > Enable SSH service**, then connect from your terminal:
```bash
ssh admin@<YOUR-SYNOLOGY-IP>
```

### Step 2: Clone and Start
```bash
# Navigate to the docker shared folder
cd /volume1/docker

# Clone the repository
git clone https://github.com/<YOUR_GITHUB_USERNAME>/overloadfight.club.git
cd overloadfight.club

# Build and start container
docker-compose up -d --build
```

---

## 🔄 How Automatic Updates Work When You Push to GitHub

Every time you push new code to your `main` branch on GitHub:

```bash
git add .
git commit -m "feat: new server and player tracker features"
git push origin main
```

GitHub Actions automatically builds the multi-arch Docker image and pushes it to **GitHub Container Registry (`ghcr.io/<YOUR_GITHUB_USERNAME>/overloadfight.club:latest`)**.

You can update your Synology NAS using any of these methods:

### Option A: 100% Automated Zero-Click Updates with Watchtower (Recommended)
With the `watchtower` service enabled in your `docker-compose.yml`, Watchtower will silently check GitHub every 5 minutes. The moment GitHub Actions finishes publishing, Watchtower pulls the new image and restarts `overloadfight.club` with zero manual clicks required!

### Option B: DSM Task Scheduler (Scheduled Daily/Hourly Update)
In DSM **Control Panel > Task Scheduler**:
1. Click **Create > Scheduled Task > User-defined script**.
2. **General**: Name: `Update OverloadFight.Club`, User: `root`.
3. **Schedule**: Run daily or every 6 hours.
4. **Task Settings > User-defined script**:
```bash
cd /volume1/docker/overloadfight.club
sh synology-update.sh
```
5. Click **OK**.

### Option C: Manual Update via DSM Container Manager GUI
1. Open **Container Manager > Image**.
2. Select `ghcr.io/<YOUR_GITHUB_USERNAME>/overloadfight.club:latest` and click **Update** (or **Action > Pull**).
3. Go to **Container**, select `overloadfight-club`, and click **Action > Restart**.

---

## 🎮 Connecting PC Overload Game Files to Synology NAS

To sync your taunts, pilot profiles, and server data seamlessly between your gaming PC and your Synology NAS:

### Option 1: Synology Drive Client (Real-time 2-way Sync)
1. Install **Synology Drive Server** on your Synology NAS from Package Center.
2. In DSM, create a sync folder inside `/volume1/docker/overloadfight.club/overload-data/AudioTaunts`.
3. Install **Synology Drive Client** on your gaming PC.
4. Create a 2-way sync task between:
   - **PC**: `%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts`
   - **NAS**: `/docker/overloadfight.club/overload-data/AudioTaunts`
5. Any taunt crafted or assigned on the web app automatically appears in your game on PC in real-time!

### Option 2: Windows Directory Junction (SMB Network Share)
Map the Synology share in Windows Explorer, then create a symbolic directory link:
```cmd
:: Run in Windows Command Prompt (cmd.exe) as Administrator:
mklink /D "%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts" "\\<SYNOLOGY-IP>\docker\overloadfight.club\overload-data\AudioTaunts"
```

---

## 🌐 Setting Up Custom Domain or DSM Reverse Proxy

If you want to access the site at `https://overloadfight.club` or a local domain name without specifying port `5173`:

1. Open DSM **Control Panel > Login Portal > Advanced > Reverse Proxy**.
2. Click **Create**:
   - **Source**:
     - Protocol: `HTTPS`
     - Hostname: `overloadfight.club` (or `overload.local`)
     - Port: `443`
     - Enable HSTS: Checked
   - **Destination**:
     - Protocol: `HTTP`
     - Hostname: `localhost`
     - Port: `5173`
3. Under **Custom Header**, click **Create > WebSocket** (adds `Upgrade` and `Connection` headers for real-time live streaming).
4. Click **Save**. Now you can access the platform via clean HTTPS!

---

## 🩺 Health Check & Monitoring

You can verify the status of the container anytime at:
```
http://<YOUR-SYNOLOGY-IP>:5173/healthz
```
Returns:
```json
{
  "status": "ok",
  "uptime": 1248.5,
  "version": "2.0.0",
  "overloadDir": "/overload"
}
```
