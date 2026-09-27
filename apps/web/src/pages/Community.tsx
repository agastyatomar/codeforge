import { MessageSquare, Zap, Trophy, Filter, Search, Plus, ChevronRight, Heart, Flame, BookOpen, Code2, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export function Community() {
  const [activeChannel, setActiveChannel] = useState<'general' | 'help' | 'showcase' | 'off-topic'>('general');
  const [posts, setPosts] = useState([
    { id: 1, author: 'CodeMaster', avatar: '👨‍💻', channel: 'general', title: 'Just completed my first Python course!', content: 'After 3 weeks of learning, I finally finished the Python Fundamentals course. The exercises were challenging but rewarding. Thanks to the community for all the help!', time: '2 hours ago', reactions: { '👍': 24, '❤️': 12, '🎉': 8 }, replies: 15 },
    { id: 2, author: 'ScriptKitty', avatar: '🐱‍💻', channel: 'showcase', title: 'My first React portfolio website', content: 'Built this using the React + Vite template. Features dark mode, smooth animations, and a project showcase section. Check it out!', image: 'https://picsum.photos/600/300', time: '5 hours ago', reactions: { '👍': 42, '❤️': 18, '🚀': 10 }, replies: 8 },
    { id: 3, author: 'BugHunter', avatar: '🐛', channel: 'help', title: 'Stuck on recursive functions exercise', content: 'Can someone explain how the base case works in this recursive factorial function? I keep getting stack overflow errors.', code: 'def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)', time: '1 day ago', reactions: { '👍': 8, '👀': 5 }, replies: 12 },
  ]);

  const channels = [
    { id: 'general', name: 'General', icon: MessageSquare, count: 1240 },
    { id: 'help', name: 'Help & Questions', icon: Heart, count: 890 },
    { id: 'showcase', name: 'Showcase', icon: Zap, count: 560 },
    { id: 'off-topic', name: 'Off Topic', icon: Flame, count: 320 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="text-primary" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1">Connect with fellow learners, share projects, and get help</p>
        </div>
        <Button variant="outline"><Plus className="w-4 h-4 mr-2" />New Post</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-4">
            <h3 className="font-semibold mb-4">Channels</h3>
            <nav className="space-y-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeChannel === ch.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <ch.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{ch.name}</span>
                  <span className="text-xs text-muted-foreground">{ch.count.toLocaleString()}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-4">Trending Topics</h3>
            <div className="space-y-2">
              {['#python', '#react', '#javascript', '#webdev', '#rust', '#beginner'].map((tag, i) => (
                <button key={i} className="w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm"><Search className="w-4 h-4 mr-1" />Search</Button>
            <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" />Filter</Button>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="card p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {post.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{post.author}</span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{activeChannel}</span>
                      <span className="text-sm text-muted-foreground">{post.time}</span>
                    </div>
                    {post.title && <h3 className="font-semibold mt-1">{post.title}</h3>}
                  </div>
                </div>

                <div className="prose prose-dark max-w-none mb-4">
                  <p>{post.content}</p>
                  {post.code && (
                    <pre className="bg-background p-4 rounded-lg overflow-auto"><code>{post.code}</code></pre>
                  )}
                  {post.image && (
                    <img src={post.image} alt="Post image" className="rounded-lg max-h-64 w-full object-cover mt-2" />
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex gap-2">
                    {Object.entries(post.reactions).map(([emoji, count]) => (
                      <button key={emoji} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm hover:bg-accent transition-colors">
                        <span>{emoji}</span>
                        <span>{count}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {post.replies} replies
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}