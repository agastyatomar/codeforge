import { Link } from 'react-router-dom';
import { Home, Search, Code2, BookOpen, Zap, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="mb-8">
        <Code2 className="w-24 h-24 text-primary/50 mx-auto mb-6" />
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto mb-8">
          Looks like you've wandered into uncharted territory. The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="space-y-6 max-w-md w-full">
        <Button size="lg" asChild className="w-full">
          <Link to="/">
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="w-full">
          <Link to="/courses">
            <BookOpen className="w-5 h-5 mr-2" />
            Browse Courses
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="w-full">
          <Link to="/builds">
            <Code2 className="w-5 h-5 mr-2" />
            Create a Build
          </Link>
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full">
        <Link to="/courses" className="card p-4 hover:shadow-lg transition-shadow group">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Courses</h3>
          <p className="text-sm text-muted-foreground">50+ interactive courses</p>
        </Link>
        <Link to="/builds" className="card p-4 hover:shadow-lg transition-shadow group">
          <Code2 className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Builds</h3>
          <p className="text-sm text-muted-foreground">Create projects</p>
        </Link>
        <Link to="/worlds" className="card p-4 hover:shadow-lg transition-shadow group">
          <Globe className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Worlds</h3>
          <p className="text-sm text-muted-foreground">Virtual worlds</p>
        </Link>
        <Link to="/challenges" className="card p-4 hover:shadow-lg transition-shadow group">
          <Zap className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Challenges</h3>
          <p className="text-sm text-muted-foreground">Daily challenges</p>
        </Link>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">Or search for what you need</p>
        <div className="mt-4 flex gap-2 justify-center">
          <input type="search" placeholder="Search courses, builds, challenges..." className="input w-80" />
          <Button>Search</Button>
        </div>
      </div>
    </div>
  );
}