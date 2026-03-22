@echo off
REM TomarsCloud - Node.js Installation Script
REM This script downloads and installs Node.js LTS

echo.
echo ===============================================
echo   TomarsCloud - Node.js Installation
echo ===============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Node.js is already installed!
    node --version
    npm --version
    echo.
    echo You can now run: npm install
    pause
    exit /b 0
)

echo Node.js not found. Downloading installer...
echo.

REM Download Node.js LTS v20.11.0
set NODE_VERSION=20.11.0
set NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-x64.msi
set INSTALLER=%TEMP%\node-installer.msi

echo Downloading from: %NODE_URL%
powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%INSTALLER%' -UseBasicParsing"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Download failed! Please visit:
    echo https://nodejs.org/
    echo And download the LTS version manually
    pause
    exit /b 1
)

echo.
echo Installing Node.js...
echo This may take a few minutes...
echo.

REM Run installer
msiexec /i "%INSTALLER%" /quiet /norestart

REM Wait for installer to finish
timeout /t 5 /nobreak

echo.
echo Installation complete!
echo Verifying...
echo.

REM Verify installation
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Node.js installed successfully!
    node --version
    npm --version
    echo.
    echo ===============================================
    echo Ready for TomarsCloud setup!
    echo ===============================================
    echo.
    echo Next steps:
    echo 1. Open a NEW PowerShell window
    echo 2. Run: cd C:\tomarscloud-backend
    echo 3. Run: npm install
    echo 4. Run: npm start
    echo.
    pause
) else (
    echo Verification failed. Please restart your terminal.
    echo Then run: node --version
    pause
    exit /b 1
)

REM Cleanup
del /q "%INSTALLER%" 2>nul
