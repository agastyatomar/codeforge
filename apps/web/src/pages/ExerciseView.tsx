import { ArrowLeft, PlayCircle, CheckCircle, XCircle, Terminal, RefreshCw, Code2, Copy, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';

export function ExerciseView() {
  const [code, setCode] = useState(`def check_age(age):
    # TODO: Return "adult" if age >= 18, "minor" otherwise
    pass

# Test cases
print(check_age(20))  # Should print "adult"
print(check_age(15))  # Should print "minor"
print(check_age(18))  # Should print "adult"`);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [passedTests, setPassedTests] = useState(0);
  const [totalTests, setTotalTests] = useState(3);

  const runCode = async () => {
    setStatus('running');
    setOutput('Running...\n');
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Simple simulation
      const result = `adult\nminor\nadult`;
      setOutput(`✓ Test 1 passed: check_age(20) == "adult"\n✓ Test 2 passed: check_age(15) == "minor"\n✓ Test 3 passed: check_age(18) == "adult"\n\nAll tests passed!`);
      setStatus('success');
      setPassedTests(3);
    } catch (error) {
      setOutput(`✗ Error: ${error}`);
      setStatus('error');
    }
  };

  const resetCode = () => {
    setCode(`def check_age(age):
    # TODO: Return "adult" if age >= 18, "minor" otherwise
    pass

# Test cases
print(check_age(20))  # Should print "adult"
print(check_age(15))  # Should print "minor"
print(check_age(18))  # Should print "adult"`);
    setOutput('');
    setStatus('idle');
    setPassedTests(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link to="/courses/course-1/lessons/lesson-3" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to Lesson
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="card flex flex-col h-[70vh] lg:h-[80vh]">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">exercise.py</h3>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Python</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm">
                <Trophy className="w-3 h-3" />50 XP
              </span>
            </div>
          </div>
          
          <div className="flex-1 p-4 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full font-mono text-sm bg-background border rounded-lg p-4 focus:ring-2 focus:ring-ring resize-none"
              placeholder="Write your code here..."
              spellCheck={false}
            />
            {status === 'running' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 text-white">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Running tests...
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-4 flex flex-wrap gap-2">
            <Button onClick={runCode} disabled={status === 'running'} className="flex-1 sm:flex-none">
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Code
            </Button>
            <Button variant="outline" onClick={resetCode}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>

        {/* Instructions & Output Panel */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Exercise: Age Check</h3>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Code Challenge</span>
            </div>
            
            <div className="prose prose-dark max-w-none space-y-4">
              <p>Complete the <code>check_age</code> function that takes an age as input and returns:</p>
              <ul>
                <li><code>"adult"</code> if age is 18 or older</li>
                <li><code>"minor"</code> if age is under 18</li>
              </ul>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Test Cases</h4>
                <div className="font-mono text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>check_age(20)</span>
                    <span className="text-green-500">→ "adult"</span>
                  </div>
                  <div className="flex justify-between">
                    <span>check_age(15)</span>
                    <span className="text-green-500">→ "minor"</span>
                  </div>
                  <div className="flex justify-between">
                    <span>check_age(18)</span>
                    <span className="text-green-500">→ "adult"</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" asChild>
                <Link to="/courses/course-1/lessons/lesson-3/exercises/ex-2">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous Exercise
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/courses/course-1/lessons/lesson-3/exercises/ex-4">
                  Next Exercise
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Output
            </h3>
            <div className="bg-background border rounded-lg p-4 min-h-[200px] font-mono text-sm overflow-auto">
              {status === 'success' ? (
                <>
                  <div className="text-green-500 mb-2">✓ All 3 tests passed!</div>
                  <pre className="text-muted-foreground">{output}</pre>
                </>
              ) : status === 'error' ? (
                <div className="text-red-500">{output}</div>
              ) : (
                <div className="text-muted-foreground">Run your code to see output here...</div>
              )}
            </div>
          </div>

          {status === 'success' && (
            <div className="card p-6 border-green-500/50 bg-green-500/5">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-500">Exercise Complete!</h3>
                  <p className="text-muted-foreground">You earned 50 XP. Great job!</p>
                </div>
              </div>
              <Button className="mt-4 w-full" asChild>
                <Link to="/courses/course-1/lessons/lesson-3/exercises/ex-4">
                  Continue to Next Exercise
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}