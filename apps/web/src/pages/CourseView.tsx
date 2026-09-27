import { ArrowLeft, BookOpen, Clock, Trophy, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function CourseView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/courses" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      <div className="card overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Python</span>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">Beginner</span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">12 hours</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Python Fundamentals</h1>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            Master Python from the ground up. Learn variables, control flow, functions, data structures, and object-oriented programming through hands-on exercises and real-world projects.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />12 hours</span>
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />48 lessons</span>
            <span className="flex items-center gap-1"><Trophy className="w-4 h-4" />1,200 XP</span>
          </div>
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link to="/courses/course-1/lessons/lesson-1">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Learning
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
        <div className="space-y-2">
          {[
            { title: 'Introduction to Python', lessons: 4, xp: 200 },
            { title: 'Variables & Data Types', lessons: 6, xp: 300 },
            { title: 'Control Flow', lessons: 8, xp: 400 },
            { title: 'Functions', lessons: 6, xp: 350 },
            { title: 'Data Structures', lessons: 8, xp: 500 },
            { title: 'Object-Oriented Programming', lessons: 8, xp: 600 },
            { title: 'File I/O & Modules', lessons: 4, xp: 300 },
            { title: 'Final Project', lessons: 4, xp: 500 },
          ].map((chapter, i) => (
            <div key={i} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">{i + 1}</span>
                <div>
                  <h4 className="font-medium">{chapter.title}</h4>
                  <p className="text-sm text-muted-foreground">{chapter.lessons} lessons · {chapter.xp} XP</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/courses/course-1/lessons/lesson-${i + 1}`}>View Lessons</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}