import { Globe, Users, Zap, Trophy, Settings, Palette, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Worlds() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="text-primary" />
            Worlds
          </h1>
          <p className="text-muted-foreground mt-1">Explore virtual worlds, meet other learners, and collaborate in real-time</p>
        </div>
        <Button variant="outline"><Settings className="w-4 h-4 mr-2" />Customize Avatar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Main Plaza', players: 42, icon: Users, color: 'bg-primary' },
          { name: 'Code Playground', players: 18, icon: Zap, color: 'bg-yellow-500' },
          { name: 'Learning Hall', players: 35, icon: Trophy, color: 'bg-green-500' },
        ].map((world, i) => (
          <div key={i} className="card overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="aspect-video relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <world.icon className="w-24 h-24 text-white/20" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${world.color.replace('bg-', 'bg-')}`} />
                  <span className="text-white font-medium">{world.players} online</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{world.name}</h3>
              <p className="text-sm text-muted-foreground">Explore, chat, and collaborate with other learners</p>
              <Button className="w-full mt-3" variant="outline" asChild>
                <a href={`/worlds/world-${i + 1}`}>
                  Enter World
                  <ChevronRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-8">
        <h3 className="text-xl font-semibold mb-4">Your Avatar</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-4xl">
            👤
          </div>
          <div>
            <h4 className="font-semibold">CodeForge User</h4>
            <p className="text-sm text-muted-foreground">Level 5 • 2,450 XP • 12 day streak</p>
          </div>
        </div>
        <Button variant="outline" asChild className="flex items-center gap-2">
          <a href="/avatar">
            <Palette className="w-4 h-4" />
            Customize Avatar
          </a>
        </Button>
      </div>
    </div>
  );
}