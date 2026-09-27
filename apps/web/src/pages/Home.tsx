import { Link } from 'react-router-dom';
import { Code, BookOpen, Globe, Zap, Trophy, MessageSquare, Layers, Palette, ArrowRight, CheckCircle, Target, Users, Code2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>CodeForge v0.1.0 - Local-First Learning Platform</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Learn to Code <span className="text-gradient">Locally</span>
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
            A complete learn-to-code platform that runs 100% on your machine. No cloud, no subscriptions, no limits.
            All the features of codedex.io plus 20+ major enhancements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/courses">
                <Code className="w-5 h-5 mr-2" />
                Start Learning
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/builds">
                <Code2 className="w-5 h-5 mr-2" />
                Create a Build
              </Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 100% Local</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> No Account Required</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Works Offline</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Free Forever</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything You Need to Learn</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All codedex.io features running locally, plus powerful enhancements
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Interactive Courses',
                desc: '50+ courses in Python, JavaScript, React, Rust, Go, and more with hands-on exercises',
                features: ['Auto-grading', 'Hints system', 'Progress tracking', 'Certificates'],
              },
              {
                icon: Code,
                title: 'Advanced Code Editor',
                desc: 'VS Code-like experience with IntelliSense, debugging, Git, terminal, and live preview',
                features: ['Multi-file projects', 'Asset management', 'Real-time collaboration', '100+ templates'],
              },
              {
                icon: Globe,
                title: 'Virtual Worlds',
                desc: 'Phaser-based multiplayer worlds for social learning, events, and collaboration',
                features: ['Customizable avatars', 'Real-time chat', 'Mini-games', 'Persistent worlds'],
              },
              {
                icon: Zap,
                title: 'Local AI Assistant',
                desc: 'Code completion, explanation, debugging, and generation powered by local LLMs',
                features: ['Ollama integration', 'Transformers.js fallback', 'Offline capable', 'Privacy-first'],
              },
              {
                icon: Trophy,
                title: 'Gamification',
                desc: 'XP, badges, achievements, streaks, leaderboards, and competitive programming',
                features: ['500+ achievements', 'Daily challenges', 'Contest mode', 'Streak freezes'],
              },
              {
                icon: MessageSquare,
                title: 'Community Features',
                desc: 'Forum, posts, tech news, mentorship, and code review workflows',
                features: ['Rich text editor', 'Image uploads', 'Mentor matching', 'Code reviews'],
              },
            ].map((feature, i) => (
              <div key={i} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground mb-4">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features */}
      <section className="bg-muted/30 rounded-2xl p-8 lg:p-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Beyond codedex.io</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              20+ major enhancements that make CodeForge the most powerful local learning platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Adaptive Learning', desc: 'AI-powered personalized learning paths and spaced repetition' },
              { icon: Users, title: 'Mentorship System', desc: 'Local mentor matching with structured code review workflows' },
              { icon: Code2, title: 'Competitive Programming', desc: 'Contest mode, problem sets, ICPC-style rankings' },
              { icon: Layers, title: 'Plugin Architecture', desc: 'Extensible plugin system for courses, languages, and tools' },
              { icon: Palette, title: 'Theming Engine', desc: 'Custom themes, dark/light/high-contrast with CSS variables' },
              { icon: Globe, title: '20+ Languages', desc: 'Rust, Go, TypeScript, Kotlin, Swift, Lua, Zig, and more' },
              { icon: Sparkles, title: 'Accessibility First', desc: 'WCAG 2.1 AA compliant with screen reader optimization' },
              { icon: Users, title: 'P2P Collaboration', desc: 'WebRTC-based local network sync and pair programming' },
            ].map((feature, i) => (
              <div key={i} className="card p-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-purple-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Start Your Coding Journey?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Clone CodeForge, run it locally, and start learning immediately. No setup, no costs, no limits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href="https://github.com/your-org/codeforge" target="_blank" rel="noopener noreferrer">
                <Code className="w-5 h-5 mr-2" />
                View on GitHub
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/courses">
                Browse Courses
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}