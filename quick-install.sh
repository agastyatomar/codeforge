#!/usr/bin/env bash
# CodeForge - One-line installer
# Usage: curl -fsSL https://raw.githubusercontent.com/agastyatomar/codeforge/main/quick-install.sh | bash

set -euo pipefail

REPO="https://github.com/agastyatomar/codeforge.git"
DIR="${CODEFORGE_DIR:-$HOME/codeforge}"

echo "🚀 Installing CodeForge..."

# Install dependencies based on platform
case "$(uname -s)" in
    Linux*)   OS="linux" ;;
    Darwin*)  OS="macos" ;;
    *)        OS="unknown" ;;
esac

# Check for Termux
if [[ -n "${TERMUX_VERSION:-}" ]] || [[ "$PREFIX" == *"/com.termux/"* ]]; then
    OS="termux"
fi

# Install Node.js if needed
if ! command -v node &>/dev/null || [[ $(node --version | sed 's/v//' | cut -d. -f1) -lt 20 ]]; then
    echo "📦 Installing Node.js..."
    case "$OS" in
        termux) pkg install -y nodejs-lts ;;
        linux)  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs ;;
        macos)  brew install node@20 ;;
        *) echo "❌ Install Node.js 20+ manually from nodejs.org"; exit 1 ;;
    esac
fi

# Install pnpm
if ! command -v pnpm &>/dev/null; then
    echo "📦 Installing pnpm..."
    corepack enable && corepack prepare pnpm@latest --activate 2>/dev/null || npm i -g pnpm
fi

# Install Rust for desktop app
if ! command -v rustc &>/dev/null; then
    echo "🦀 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Clone and install
echo "📥 Cloning CodeForge..."
if [[ -d "$DIR/.git" ]]; then
    cd "$DIR" && git fetch && git reset --hard origin/main
else
    git clone --depth 1 "$REPO" "$DIR"
    cd "$DIR"
fi

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔨 Building web app..."
pnpm --filter @codeforge/web build

echo ""
echo "✅ CodeForge installed at $DIR"
echo ""
echo "🚀 Quick start:"
echo "  cd $DIR"
echo "  pnpm dev              # Web app (http://localhost:3000)"
echo "  pnpm dev:desktop      # Desktop app (requires Rust)"
echo "  pnpm dev:cli          # CLI tool"
echo ""
echo "📚 Commands:"
echo "  pnpm build     # Build all"
echo "  pnpm test      # Run tests"
echo "  pnpm lint      # Lint code"