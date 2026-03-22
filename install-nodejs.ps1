# TomarsCloud - Auto Node.js Installation Script
# This script downloads and installs Node.js LTS on Windows

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  TomarsCloud - Node.js Installation Script    " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is already installed
Write-Host "🔍 Checking if Node.js is already installed..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js is already installed: $nodeVersion" -ForegroundColor Green
    npm --version
    Write-Host ""
    Write-Host "You can now run: npm install" -ForegroundColor Yellow
    exit 0
}

Write-Host "❌ Node.js not found. Installing now..." -ForegroundColor Red
Write-Host ""

# Download Node.js LTS
$NodeVersion = "20.11.0"
$NodeUrl = "https://nodejs.org/dist/v${NodeVersion}/node-v${NodeVersion}-x64.msi"
$InstallerPath = "$env:TEMP\node-installer.msi"

Write-Host "📥 Downloading Node.js LTS v${NodeVersion}..." -ForegroundColor Cyan
Write-Host "   URL: $NodeUrl" -ForegroundColor Gray

try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $NodeUrl -OutFile $InstallerPath -UseBasicParsing
    Write-Host "✅ Download complete!" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Installation:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Download LTS version" -ForegroundColor White
    Write-Host "3. Run the installer and follow prompts" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "⚙️  Installing Node.js..." -ForegroundColor Cyan
Write-Host "   (This may take a few minutes...)" -ForegroundColor Gray

# Run installer silently
Start-Process -FilePath $InstallerPath -ArgumentList "/quiet /norestart" -Wait -NoNewWindow

Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host "🔍 Verifying installation..." -ForegroundColor Cyan
$nodeVersion = node --version 2>&1
$npmVersion = npm --version 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js installed successfully!" -ForegroundColor Green
    Write-Host "   Node: $nodeVersion" -ForegroundColor Green
    Write-Host "   npm: $npmVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Ready to proceed with TomarsCloud setup!     " -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open PowerShell" -ForegroundColor White
    Write-Host "2. Run: cd C:\\tomarscloud-backend" -ForegroundColor White
    Write-Host "3. Run: npm install" -ForegroundColor White
    Write-Host "4. Run: npm start" -ForegroundColor White
} else {
    Write-Host "Verification failed. Please restart your terminal and try again." -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item $InstallerPath -Force -ErrorAction SilentlyContinue
