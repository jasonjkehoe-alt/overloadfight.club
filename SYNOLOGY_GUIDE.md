# Synology NAS Deployment & Auto-Update Guide

Complete guide for deploying, running, and automatically updating **Overload Audio Taunt Maker 2.0** on a **Synology DiskStation DS1515+** (and any other x86_64 or ARM64 Synology NAS).

---

## Hardware & Compatibility Note (Synology DS1515+)

- **CPU**: Intel Atom C2538 (64-bit quad-core x86_64)
- **RAM**: 2 GB – 16 GB DDR3
- **DSM**: DSM 7.1 (or DSM 7.2)
- **Container Engine**: **Container Manager** (DSM 7.2+) or **Docker** (DSM 6.x / 7.0 / 7.1)
- **Architecture**: Native `linux/amd64` container support. No emulation needed.

---

## Method 1: Synology Container Manager (DSM 7.2+ UI) — Recommended

### Step 1: Prepare the Folder in File Station
1. Open **File Station** in DSM.
2. Inside your `docker/` shared folder (e.g. `/volume1/docker/`), create a new folder named `overload-taunt-maker`.
3. Inside `overload-taunt-maker`, create an `overload-data` folder (this stores your game taunts and pilot files).

### Step 2: Create Container Manager Project
1. Open **Container Manager** from the DSM Main Menu.
2. In the left sidebar, click **Project**, then click **Create**.
3. Fill in the fields:
   - **Project Name**: `overload-taunt-maker`
   - **Path**: Click Set Path and select `/docker/overload-taunt-maker`
   - **Source**: Select **Create docker-compose.yml**
4. Paste the following configuration:

```yaml
version: '3.8'

services:
  overload-taunt-maker:
    image: ghcr.io/<YOUR_GITHUB_USERNAME>/overload-taunt-maker:latest
    container_name: overload-taunt-maker
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - PORT=5173
      - HOST=0.0.0.0
      - OVERLOAD_PATH=/overload
    volumes:
      - ./overload-data:/overload
```
*(Replace `<YOUR_GITHUB_USERNAME>` with your GitHub username or organization name).*

5. Click **Next** -> **Next** -> **Done**.
6. Container Manager will pull the image and launch the container.
7. Open your browser and navigate to:
   ```
   http://<YOUR-SYNOLOGY-IP>:5173
   ```

---

## Method 2: Git Clone & Local Build on Synology (DSM 7.1 / Docker Package)

If your DS1515+ is running DSM 7.1 or you want to build directly from the git repository on the NAS:

### Step 1: SSH into your Synology NAS
Enable SSH in DSM under **Control Panel > Terminal & SNMP > Enable SSH service**, then connect:
```bash
ssh admin@<YOUR-SYNOLOGY-IP>
```

### Step 2: Clone and Start
```bash
# Navigate to your docker share
cd /volume1/docker

# Clone your GitHub repository
git clone https://github.com/<YOUR_GITHUB_USERNAME>/overload-taunt-maker.git
cd overload-taunt-maker

# Start with docker-compose
docker-compose up -d --build
```

---

## How Automatic Updates Work When You Push to GitHub

You have three options for updating:

### Option A: 100% Automated Zero-Click Updates with Watchtower (Recommended)
Add **Watchtower** to your `docker-compose.yml`. Watchtower will silently monitor your GitHub Container Registry image and automatically restart your container whenever you push a new commit to `main`!

In your `docker-compose.yml`, uncomment or add:
```yaml
  watchtower:
    image: containrrr/watchtower:latest
    container_name: overload-watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup overload-taunt-maker
```
- `--interval 300`: Checks every 5 minutes for new images published on GitHub.
- `--cleanup`: Deletes old container layers to keep NAS storage clean.

### Option B: DSM Task Scheduler (Scheduled Daily/Hourly Update)
In DSM **Control Panel > Task Scheduler**:
1. Click **Create > Scheduled Task > User-defined script**.
2. **General**: Name it `Update Overload Taunt Maker`, User: `root`.
3. **Schedule**: Run daily or every 6 hours.
4. **Task Settings > User-defined script**:
```bash
cd /volume1/docker/overload-taunt-maker
sh synology-update.sh
```
5. Click **OK**.

### Option C: Manual Update via Container Manager GUI
1. Open **Container Manager > Image**.
2. Select `ghcr.io/<YOUR_GITHUB_USERNAME>/overload-taunt-maker:latest` and click **Update** (or **Action > Pull**).
3. Go to **Container**, select `overload-taunt-maker`, and click **Action > Restart**.

---

## Connecting Overload on PC to Synology NAS

To sync your taunts and pilot profiles seamlessly between your PC game and the Synology web interface:

### Option 1: Synology Drive Client (Real-time 2-way Sync)
1. Install **Synology Drive Server** on your Synology NAS.
2. In DSM, enable Team Folder or create a sync folder inside `/volume1/docker/overload-taunt-maker/overload-data/AudioTaunts`.
3. Install **Synology Drive Client** on your gaming PC.
4. Create a 2-way sync task between:
   - **PC**: `%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts`
   - **NAS**: `/docker/overload-taunt-maker/overload-data/AudioTaunts`
5. Now, any taunt you create or equip on the Synology web UI automatically appears in your game on PC in real-time!

### Option 2: Windows Directory Junction (SMB Mount)
Map your Synology shared folder in Windows, then create a symbolic directory link:
```cmd
:: Run in Windows Command Prompt (cmd.exe) as Administrator:
mklink /D "%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts" "\\<SYNOLOGY-IP>\docker\overload-taunt-maker\overload-data\AudioTaunts"
```

---

## Troubleshooting & Tips

- **Port Conflict (5173)**: If port 5173 is already in use by another DSM container, change the port mapping in `docker-compose.yml` to `"8095:5173"` and visit `http://<YOUR-SYNOLOGY-IP>:8095`.
- **File Permissions**: Ensure the `overload-data` directory on the NAS has read/write permissions for the `docker` user/group.
- **Firewall**: If DSM Firewall is enabled (**Control Panel > Security > Firewall**), ensure incoming connections on port `5173` are allowed.
- **Health Check**: Test server health anytime by visiting `http://<YOUR-SYNOLOGY-IP>:5173/healthz`.
