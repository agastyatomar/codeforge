import { BookOpen, Filter, Search, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Courses() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="text-primary" />
            Courses
          </h1>
          <p className="text-muted-foreground mt-1">Explore 50+ interactive courses across multiple programming languages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Search className="w-4 h-4 mr-2" />Search</Button>
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Python Fundamentals', language: 'Python', level: 'Beginner', hours: 12, lessons: 48, students: '15.2k' },
          { title: 'HTML & CSS Basics', language: 'HTML/CSS', level: 'Beginner', hours: 8, lessons: 32, students: '12.8k' },
          { title: 'JavaScript Essentials', language: 'JavaScript', level: 'Beginner', hours: 15, lessons: 56, students: '18.4k' },
          { title: 'React Fundamentals', language: 'React', level: 'Intermediate', hours: 20, lessons: 64, students: '8.7k' },
          { title: 'Node.js Backend', language: 'Node.js', level: 'Intermediate', hours: 18, lessons: 52, students: '6.3k' },
          { title: 'Rust for Beginners', language: 'Rust', level: 'Beginner', hours: 25, lessons: 72, students: '3.1k' },
        ].map((course, i) => (
          <div key={i} className="card overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{course.language}</span>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">{course.level}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
              <p className="text-muted-foreground mb-4">Learn the fundamentals and build real projects</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><ChevronDown className="w-3 h-3" />{course.hours}h</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons} lessons</span>
                <span className="flex items-center gap-1"><ChevronDown className="w-3 h-3" />{course.students} learners</span>
              </div>
            </div>
            <div className="px-6 pb-6">
              <Button className="w-full" asChild>
                <a href={`/courses/course-${i + 1}`}>Start Course</a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}