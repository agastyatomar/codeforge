import { User, Trophy, Flame, BookOpen, Code2, Calendar, Target, Palette, Settings, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export function Profile() {
  const [tab, setTab] = useState<'overview' | 'achievements' | 'activity' | 'settings'>('overview');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-4xl">
            👤
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">CodeForge User</h1>
            <p className="text-muted-foreground">codeforge.user@example.com</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Target className="w-4 h-4" />Level 12</span>
              <span className="flex items-center gap-1"><Trophy className="w-4 h-4" />12,450 XP</span>
              <span className="flex items-center gap-1"><Flame className="w-4 h-4" />23 day streak</span>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href="/settings"><Settings className="w-4 h-4 mr-2" />Settings</a>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['overview', 'achievements', 'activity', 'settings'].map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t as any)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Achievements</h3>
            <p className="text-3xl font-bold">47</p>
            <p className="text-sm text-muted-foreground">of 500 unlocked</p>
          </div>
          <div className="card p-6 text-center">
            <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Courses Completed</h3>
            <p className="text-3xl font-bold">8</p>
            <p className="text-sm text-muted-foreground">12 in progress</p>
          </div>
          <div className="card p-6 text-center">
            <Code2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Exercises Solved</h3>
            <p className="text-3xl font-bold">342</p>
            <p className="text-sm text-muted-foreground">1,250 XP earned</p>
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Your Achievements</h2>
            <span className="text-sm text-muted-foreground">47 / 500 unlocked</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'First Steps', icon: '👶', desc: 'Complete your first exercise', unlocked: true },
              { name: 'Getting Started', icon: '🌱', desc: 'Complete 10 exercises', unlocked: true },
              { name: 'Dedicated Learner', icon: '📚', desc: 'Complete 50 exercises', unlocked: true },
              { name: 'Week Warrior', icon: '🔥', desc: '7-day streak', unlocked: true },
              { name: 'First Course', icon: '🎓', desc: 'Complete your first course', unlocked: true },
              { name: 'Builder', icon: '🛠️', desc: 'Publish your first build', unlocked: false },
            ].map((ach, i) => (
              <div key={i} className={`p-4 rounded-lg flex items-center gap-3 ${ach.unlocked ? 'bg-green-500/10' : 'bg-muted/50 opacity-50'}`}>
                <span className="text-3xl">{ach.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium">{ach.name}</h4>
                  <p className="text-sm text-muted-foreground">{ach.desc}</p>
                </div>
                <span className="text-sm font-medium">{ach.unlocked ? 'Unlocked' : 'Locked'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y">
            {[
              { action: 'Completed exercise', target: 'Variables & Data Types', time: '2 hours ago', xp: 75 },
              { action: 'Finished lesson', target: 'Control Flow', time: '5 hours ago', xp: 200 },
              { action: 'Earned achievement', target: 'Week Warrior', time: '1 day ago', xp: 250 },
              { action: 'Published build', target: 'Personal Portfolio', time: '2 days ago', xp: 150 },
            ].map((act, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <p className="font-medium">{act.action} <span className="text-primary">{act.target}</span></p>
                    <p className="text-sm text-muted-foreground">{act.time}</p>
                  </div>
                </div>
                <span className="text-green-500 font-semibold">+{act.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input type="text" className="input" defaultValue="CodeForge User" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" defaultValue="user@codeforge.local" />
              </div>
              <Button>Save Changes</Button>
            </div>
          </div>
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Theme</label>
                <select className="input">
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
              <div>
                <label className="label">Language</label>
                <select className="input">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}