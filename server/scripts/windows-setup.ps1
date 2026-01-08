# STEM Center Backend - Windows Setup Script
# Run this as Administrator in PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEM Center Backend Setup (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$CLOUDFLARED_TOKEN = "eyJhIjoiYjk0MzRhMjNhZjQ4NjVkZGYwNjcwZGU0ZWM4NTA0NzgiLCJ0IjoiZTIyNzE0YjAtY2Q1Mi00ZGUwLWFhZjktMDY4NmE1ZTU0MGNlIiwicyI6IlpURmhZVFV5WXpndE9UTXhOaTAwT0RGaUxXSTVNMk10TURKaE5tVTNOVFU0TXpKaCJ9"
$INSTALL_DIR = "$env:USERPROFILE\stem-center-backend"

# Step 1: Install cloudflared
Write-Host "[1/5] Installing cloudflared..." -ForegroundColor Yellow

$cloudflaredPath = "$env:ProgramFiles\cloudflared\cloudflared.exe"
if (Test-Path $cloudflaredPath) {
    Write-Host "  cloudflared already installed" -ForegroundColor Green
} else {
    Write-Host "  Downloading cloudflared..."
    $cloudflaredUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi"
    $installerPath = "$env:TEMP\cloudflared.msi"
    Invoke-WebRequest -Uri $cloudflaredUrl -OutFile $installerPath

    Write-Host "  Installing cloudflared (requires Admin)..."
    Start-Process msiexec.exe -ArgumentList "/i", $installerPath, "/quiet" -Wait
    Remove-Item $installerPath
    Write-Host "  cloudflared installed!" -ForegroundColor Green
}

# Step 2: Pull Ollama models
Write-Host ""
Write-Host "[2/5] Pulling Ollama models..." -ForegroundColor Yellow

Write-Host "  Pulling llama3.1:8b (this may take a while)..."
ollama pull llama3.1:8b

Write-Host "  Pulling nomic-embed-text..."
ollama pull nomic-embed-text

Write-Host "  Models ready!" -ForegroundColor Green

# Step 3: Setup backend directory
Write-Host ""
Write-Host "[3/5] Setting up backend server..." -ForegroundColor Yellow

if (Test-Path $INSTALL_DIR) {
    Write-Host "  Directory exists, pulling latest..."
    Set-Location $INSTALL_DIR
    git pull
} else {
    Write-Host "  Cloning repository..."
    git clone https://github.com/YOUR_USERNAME/stem-center-chatbot.git $INSTALL_DIR
    Set-Location $INSTALL_DIR
}

Set-Location "$INSTALL_DIR\server"
Write-Host "  Installing dependencies..."
npm install

Write-Host "  Backend setup complete!" -ForegroundColor Green

# Step 4: Create .env file
Write-Host ""
Write-Host "[4/5] Creating environment file..." -ForegroundColor Yellow

$envContent = @"
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
ALLOWED_ORIGINS=https://stem-center-chatbot.vercel.app,http://localhost:3000
"@

$envPath = "$INSTALL_DIR\server\.env"
if (-not (Test-Path $envPath)) {
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "  Created .env file at $envPath" -ForegroundColor Green
    Write-Host "  IMPORTANT: Edit this file with your actual Supabase credentials!" -ForegroundColor Red
} else {
    Write-Host "  .env file already exists" -ForegroundColor Green
}

# Step 5: Install Cloudflare Tunnel service
Write-Host ""
Write-Host "[5/5] Installing Cloudflare Tunnel service..." -ForegroundColor Yellow

& "$env:ProgramFiles\cloudflared\cloudflared.exe" service install $CLOUDFLARED_TOKEN
Write-Host "  Cloudflare Tunnel service installed!" -ForegroundColor Green

# Create startup script
Write-Host ""
Write-Host "Creating startup script..." -ForegroundColor Yellow

$startupScript = @"
@echo off
echo Starting STEM Center Backend...
echo.

:: Start Ollama if not running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting Ollama...
    start "" ollama serve
    timeout /t 5 /nobreak >NUL
)

:: Start the backend server
echo Starting backend server...
cd /d "$INSTALL_DIR\server"
npm run start
"@

$startupPath = "$INSTALL_DIR\start-backend.bat"
$startupScript | Out-File -FilePath $startupPath -Encoding ASCII
Write-Host "  Created startup script: $startupPath" -ForegroundColor Green

# Done!
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit $INSTALL_DIR\server\.env with your Supabase credentials"
Write-Host "2. Run $startupPath to start the backend"
Write-Host ""
Write-Host "The Cloudflare Tunnel is now running as a Windows service."
Write-Host "Your backend will be available at: https://stem-api.meetpratham.me"
Write-Host ""
