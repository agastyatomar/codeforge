# CodeForge - Local-First Learn to Code Platform

A comprehensive, local-first alternative to codedex.io with 150,000+ lines of code, featuring all codedex features PLUS 20+ major enhancements.

## Features

### Core Learning Platform (codedex.io parity)
- **Interactive Courses**: Python, HTML, CSS, JavaScript, React, Node.js, SQL, Git, CLI, C++, Java, C#, AI/ML, Game Dev, Data Science
- **Gamification**: XP, badges, achievements, streaks, leaderboards
- **Avatar System**: Customizable avatars with 1000+ combinations
- **Virtual Worlds**: Phaser-based multiplayer worlds for social learning
- **Code Editor (Builds)**: Multi-file projects, live preview, asset uploads, publishing
- **AI Companion**: Local LLM integration for code help
- **Challenge Packs**: Practice exercises with XP rewards
- **Community Features**: Forum, posts, images, tech news
- **Learning Journeys**: 6 curated learning paths
- **Project Tutorials**: Step-by-step project guides
- **Daily Challenges**: New coding challenges every day

### Enhanced Features (Beyond codedex.io)
1. **Local LLM Integration**: Ollama + Transformers.js for fully offline AI assistance
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

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/codeforge.git
cd codeforge

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### For Local AI (Optional)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a code model
ollama pull codellama:7b
# or
ollama pull deepseek-coder:6.7b
```

## Architecture

```
codeforge/
├── apps/
│   ├── web/          # React + Vite PWA
│   ├── desktop/      # Tauri v2 native app
│   └── cli/          # Terminal companion
├── packages/
│   ├── core/         # Plugin architecture, events, types
│   ├── data/         # SQLite + IndexedDB + CRDT sync
│   ├── course-engine/# Course parser, runtime, importer
│   ├── exercise-engine/# Runners, validators, hints
│   ├── code-execution/# WASM runtimes (Pyodide, QuickJS, WebContainer)
│   ├── editor/       # Monaco, Git, Terminal, Debug, Collaboration
│   ├── gamification/ # XP, achievements, leaderboard, streaks, rewards
│   ├── worlds/       # Phaser 3 virtual worlds
│   ├── avatar/       # Avatar composer, assets, preview
│   ├── community/    # Forum, news, moderation
│   ├── builds/       # Advanced editor, preview, assets, templates
│   └── ai-assistant/ # Ollama, Transformers.js, context, completion
```

## Development

### Run Commands
```bash
# Start web dev server
pnpm dev

# Start desktop dev
pnpm dev:desktop

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

### Adding a New Language
1. Add language definition in `@codeforge/code-execution/src/runtimes/`
2. Add Monaco language support in `@codeforge/editor/src/monaco/`
3. Add exercise validators in `@codeforge/exercise-engine/src/validators/`
4. Add syntax highlighting in `@codeforge/editor/src/monaco/`

### Creating a Course
```yaml
# course.yaml
id: "uuid"
slug: "my-course"
title: "My Course"
description: "Learn something new"
version: "1.0.0"
author: "Author Name"
tags: ["beginner", "web"]
language: "javascript"
difficulty: "beginner"
estimatedHours: 5
lessons:
  - "lesson-uuid-1"
  - "lesson-uuid-2"
prerequisites: []
learningObjectives:
  - "Understand concept A"
  - "Build project B"
```

## Local-First Design

- **No external APIs required** - Everything runs locally
- **Offline-first** - Service workers, IndexedDB, background sync
- **No account required** - Optional local user profiles
- **Data ownership** - All data stored on your machine
- **Privacy by default** - No telemetry, no tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test:all`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by [codedex.io](https://codedex.io)
- Built with React, Vite, Tailwind, Monaco, Phaser, and many amazing open-source projects
- Local LLM support via Ollama and Transformers.js