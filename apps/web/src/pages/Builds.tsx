import { Code2, Plus, Filter, Search, Globe, Terminal, Palette, Zap, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Builds() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Code2 className="text-primary" />
            Builds
          </h1>
          <p className="text-muted-foreground mt-1">Create, edit, and publish multi-file projects with live preview</p>
        </div>
        <Button asChild>
          <a href="/builds/new">
            <Plus className="w-4 h-4 mr-2" />
            New Build
          </a>
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="outline"><Search className="w-4 h-4 mr-2" />Search</Button>
        <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Personal Portfolio', type: 'HTML/CSS/JS', updated: '2 hours ago', public: true },
          { title: 'React Todo App', type: 'React/TypeScript', updated: '1 day ago', public: false },
          { title: 'Python CLI Tool', type: 'Python', updated: '3 days ago', public: true },
          { title: 'Game Prototype', type: 'Phaser/JS', updated: '1 week ago', public: false },
        ].map((build, i) => (
          <div key={i} className="card overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted/50 flex items-center justify-center">
              <Code2 className="w-16 h-16 text-muted-foreground/50" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{build.title}</h3>
                {build.public && (
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded">Public</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{build.type}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Updated {build.updated}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/builds/build-${i + 1}`}>Edit</a>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`https://build-${i + 1}.codeforge.local`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Create Your First Build</h3>
        <p className="text-muted-foreground mb-6">Start with a template or build from scratch</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" asChild className="flex items-center gap-2">
            <a href="/builds/new?template=html-css-js">
              <Globe className="w-4 h-4" />
              HTML/CSS/JS
            </a>
          </Button>
          <Button variant="outline" asChild className="flex items-center gap-2">
            <a href="/builds/new?template=react-vite">
              <Code2 className="w-4 h-4" />
              React + Vite
            </a>
          </Button>
          <Button variant="outline" asChild className="flex items-center gap-2">
            <a href="/builds/new?template=python-cli">
              <Terminal className="w-4 h-4" />
              Python CLI
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}