<# 
.SYNOPSIS
    CodeForge Universal Installer for Windows PowerShell
.DESCRIPTION
    Installs CodeForge with all dependencies on Windows
.EXAMPLE
    iwr https://raw.githubusercontent.com/agastyatomar/codeforge/main/install.ps1 | iex
#>

param(
    [string]$InstallDir = "$env:USERPROFILE\codeforge",
    [switch]$SkipDesktop,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Colors
$Red = [ConsoleColor]::Red
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Blue = [ConsoleColor]::Cyan
$Gray = [ConsoleColor]::Gray

function Write-Log { param($msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [CodeForge] $msg" -ForegroundColor $Blue }
function Write-Success { param($msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [✓] $msg" -ForegroundColor $Green }
function Write-Warn { param($msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [!] $msg" -ForegroundColor $Yellow }
function Write-Error { param($msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [✗] $msg" -ForegroundColor $Red; exit 1 }

$REPO_URL = "https://github.com/agastyatomar/codeforge.git"
$MIN_NODE_VERSION = 20
$MIN_PNPM_VERSION = 9
$INSTALL_DIR = $InstallDir

function Has-Command($cmd) { Get-Command $cmd -ErrorAction SilentlyContinue }

function Version-Ge($v1, $v2) {
    [version]$v1 -ge [version]$v2
}

function Install-Node {
    Write-Log "Installing Node.js $MIN_NODE_VERSION+..."
    if (Has-Command choco) {
        choco install nodejs-lts -y
    } elseif (Has-Command scoop) {
        scoop install nodejs-lts
    } elseif (Has-Command winget) {
        winget install OpenJS.NodeJS.LTS
    } else {
        Write-Error "Install Node.js from https://nodejs.org or use choco/scoop/winget"
    }
    refreshenv
}

function Install-Pnpm {
    Write-Log "Installing pnpm..."
    if (Has-Command corepack) {
        corepack enable
        corepack prepare pnpm@latest --activate
    } else {
        npm install -g pnpm@latest
    }
}

function Install-Rust {
    if (Has-Command rustc) {
        $ver = (rustc --version).Split(' ')[1]
        if ([version]$ver -ge [version]"1.70") {
            Write-Success "Rust $ver already installed"
            return
        }
    }
    Write-Log "Installing Rust..."
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile("https://sh.rustup.rs", "$env:TEMP\rustup-init.exe")
    & "$env:TEMP\rustup-init.exe" -y
    & "$env:USERPROFILE\.cargo\bin\rustup.exe" default stable
    $env:PATH += ";$env:USERPROFILE\.cargo\bin"
}

function Verify-Install {
    $nodeVer = (node --version).TrimStart('v')
    $pnpmVer = pnpm --version
    
    if (-not (Version-Ge $nodeVer $MIN_NODE_VERSION)) { Write-Error "Node.js $nodeVer < $MIN_NODE_VERSION" }
    if (-not (Version-Ge $pnpmVer $MIN_PNPM_VERSION)) { Write-Error "pnpm $pnpmVer < $MIN_PNPM_VERSION" }
    
    Write-Success "Node.js $nodeVer ✓"
    Write-Success "pnpm $pnpmVer ✓"
    if (Has-Command rustc) { Write-Success "Rust $(rustc --version | select -skip 1) ✓" }
}

function Clone-Repo {
    Write-Log "Cloning to $INSTALL_DIR..."
    if (Test-Path "$INSTALL_DIR\.git") {
        Write-Log "Updating existing repo..."
        Set-Location $INSTALL_DIR
        git fetch origin
        git reset --hard origin/main
    } else {
        git clone --depth 1 $REPO_URL $INSTALL_DIR
        Set-Location $INSTALL_DIR
    }
}

function Install-Deps {
    Write-Log "Installing dependencies..."
    pnpm install --frozen-lockfile
}

function Build-Web {
    Write-Log "Building web app..."
    pnpm --filter @codeforge/web build
}

function Setup-Desktop {
    if ($SkipDesktop) { Write-Log "Skipping desktop (SkipDesktop)"; return }
    Write-Log "Setting up desktop app..."
    Set-Location "$INSTALL_DIR\apps\desktop"
    if (-not (Has-Command tauri)) {
        cargo install tauri-cli --version ^2
    }
    pnpm tauri build 2>$null || Write-Warn "Desktop build failed (optional)"
}

# Main
Write-Host "`n${Blue}╔══════════════════════════════════════════════════════════╗${Gray}"
Write-Host "${Blue}║           CodeForge Windows Installer                  ║${Gray}"
Write-Host "${Blue}╚══════════════════════════════════════════════════════════╝${Gray}`n"

if (-not $Force -and (Test-Path "$INSTALL_DIR\package.json")) {
    Write-Warn "Already installed at $INSTALL_DIR"
    $confirm = Read-Host "Reinstall? (y/N)"
    if ($confirm -notmatch '^[Yy]$') {
        Write-Log "Use 'cd $INSTALL_DIR; pnpm dev' to start"
        exit 0
    }
}

if (-not (Has-Command node) -or -not (Version-Ge (node --version).TrimStart('v') $MIN_NODE_VERSION)) {
    Install-Node
} else { Write-Success "Node.js $(node --version) ✓" }

if (-not (Has-Command pnpm) -or -not (Version-Ge (pnpm --version) $MIN_PNPM_VERSION)) {
    Install-Pnpm
} else { Write-Success "pnpm $(pnpm --version) ✓" }

Install-Rust
Verify-Install
Clone-Repo
Install-Deps
Build-Web
Setup-Desktop

Write-Host "`n${Green}╔══════════════════════════════════════════════════════════╗${Gray}"
Write-Host "${Green}║  CodeForge installed successfully! 🎉                      ║${Gray}"
Write-Host "${Green}╚══════════════════════════════════════════════════════════╝${Gray}`n"
Write-Host "${Blue}Quick start:${Gray}"
Write-Host "  cd $INSTALL_DIR"
Write-Host "  pnpm dev              # Web app (port 3000)"
Write-Host "  pnpm dev:desktop      # Desktop app"
Write-Host "  pnpm dev:cli          # CLI"
Write-Host "`n${Blue}Access:${Gray}  Web: http://localhost:3000"
Write-Host "${Yellow}Note:${Gray} First run downloads dependencies (~2-5 min)."
Write-Host "      Desktop app requires Rust (auto-installed).`n"