#!/usr/bin/env bash
# CodeForge - Universal Installer
# Works on: Termux, Linux, macOS, Windows (WSL/Git Bash)
# Single command: curl -fsSL https://raw.githubusercontent.com/agastyatomar/codeforge/main/install.sh | bash

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
REPO_URL="https://github.com/agastyatomar/codeforge.git"
INSTALL_DIR="${CODEFORGE_DIR:-$HOME/codeforge}"
MIN_NODE_VERSION=20
MIN_PNPM_VERSION=9

# Logging
log() { echo -e "${BLUE}[CodeForge]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="macos";;
        CYGWIN*|MINGW*|MSYS*) OS="windows";;
        *)          OS="unknown";;
    esac
    
    # Check for Termux
    if [[ -n "${TERMUX_VERSION:-}" ]] || [[ "$PREFIX" == *"/com.termux/"* ]]; then
        OS="termux"
    fi
    
    log "Detected OS: $OS"
}

# Check command exists
has_cmd() { command -v "$1" >/dev/null 2>&1; }

# Version comparison
version_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Install Node.js
install_node() {
    log "Installing Node.js ${MIN_NODE_VERSION}+..."
    
    case "$OS" in
        termux)
            pkg update && pkg install -y nodejs-lts
            ;;
        linux)
            if has_cmd apt; then
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif has_cmd dnf; then
                sudo dnf module install -y nodejs:20
            elif has_cmd pacman; then
                sudo pacman -S --noconfirm nodejs npm
            elif has_cmd apk; then
                apk add nodejs npm
            else
                error "Unsupported Linux package manager. Install Node.js manually."
            fi
            ;;
        macos)
            if has_cmd brew; then
                brew install node@20
            else
                error "Homebrew required. Install from https://brew.sh"
            fi
            ;;
        windows)
            if has_cmd choco; then
                choco install nodejs-lts -y
            elif has_cmd scoop; then
                scoop install nodejs-lts
            else
                error "Install Node.js from https://nodejs.org or use choco/scoop"
            fi
            ;;
        *)
            error "Unsupported OS for auto-install. Install Node.js ${MIN_NODE_VERSION}+ manually."
            ;;
    esac
}

# Install pnpm
install_pnpm() {
    log "Installing pnpm ${MIN_PNPM_VERSION}+..."
    
    if has_cmd corepack; then
        corepack enable
        corepack prepare pnpm@latest --activate
    elif has_cmd npm; then
        npm install -g pnpm@latest
    else
        error "npm not found. Cannot install pnpm."
    fi
}

# Install Rust (for Tauri desktop app)
install_rust() {
    if has_cmd rustc && has_cmd cargo; then
        local rust_version=$(rustc --version | cut -d' ' -f2)
        if version_ge "$rust_version" "1.70"; then
            success "Rust $rust_version already installed"
            return
        fi
    fi
    
    log "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    
    # Install Tauri dependencies
    case "$OS" in
        linux)
            if has_cmd apt; then
                sudo apt-get update && sudo apt-get install -y \
                    libwebkit2gtk-4.1-dev \
                    libayatana-appindicator3-dev \
                    librsvg2-dev \
                    libssl-dev \
                    libgtk-3-dev \
                    libsoup2.4-dev \
                    libjavascriptcoregtk-4.1-dev \
                    build-essential
            elif has_cmd dnf; then
                sudo dnf install -y \
                    webkit2gtk4.1-devel \
                    libayatana-appindicator-gtk3-devel \
                    librsvg2-devel \
                    openssl-devel \
                    gtk3-devel \
                    libsoup2.4-devel \
                    javascriptcoregtk4.1-devel \
                    gcc \
                    gcc-c++ \
                    make
            elif has_cmd pacman; then
                sudo pacman -S --noconfirm \
                    webkit2gtk-4.1 \
                    libayatana-appindicator \
                    librsvg \
                    openssl \
                    gtk3 \
                    libsoup \
                    base-devel
            elif has_cmd apk; then
                apk add webkit2gtk-4.1-dev libayatana-appindicator-dev librsvg-dev openssl-dev gtk3-dev libsoup-dev build-base
            fi
            ;;
        macos)
            # Xcode command line tools
            xcode-select --install 2>/dev/null || true
            ;;
        windows)
            # Visual Studio Build Tools handled by Tauri CLI
            ;;
    esac
}

# Verify installation
verify_install() {
    log "Verifying installation..."
    
    local node_version=$(node --version 2>/dev/null | sed 's/v//')
    local pnpm_version=$(pnpm --version 2>/dev/null)
    
    if ! version_ge "$node_version" "$MIN_NODE_VERSION"; then
        error "Node.js $node_version < $MIN_NODE_VERSION"
    fi
    
    if ! version_ge "$pnpm_version" "$MIN_PNPM_VERSION"; then
        error "pnpm $pnpm_version < $MIN_PNPM_VERSION"
    fi
    
    success "Node.js $node_version ✓"
    success "pnpm $pnpm_version ✓"
    
    if has_cmd rustc; then
        success "Rust $(rustc --version | cut -d' ' -f2) ✓"
    fi
}

# Clone or update repo
clone_repo() {
    log "Setting up CodeForge in $INSTALL_DIR..."
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log "Repository exists, updating..."
        cd "$INSTALL_DIR"
        git fetch origin
        git reset --hard origin/main
    else
        git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
}

# Install dependencies
install_deps() {
    log "Installing dependencies (this may take a few minutes)..."
    
    # Use frozen lockfile for reproducible builds
    pnpm install --frozen-lockfile
}

# Build web app
build_web() {
    log "Building web application..."
    pnpm --filter @codeforge/web build
}

# Setup desktop app (optional)
setup_desktop() {
    if [[ "${CODEFORGE_SKIP_DESKTOP:-}" == "true" ]]; then
        log "Skipping desktop app setup (CODEFORGE_SKIP_DESKTOP=true)"
        return
    fi
    
    log "Setting up desktop app..."
    cd apps/desktop
    
    # Install Tauri CLI if not present
    if ! has_cmd tauri; then
        cargo install tauri-cli --version ^2
    fi
    
    # Build for current platform
    pnpm tauri build 2>/dev/null || warn "Desktop build failed (optional). Web app works without it."
}

# Create shortcuts
create_shortcuts() {
    log "Creating launch shortcuts..."
    
    case "$OS" in
        linux|macos|termux)
            cat > "$HOME/.local/bin/codeforge" <<'EOF'
#!/usr/bin/env bash
cd "$HOME/codeforge" && pnpm dev
EOF
            chmod +x "$HOME/.local/bin/codeforge"
            mkdir -p "$HOME/.local/bin"
            ;;
        windows)
            cat > "$HOME/codeforge.bat" <<'EOF'
@echo off
cd /d "%USERPROFILE%\codeforge"
pnpm dev
EOF
            ;;
    esac
}

# Print success message
print_success() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  CodeForge installed successfully! 🎉                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}Quick start:${NC}"
    echo "  cd $INSTALL_DIR"
    echo "  pnpm dev              # Start web app (port 3000)"
    echo "  pnpm dev:desktop      # Start desktop app"
    echo "  pnpm dev:cli          # Start CLI"
    echo
    echo -e "${BLUE}Commands:${NC}"
    echo "  pnpm build            # Build all apps"
    echo "  pnpm test             # Run tests"
    echo "  pnpm lint             # Lint code"
    echo "  pnpm typecheck        # Type check"
    echo
    echo -e "${BLUE}Access:${NC}"
    echo "  Web:     http://localhost:3000"
    echo "  Desktop: pnpm dev:desktop"
    echo
    echo -e "${YELLOW}Note:${NC} First run downloads dependencies (~2-5 min)."
    echo "      Desktop app requires Rust (auto-installed)."
}

# Main
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           CodeForge Universal Installer                  ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo
    
    detect_os
    
    # Check if already installed
    if [[ -d "$INSTALL_DIR" && -f "$INSTALL_DIR/package.json" ]]; then
        warn "CodeForge already installed at $INSTALL_DIR"
        read -p "Reinstall? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Use 'cd $INSTALL_DIR && pnpm dev' to start"
            exit 0
        fi
    fi
    
    # Install dependencies
    if ! has_cmd node || ! version_ge "$(node --version 2>/dev/null | sed 's/v//')" "$MIN_NODE_VERSION"; then
        install_node
    else
        success "Node.js $(node --version) already installed"
    fi
    
    if ! has_cmd pnpm || ! version_ge "$(pnpm --version 2>/dev/null)" "$MIN_PNPM_VERSION"; then
        install_pnpm
    else
        success "pnpm $(pnpm --version) already installed"
    fi
    
    install_rust
    verify_install
    clone_repo
    install_deps
    build_web
    setup_desktop
    create_shortcuts
    print_success
}

# Run
main "$@"