import { z } from 'zod';

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(100),
  description: z.string().max(500),
  category: z.string(),
  tags: z.array(z.string()).max(20),
  thumbnail: z.string().url().optional(),
  files: z.record(z.object({
    content: z.string(),
    language: z.string(),
    binary: z.boolean().optional(),
  })),
  variables: z.record(z.object({
    type: z.enum(['string', 'number', 'boolean', 'select']),
    label: z.string(),
    description: z.string().optional(),
    default: z.unknown().optional(),
    options: z.array(z.object({ label: z.string(); value: z.unknown() })).optional(),
    required: z.boolean().default(false),
  })).optional(),
  dependencies: z.record(z.string()).optional(),
  scripts: z.record(z.string()).optional(),
  author: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Template = z.infer<typeof TemplateSchema>;

export interface TemplateInstance {
  templateId: string;
  variables: Record<string, unknown>;
  files: Record<string, { content: string; language: string }>;
}

export class TemplateEngine {
  private templates = new Map<string, Template>();
  private builtInTemplates: Template[] = [];

  constructor() {
    this.registerBuiltInTemplates();
  }

  private registerBuiltInTemplates(): void {
    this.builtInTemplates = [
      {
        id: 'html-css-js-basic',
        name: 'Basic HTML/CSS/JS',
        description: 'Simple starter with HTML, CSS, and JavaScript',
        category: 'web',
        tags: ['html', 'css', 'javascript', 'beginner'],
        version: '1.0.0',
        files: {
          'index.html': { content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>{{title}}</h1>
        <p>{{description}}</p>
        <button id="btn">Click me</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`, language: 'html' },
          'style.css': { content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: {{fontFamily}};
    background: {{backgroundColor}};
    color: {{textColor}};
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    text-align: center;
    padding: 2rem;
}

h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: {{gradient}};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: {{buttonColor}};
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
}

button:hover {
    transform: scale(1.05);
}`, language: 'css' },
          'script.js': { content: `document.getElementById('btn').addEventListener('click', () => {
    alert('Hello from {{title}}!');
});`, language: 'javascript' },
        },
        variables: {
          title: { type: 'string', label: 'Project Title', default: 'My Project', required: true },
          description: { type: 'string', label: 'Description', default: 'A new CodeForge project' },
          fontFamily: { type: 'select', label: 'Font Family', default: 'system-ui', options: [{ label: 'System UI', value: 'system-ui' }, { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" }, { label: 'Inter', value: "'Inter', sans-serif" }] },
          backgroundColor: { type: 'string', label: 'Background Color', default: '#0d1117' },
          textColor: { type: 'string', label: 'Text Color', default: '#e6edf3' },
          gradient: { type: 'string', label: 'Gradient', default: 'linear-gradient(135deg, #58a6ff, #bc8cff)' },
          buttonColor: { type: 'string', label: 'Button Color', default: '#238636' },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'react-vite',
        name: 'React + Vite',
        description: 'Modern React setup with Vite, TypeScript, and ESLint',
        category: 'web',
        tags: ['react', 'vite', 'typescript', 'frontend'],
        version: '1.0.0',
        files: {
          'package.json': { content: `{
  "name": "{{name}}",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}`, language: 'json' },
          'index.html': { content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`, language: 'html' },
          'src/main.tsx': { content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`, language: 'typescript' },
          'src/App.tsx': { content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header>
        <h1>{{title}}</h1>
        <p>{{description}}</p>
      </header>
      <main>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      </main>
    </div>
  )
}

export default App`, language: 'typescript' },
          'src/App.css': { content: `.app {
  min-height: 100vh;
  background: #0d1117;
  color: #e6edf3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  background: linear-gradient(135deg, #58a6ff, #bc8cff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 3rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1.25rem;
  background: #238636;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #3fb950;
}`, language: 'css' },
          'src/index.css': { content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
  background: #0d1117;
}`, language: 'css' },
          'vite.config.ts': { content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
})`, language: 'typescript' },
          'tsconfig.json': { content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`, language: 'json' },
        },
        variables: {
          name: { type: 'string', label: 'Package Name', default: 'my-react-app', required: true },
          title: { type: 'string', label: 'App Title', default: 'React App', required: true },
          description: { type: 'string', label: 'Description', default: 'A React application built with CodeForge' },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'python-cli',
        name: 'Python CLI Tool',
        description: 'Command-line interface with Click framework',
        category: 'cli',
        tags: ['python', 'cli', 'click', 'tool'],
        version: '1.0.0',
        files: {
          'pyproject.toml': { content: `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "{{name}}"
version = "0.1.0"
description = "{{description}}"
authors = [{name = "{{author}}"}]
license = {text = "MIT"}
readme = "README.md"
requires-python = ">=3.8"
dependencies = [
    "click>=8.0",
    "rich>=13.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "black>=23.0",
    "ruff>=0.1",
]

[tool.setuptools.packages.find]
where = ["src"]

[tool.click]
commands = [
    "cli = {{name}}.cli:main",
]`, language: 'toml' },
          'src/__init__.py': { content: `"""{{name}} - {{description}}"""`, language: 'python' },
          'src/cli.py': { content: `import click
from rich.console import Console

console = Console()

@click.group()
@click.version_option()
def main():
    """{{name}} - {{description}}"""
    pass

@main.command()
@click.argument('name', default='World')
def hello(name):
    """Say hello"""
    console.print(f"[bold green]Hello, {name}![/bold green]")

@main.command()
@click.option('--count', default=1, help='Number of greetings')
def greet(count):
    """Greet multiple times"""
    for i in range(count):
        console.print(f"[blue]Greeting {i+1}[/blue]")

if __name__ == '__main__':
    main()`, language: 'python' },
          'README.md': { content: `# {{name}}

{{description}}

## Installation

\`\`\`bash
pip install {{name}}
\`\`\`

## Usage

\`\`\`bash
{{name}} hello
{{name}} hello --name CodeForge
{{name}} greet --count 3
\`\`\``, language: 'markdown' },
        },
        variables: {
          name: { type: 'string', label: 'Package Name', default: 'my-cli', required: true },
          description: { type: 'string', label: 'Description', default: 'A CLI tool built with CodeForge' },
          author: { type: 'string', label: 'Author', default: 'CodeForge User' },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rust-wasm',
        name: 'Rust + WebAssembly',
        description: 'WebAssembly project with wasm-bindgen',
        category: 'web',
        tags: ['rust', 'wasm', 'webassembly', 'game'],
        version: '1.0.0',
        files: {
          'Cargo.toml': { content: `[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
web-sys = { version = "0.3", features = ["console", "window", "document", "element", "html_element", "canvas_rendering_context_2d"] }
js-sys = "0.3"
rand = "0.8"
serde = { version = "1.0", features = ["derive"] }
serde-wasm-bindgen = "0.5"`, language: 'toml' },
          'src/lib.rs': { content: `use wasm_bindgen::prelude::*;
use web_sys::{console, window, Document, HtmlCanvasElement, CanvasRenderingContext2d};
use js_sys::Math;
use rand::Rng;

#[wasm_bindgen(start)]
pub fn main() {
    console::log_1(&"{{name}} initialized!".into());
    setup_canvas();
}

fn setup_canvas() {
    let window = window().unwrap();
    let document = window.document().unwrap();
    let canvas = document.get_element_by_id("canvas").unwrap().dyn_into::<HtmlCanvasElement>().unwrap();
    let context = canvas.get_context("2d").unwrap().unwrap().dyn_into::<CanvasRenderingContext2d>().unwrap();

    canvas.set_width(800);
    canvas.set_height(600);

    let mut rng = rand::thread_rng();
    let colors = ["#58a6ff", "#bc8cff", "#3fb950", "#d29922", "#f85149"];

    let f: Closure<dyn FnMut()> = Closure::wrap(Box::new(move || {
        context.clear_rect(0.0, 0.0, 800.0, 600.0);
        for _ in 0..100 {
            let x = rng.gen_range(0.0..800.0);
            let y = rng.gen_range(0.0..600.0);
            let radius = rng.gen_range(5.0..20.0);
            let color = colors[rng.gen_range(0..colors.len())];

            context.begin_path();
            context.arc(x, y, radius, 0.0, Math::PI() * 2.0).unwrap();
            context.set_fill_style(&color.into());
            context.fill().unwrap();
        }
        window.request_animation_frame(f.as_ref().unchecked_ref()).unwrap();
    }) as Box<dyn FnMut()>);

    window.request_animation_frame(f.as_ref().unchecked_ref()).unwrap();
    f.forget();
}`, language: 'rust' },
          'index.html': { content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body { margin: 0; background: #0d1117; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        canvas { border: 1px solid #30363d; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script type="module">
        import init, { main } from './pkg/{{name}}.js';
        await init();
        main();
    </script>
</body>
</html>`, language: 'html' },
        },
        variables: {
          name: { type: 'string', label: 'Crate Name', default: 'wasm-app', required: true },
          title: { type: 'string', label: 'Page Title', default: 'WASM App', required: true },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'node-express-api',
        name: 'Node.js Express API',
        description: 'REST API with Express, TypeScript, and Prisma',
        category: 'backend',
        tags: ['node', 'express', 'typescript', 'api', 'prisma'],
        version: '1.0.0',
        files: {
          'package.json': { content: `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "zod": "^3.22.0",
    "@prisma/client": "^5.7.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/morgan": "^1.9.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "prisma": "^5.7.0"
  }
}`, language: 'json' },
          'src/index.ts': { content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '{{name}}', timestamp: new Date().toISOString() });
});

app.get('/api/hello', (req, res) => {
  const name = req.query.name as string || 'World';
  res.json({ message: \`Hello, \${name}!\`, service: '{{name}}' });
});

const todoSchema = z.object({
  title: z.string().min(1).max(100),
  completed: z.boolean().default(false),
});

let todos: Array<{ id: string; title: string; completed: boolean }> = [];

app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const result = todoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  const todo = { id: crypto.randomUUID(), ...result.data };
  todos.push(todo);
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  todos[index] = { ...todos[index], ...req.body };
  res.json(todos[index]);
});

app.delete('/api/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  todos.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`, language: 'typescript' },
          'prisma/schema.prisma': { content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Todo {
  id        String   @id @default(uuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`, language: 'prisma' },
          'tsconfig.json': { content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`, language: 'json' },
        },
        variables: {
          name: { type: 'string', label: 'Project Name', default: 'my-api', required: true },
          description: { type: 'string', label: 'Description', default: 'A REST API built with CodeForge' },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    for (const template of this.builtInTemplates) {
      this.templates.set(template.id, template);
    }
  }

  registerTemplate(template: Template): void {
    TemplateSchema.parse(template);
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): Template[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  getCategories(): string[] {
    return Array.from(new Set(Array.from(this.templates.values()).map((t) => t.category)));
  }

  async instantiate(templateId: string, variables: Record<string, unknown>): Promise<TemplateInstance> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    const validatedVars = this.validateVariables(template, variables);
    const files: Record<string, { content: string; language: string }> = {};

    for (const [path, file] of Object.entries(template.files)) {
      let content = file.content;
      for (const [key, value] of Object.entries(validatedVars)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, String(value));
      }
      files[path] = { content, language: file.language };
    }

    return { templateId, variables: validatedVars, files };
  }

  private validateVariables(template: Template, variables: Record<string, unknown>): Record<string, unknown> {
    const validated: Record<string, unknown> = {};

    for (const [key, schema] of Object.entries(template.variables || {})) {
      if (key in variables) {
        validated[key] = variables[key];
      } else if (schema.default !== undefined) {
        validated[key] = schema.default;
      } else if (schema.required) {
        throw new Error(`Required variable missing: ${key}`);
      }
    }

    return validated;
  }

  async createFromTemplate(templateId: string, variables: Record<string, unknown>, buildId: string): Promise<void> {
    const instance = await this.instantiate(templateId, variables);
    // Would integrate with BuildEditor to create files
  }

  searchTemplates(query: string, category?: string): Template[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter((t) => {
      const matchesQuery = t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
      const matchesCategory = !category || t.category === category;
      return matchesQuery && matchesCategory;
    });
  }
}

export function createTemplateEngine(): TemplateEngine {
  return new TemplateEngine();
}

export const TEMPLATE_CATEGORIES = [
  'web',
  'backend',
  'cli',
  'mobile',
  'desktop',
  'game',
  'ml',
  'data',
  'devops',
  'fullstack',
] as const;