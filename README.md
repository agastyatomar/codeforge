# CodeForge - Local-First Learn to Code Platform

A comprehensive, local-first alternative to codedex.io with all codedex features PLUS 20+ major enhancements. Runs 100% locally on any device.

## 🚀 One-Line Install (All Platforms)

```bash
# Linux / macOS / Termux / WSL / Git Bash
curl -fsSL https://raw.githubusercontent.com/agastyatomar/codeforge/main/quick-install.sh | bash

# Windows PowerShell
iwr https://raw.githubusercontent.com/agastyatomar/codeforge/main/install.ps1 | iex
```

That's it! Installs Node.js, pnpm, Rust, clones repo, installs deps, builds web app.

## ✨ Features

### Core Learning Platform (codedex.io parity)
- **Interactive Courses**: Python, HTML, CSS, JavaScript, React, Node.js, SQL, Git, CLI, C++, Java, C#, AI/ML, Game Dev, Data Science
- **Gamification**: XP, badges, achievements, streaks, leaderboards
- **Avatar System**: Customizable avatars with 1000+ combinations
- **Virtual Worlds**: Phaser 3 multiplayer worlds for social learning
- **Code Editor (Builds)**: Multi-file projects, live preview, asset uploads, publishing
- **AI Companion**: Local LLM integration for code help
- **Challenge Packs**: Practice exercises with XP rewards
- **Community Features**: Forum, posts, images, tech news
- **Learning Journeys**: 6 curated learning paths
- **Project Tutorials**: Step-by-step project guides
- **Daily Challenges**: New coding challenges every day

### Enhanced Features (Beyond codedex.io)
1. **Local LLM Integration**: Ollama + Transformers.js for fully offline AI
2. **20+ Programming Languages**: Rust, Go, TypeScript, Kotlin, Swift, Lua, Zig, etc.
3. **Advanced IDE**: Monaco-based with IntelliSense, debugging, Git integration
4. **Plugin System**: Extensible architecture for courses, languages, tools
5. **Content Authoring Tools**: Visual course creator, exercise builder
6. **Assessment Engine**: Auto-grading, test runners, code quality analysis
7. **P2P Collaboration**: WebRTC sync for local network collaboration
8. **Learning Analytics**: Detailed progress tracking, heatmaps, predictions
9. **Mobile-First PWA**: Native app feel, push notifications, offline support
10. **Accessibility First**: WCAG 2.1 AA compliant
11. **Internationalization**: 20+ languages with RTL support
12. **Theming Engine**: Custom themes, dark/light/high-contrast
13. **Code Execution Sandbox**: WASM runtimes (Pyodide, QuickJS, WASM)
14. **Version Control Integration**: Built-in Git GUI, GitHub/GitLab sync
15. **100+ Project Templates**: Web, mobile, desktop, CLI starters
16. **Mentorship System**: Local mentor matching, code review workflows
17. **Competitive Programming**: Contest mode, problem sets, rankings
18. **Certification System**: Verifiable credentials
19. **Extensible CLI**: Terminal companion for headless operation
20. **Desktop App**: Tauri v2 native wrapper

## 📦 Manual Installation

### Prerequisites
- Node.js 20+
- pnpm 9+
- Rust 1.70+ (for desktop app)

### Standard Install
```bash
# Clone
git clone https://github.com/agastyatomar/codeforge.git
cd codeforge

# Install deps & build
pnpm install --frozen-lockfile
pnpm --filter @codeforge/web build

# Start
pnpm dev
```

### With All Features (including desktop)
```bash
# Auto-installs Node.js, pnpm, Rust if missing
curl -fsSL https://raw.githubusercontent.com/agastyatomar/codeforge/main/install.sh | bash

# Windows PowerShell
iwr https://raw.githubusercontent.com/agastyatomar/codeforge/main/install.ps1 | iex
```

### Optional: Local AI
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull code models
ollama pull codellama:7b
ollama pull deepseek-coder:6.7b
```

## 🏗️ Architecture

```
codeforge/
├── apps/
│   ├── web/          # React 18 + Vite 5 + PWA
│   ├── desktop/      # Tauri v2 native app
│   └── cli/          # Commander.js terminal tool
├── packages/         # 25+ shared packages
│   ├── core/         # Plugin architecture, events, types
│   ├── data/         # SQLite + IndexedDB + CRDT sync
│   ├── course-engine/# Course parser, runtime, importer
│   ├── exercise-engine/# Runners, validators, hints
│   ├── code-execution/# WASM runtimes (Pyodide, QuickJS, WebContainer)
│   ├── editor/       # Monaco, Git, Terminal, Debug, Collaboration
│   ├── gamification/ # XP, achievements, leaderboard, streaks
│   ├── worlds/       # Phaser 3 multiplayer worlds
│   ├── avatar/       # Layer-based avatar composer
│   ├── community/    # Forum, news, moderation
│   ├── builds/       # Advanced editor, preview, assets, templates
│   ├── ai-assistant/ # Ollama, Transformers.js, context
│   ├── analytics/    # Tracker, insights, predictions
│   ├── assessment/   # Auto-grader, rubrics, certification
│   ├── authoring/    # Visual course builder
│   ├── competitive/  # Contests, problems, rankings
│   ├── mentorship/   # Matching, code reviews, sessions
│   ├── templates/    # 100+ project templates
│   ├── theming/      # Design tokens, theme engine
│   ├── i18n/         # 20+ languages, RTL support
│   ├── a11y/         # WCAG 2.1 AA, screen readers
│   └── adaptive/     # BKT/DKT knowledge tracing
```

## 🛠️ Development

```bash
# Start web dev server (port 3000)
pnpm dev

# Start desktop app
pnpm dev:desktop

# Run CLI
pnpm dev:cli

# Run all tests
pnpm test:all

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Build all packages
pnpm build
```

## 🌍 Cross-Platform Support

| Platform | Web App | Desktop App | CLI | Auto-Install |
|----------|---------|-------------|-----|--------------|
| Linux    | ✅      | ✅          | ✅  | ✅           |
| macOS    | ✅      | ✅          | ✅  | ✅           |
| Windows  | ✅      | ✅          | ✅  | ✅ (PS/WSL)  |
| Termux   | ✅      | ❌          | ✅  | ✅           |
| WSL      | ✅      | ✅          | ✅  | ✅           |

## 🔒 Local-First Design

- **No external APIs** - Everything runs locally
- **Offline-first** - Service workers, IndexedDB, background sync
- **No account required** - Optional local user profiles
- **Data ownership** - All data stored on your machine
- **Privacy by default** - No telemetry, no tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test:all`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [codedex.io](https://codedex.io)
- Built with React, Vite, Tailwind, Monaco, Phaser, and many amazing open-source projects
- Local LLM support via Ollama and Transformers.js