import { Zap, Trophy, Flame, Code2, Filter, Search, Calendar, Clock, PlayCircle, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export function Challenges() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'practice' | 'contests'>('daily');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-primary" />
            Challenges
          </h1>
          <p className="text-muted-foreground mt-1">Practice your coding skills with daily challenges, weekly contests, and practice problems</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          <Button variant="outline"><Search className="w-4 h-4 mr-2" />Search</Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {['daily', 'weekly', 'practice', 'contests'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab as any)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="card p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Daily Challenge</h2>
                <p className="text-muted-foreground">Complete today's challenge to maintain your streak</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-3xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
                <Button size="lg" asChild>
                  <a href="/challenges/daily/today">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Start Challenge
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">This Week's Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Array Sum', lang: 'Python', difficulty: 'Easy', xp: 50, date: 'Today' },
                { title: 'String Reversal', lang: 'JavaScript', difficulty: 'Easy', xp: 50, date: 'Yesterday' },
                { title: 'Palindrome Check', lang: 'Python', difficulty: 'Medium', xp: 75, date: '2 days ago' },
                { title: 'Fibonacci Sequence', lang: 'JavaScript', difficulty: 'Medium', xp: 75, date: '3 days ago' },
                { title: 'Prime Numbers', lang: 'Python', difficulty: 'Hard', xp: 100, date: '4 days ago' },
                { title: 'Binary Search', lang: 'JavaScript', difficulty: 'Hard', xp: 100, date: '5 days ago' },
              ].map((challenge, i) => (
                <div key={i} className="card p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{challenge.lang}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      challenge.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' :
                      challenge.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>{challenge.difficulty}</span>
                  </div>
                  <h4 className="font-semibold mb-2">{challenge.title}</h4>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{challenge.date}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{challenge.xp} XP</span>
                  </div>
                  <Button className="w-full mt-3" variant="outline" asChild>
                    <a href={`/challenges/daily/${i + 1}`}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Solve
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Weekly Contest #42</h3>
            <p className="text-muted-foreground mb-4">Compete with learners worldwide in this week's coding contest. 5 problems, 2 hours.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Problems</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">2h</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">2,000</p>
                <p className="text-sm text-muted-foreground">Max XP</p>
              </div>
            </div>
            <Button className="w-full" size="lg">Register for Contest</Button>
          </div>
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
            <Button variant="outline"><Search className="w-4 h-4 mr-2" />Search</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Two Sum', topic: 'Arrays', difficulty: 'Easy', xp: 50 },
              { title: 'Valid Parentheses', topic: 'Stack', difficulty: 'Easy', xp: 50 },
              { title: 'Merge Intervals', topic: 'Intervals', difficulty: 'Medium', xp: 75 },
              { title: 'Longest Substring', topic: 'Sliding Window', difficulty: 'Medium', xp: 75 },
              { title: 'Trapping Rain Water', topic: 'Two Pointers', difficulty: 'Hard', xp: 100 },
              { title: 'Median of Two Arrays', topic: 'Binary Search', difficulty: 'Hard', xp: 100 },
            ].map((challenge, i) => (
              <div key={i} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs rounded">{challenge.topic}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    challenge.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' :
                    challenge.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>{challenge.difficulty}</span>
                </div>
                <h4 className="font-semibold mb-2">{challenge.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground"><Trophy className="w-3 h-3" />{challenge.xp} XP</span>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/challenges/practice/${i + 1}`}>
                      <PlayCircle className="w-3 h-3 mr-1" />
                      Practice
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'contests' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Upcoming Contests</h3>
            <div className="space-y-3">
              {[
                { name: 'CodeForge Weekly #43', date: 'Tomorrow 7:00 PM', duration: '2 hours', problems: 5, registered: 890 },
                { name: 'Algorithm Sprint', date: 'Friday 6:00 PM', duration: '1 hour', problems: 3, registered: 1240 },
                { name: 'Data Structures Challenge', date: 'Next Monday 8:00 PM', duration: '3 hours', problems: 6, registered: 560 },
              ].map((contest, i) => (
                <div key={i} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">{contest.name}</h4>
                    <p className="text-sm text-muted-foreground">{contest.date} · {contest.duration} · {contest.problems} problems</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{contest.registered} registered</span>
                    <Button variant="outline" size="sm">Register</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Past Contests</h3>
            <div className="space-y-2">
              {[
                { name: 'Weekly #42', date: '3 days ago', rank: '#45', xp: 1200 },
                { name: 'Algorithm Sprint', date: '1 week ago', rank: '#12', xp: 2100 },
                { name: 'Data Structures', date: '2 weeks ago', rank: '#78', xp: 800 },
              ].map((contest, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg">
                  <div>
                    <p className="font-medium">{contest.name}</p>
                    <p className="text-sm text-muted-foreground">{contest.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Rank: {contest.rank}</span>
                    <span className="text-green-500 font-semibold">+{contest.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}