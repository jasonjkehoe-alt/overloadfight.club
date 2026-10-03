# Deploy Overload Fight Club to Synology NAS (Atomic Assets Deployment)
param(
    [string]$TargetRoot = "\\DS1515A\docker\overloadfight.club",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Overload Fight Club // Synology Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check destination availability
if (-not (Test-Path $TargetRoot)) {
    Write-Error "Cannot reach Synology target: $TargetRoot. Please ensure network share is mounted."
}

# 2. Build frontend if needed
if (-not $SkipBuild) {
    Write-Host "[1/4] Building production frontend bundle..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed with exit code $LASTEXITCODE"
    }
}

# 3. Step 1 of Atomic Deploy: Copy all new asset bundles first
Write-Host "[2/4] Uploading chunked asset bundles (/assets/*)..." -ForegroundColor Yellow
$targetDist = Join-Path $TargetRoot "dist"
$targetAssets = Join-Path $targetDist "assets"

if (-not (Test-Path $targetAssets)) {
    New-Item -ItemType Directory -Force -Path $targetAssets | Out-Null
}

# Copy new assets without deleting older ones (ensures open browser sessions don't 404)
Copy-Item -Path "dist/assets/*" -Destination $targetAssets -Recurse -Force
Write-Host "  -> All fingerprinted JS/CSS chunks are on disk." -ForegroundColor Green

# 4. Step 2 of Atomic Deploy: Copy workers, icons, manifests (excluding index.html)
Write-Host "[3/4] Uploading secondary root assets..." -ForegroundColor Yellow
Get-ChildItem -Path "dist" -File | Where-Object { $_.Name -notin @('index.html', 'version.json') } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $targetDist -Force
}

# 5. Step 3 of Atomic Deploy: Atomically flip index.html and version.json LAST
Write-Host "[4/4] Activating release: deploying index.html and version.json..." -ForegroundColor Yellow
Copy-Item -Path "dist/version.json" -Destination $targetDist -Force
Copy-Item -Path "dist/index.html" -Destination $targetDist -Force

# 6. Synchronize backend files (server, routes, package.json)
Write-Host "Synchronizing server backend..." -ForegroundColor Yellow
$targetServer = Join-Path $TargetRoot "server"
if (-not (Test-Path $targetServer)) {
    New-Item -ItemType Directory -Force -Path $targetServer | Out-Null
}
Copy-Item -Path "server/index.js" -Destination (Join-Path $targetServer "index.js") -Force
Copy-Item -Path "server/routes.js" -Destination (Join-Path $targetServer "routes.js") -Force
Copy-Item -Path "server/db.js" -Destination (Join-Path $targetServer "db.js") -Force
Copy-Item -Path "package.json" -Destination (Join-Path $TargetRoot "package.json") -Force
Copy-Item -Path "package-lock.json" -Destination (Join-Path $TargetRoot "package-lock.json") -Force

Write-Host "==========================================" -ForegroundColor Green
Write-Host " Deployment Complete! Atomic release active." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
