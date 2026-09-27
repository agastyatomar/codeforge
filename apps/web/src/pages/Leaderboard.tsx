import { Trophy, Filter, Search, ChevronRight, User, Clock, Calendar, Globe, Medal, Award } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'weekly' | 'monthly' | 'friends' | 'course'>('global');
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const leaders = [
    { rank: 1, username: 'CodeMaster', avatar: '👨‍💻', level: 45, xp: 125000, streak: 89, courses: 12, country: 'US' },
    { rank: 2, username: 'ScriptKitty', avatar: '🐱‍💻', level: 42, xp: 118000, streak: 67, courses: 10, country: 'CA' },
    { rank: 3, username: 'BugHunter', avatar: '🐛', level: 40, xp: 112000, streak: 100, courses: 11, country: 'UK' },
    { rank: 4, username: 'DevWizard', avatar: '🧙‍♂️', level: 38, xp: 98000, streak: 45, courses: 9, country: 'DE' },
    { rank: 5, username: 'PixelPilot', avatar: '🎮', level: 35, xp: 87000, streak: 32, courses: 8, country: 'JP' },
    { rank: 6, username: 'CodeNinja', avatar: '🥷', level: 33, xp: 78000, streak: 28, courses: 7, country: 'BR' },
    { rank: 7, username: 'DataDiver', avatar: '🤿', level: 31, xp: 72000, streak: 22, courses: 6, country: 'AU' },
    { rank: 8, username: 'AlgoMaster', avatar: '🧮', level: 29, xp: 65000, streak: 18, courses: 5, country: 'IN' },
    { rank: 9, username: 'WebWeaver', avatar: '🕸️', level: 27, xp: 58000, streak: 15, courses: 5, country: 'FR' },
    { rank: 10, username: 'MobileMaker', avatar: '📱', level: 25, xp: 52000, streak: 12, courses: 4, country: 'KR' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Compete with learners worldwide and climb the ranks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          <Button variant="outline"><Search className="w-4 h-4 mr-2" />Search</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['global', 'weekly', 'monthly', 'friends', 'course'].map((type) => (
          <Button
            key={type}
            variant={leaderboardType === type ? 'primary' : 'ghost'}
            onClick={() => setLeaderboardType(type as any)}
            className="capitalize"
          >
            {type}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'week', 'month', 'year'].map((tf) => (
          <Button
            key={tf}
            variant={timeframe === tf ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTimeframe(tf as any)}
            className="capitalize"
          >
            {tf}
          </Button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Level</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">XP</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Streak</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Courses</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaders.map((leader, i) => (
                <tr key={i} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    {leader.rank === 1 && <Medal className="w-5 h-5 text-yellow-500" />}
                    {leader.rank === 2 && <Award className="w-5 h-5 text-gray-400" />}
                    {leader.rank === 3 && <Trophy className="w-5 h-5 text-amber-700" />}
                    {leader.rank > 3 && <span className="font-bold text-lg">{leader.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">{leader.avatar}</span>
                      <div>
                        <p className="font-semibold">{leader.username}</p>
                        <p className="text-xs text-muted-foreground">Level {leader.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{leader.level}</td>
                  <td className="px-4 py-3 font-mono text-lg">{leader.xp.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-4 h-4" />
                      {leader.streak}d
                    </span>
                  </td>
                  <td className="px-4 py-3">{leader.courses}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {leader.country}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Your Rank</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <p className="text-3xl font-bold text-primary">#1,234</p>
            <p className="text-sm text-muted-foreground">Global Rank</p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg">
            <p className="text-3xl font-bold text-blue-500">Top 5%</p>
            <p className="text-sm text-muted-foreground">Percentile</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <p className="text-3xl font-bold text-green-500">1,240</p>
            <p className="text-sm text-muted-foreground">XP This Week</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg">
            <p className="text-3xl font-bold text-purple-500">Level 12</p>
            <p className="text-sm text-muted-foreground">Current Level</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Leaderboard Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'XP Leaderboard', desc: 'Total experience points', icon: Trophy },
            { name: 'Streak Leaderboard', desc: 'Longest learning streaks', icon: Flame },
            { name: 'Course Completion', desc: 'Most courses completed', icon: BookOpen },
            { name: 'Challenge Master', desc: 'Most challenges solved', icon: Zap },
            { name: 'Build Creator', desc: 'Most builds published', icon: Code2 },
            { name: 'Community Helper', desc: 'Most helpful community member', icon: Heart },
          ].map((cat, i) => (
            <Button key={i} variant="outline" className="flex items-center gap-3 justify-start" asChild>
              <a href={`/leaderboard/${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <cat.icon className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}