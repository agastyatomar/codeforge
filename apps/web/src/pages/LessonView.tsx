import { ArrowLeft, BookOpen, PlayCircle, CheckCircle, Clock, Trophy, Code2, Terminal, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export function LessonView() {
  const [activeTab, setActiveTab] = useState<'content' | 'exercises' | 'notes'>('content');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/courses/course-1" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to Course
      </Link>

      <div className="card overflow-hidden">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Lesson 3</span>
              <h2 className="text-xl font-semibold">Control Flow: If/Else Statements</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />25 min</span>
              <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />75 XP</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6 border-b">
            {['content', 'exercises', 'notes'].map((tab) => (
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

          {activeTab === 'content' && (
            <div className="prose prose-dark max-w-none space-y-6">
              <h3>Understanding Conditional Logic</h3>
              <p>
                Conditional statements allow your programs to make decisions based on different conditions.
                The <code>if</code>, <code>elif</code>, and <code>else</code> keywords are the building blocks of decision-making in Python.
              </p>
              <h4>Basic If Statement</h4>
              <pre><code>{`age = 18
if age >= 18:
    print("You are an adult")`}</code></pre>
              <h4>If-Else Statement</h4>
              <pre><code>{`score = 85
if score >= 60:
    print("Pass")
else:
    print("Fail")`}</code></pre>
              <h4>Elif for Multiple Conditions</h4>
              <pre><code>{`grade = 85
if grade >= 90:
    print("A")
elif grade >= 80:
    print("B")
elif grade >= 70:
    print("C")
else:
    print("F")`}</code></pre>
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="space-y-4">
              <div className="card p-6">
                <h3 className="font-semibold mb-4">Practice Exercises</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Exercise 1: Age Check', type: 'code', xp: 50 },
                    { title: 'Exercise 2: Grade Calculator', type: 'code', xp: 75 },
                    { title: 'Exercise 3: Number Comparison', type: 'multiple-choice', xp: 40 },
                  ].map((ex, i) => (
                    <Button key={i} variant="outline" className="w-full justify-between" asChild>
                      <Link to={`/courses/course-1/lessons/lesson-3/exercises/ex-${i + 1}`}>
                        <span className="flex items-center gap-2">
                          <Code2 className="w-4 h-4" />
                          {ex.title}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Trophy className="w-3 h-3" />{ex.xp} XP
                        </span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Your Notes</h3>
              <textarea
                className="w-full min-h-[200px] p-4 bg-background border rounded-lg focus:ring-2 focus:ring-ring"
                placeholder="Take notes while learning..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="lg" asChild>
          <Link to="/courses/course-1/lessons/lesson-2">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Lesson
          </Link>
        </Button>
        <Button size="lg" asChild>
          <Link to="/courses/course-1/lessons/lesson-4">
            Next Lesson
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}