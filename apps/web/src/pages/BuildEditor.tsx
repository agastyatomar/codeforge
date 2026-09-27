import { Code2, FileText, Image, Folder, Save, Globe, Terminal, Palette, ChevronLeft, ChevronRight, X, Plus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { MonacoEditorManager, createMonacoEditorManager } from '@codeforge/editor/monaco';

export function BuildEditor() {
  const [activeFile, setActiveFile] = useState('index.html');
  const [files, setFiles] = useState([
    { path: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Build</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Hello, CodeForge!</h1>
        <button id="btn">Click me</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`, language: 'html' },
    { path: 'style.css', content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0d1117;
    color: #e6edf3;
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
    background: linear-gradient(135deg, #58a6ff, #bc8cff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #238636;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
}

button:hover {
    transform: scale(1.05);
}`, language: 'css' },
    { path: 'script.js', content: `console.log('Hello, CodeForge!');

document.getElementById('btn').addEventListener('click', () => {
    document.body.style.background = '#' + Math.floor(Math.random() * 16777215).toString(16);
});`, language: 'javascript' },
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentFile = files.find(f => f.path === activeFile) || files[0];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1 bg-background">
            {files.map((file, i) => (
              <button
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                  activeFile === file.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {file.path === 'index.html' && <Code2 className="w-3 h-3" />}
                {file.path === 'style.css' && <Palette className="w-3 h-3" />}
                {file.path === 'script.js' && <Terminal className="w-3 h-3" />}
                <span>{file.path}</span>
                {activeFile === file.path && (
                  <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter(f => f.path !== file.path)); setActiveFile(files[0]?.path || ''); }} className="ml-1 text-muted-foreground hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))}
            <Button variant="ghost" size="sm" className="p-1">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <Button variant="ghost" size="sm"><Palette className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm"><Globe className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm">Preview</Button>
          <Button size="sm">Publish</Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        {sidebarOpen && (
          <div className="w-64 border-r bg-surface flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Files</h3>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {['index.html', 'style.css', 'script.js', 'assets/'].map((item) => (
                  <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer group">
                    {item.endsWith('/') ? (
                      <Folder className="w-4 h-4 text-muted-foreground" />
                    ) : item.endsWith('.html') ? (
                      <Code2 className="w-4 h-4 text-orange-500" />
                    ) : item.endsWith('.css') ? (
                      <Palette className="w-4 h-4 text-blue-500" />
                    ) : item.endsWith('.js') ? (
                      <Terminal className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm flex-1 truncate">{item}</span>
                    {item !== 'assets/' && (
                      <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 border-t">
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Plus className="w-4 h-4" />
                New File
              </Button>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-full relative">
            <textarea
              value={currentFile.content}
              onChange={(e) => setFiles(files.map(f => f.path === activeFile ? { ...f, content: e.target.value } : f))}
              className="w-full h-full font-mono text-sm bg-background border-none resize-none p-4 focus:outline-none"
              placeholder="Start coding..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-96 border-l bg-surface flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Live Preview</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm"><Terminal className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm"><Globe className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex-1 p-4">
            <iframe
              className="w-full h-full rounded-lg border bg-white"
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>${files.find(f => f.path === 'style.css')?.content || ''}</style>
                </head>
                <body>
                  ${files.find(f => f.path === 'index.html')?.content.replace(/<script src="script.js"><\/script>/, '') || ''}
                  <script>${files.find(f => f.path === 'script.js')?.content || ''}</script>
                </body>
                </html>
              `}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}