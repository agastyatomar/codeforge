import { Settings, Monitor, Globe, Palette, Bell, Shield, Key, Database, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export function Settings() {
  const [tab, setTab] = useState<'general' | 'appearance' | 'editor' | 'ai' | 'privacy' | 'advanced'>('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Code2 },
    { id: 'ai', label: 'AI Assistant', icon: Zap },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="card overflow-hidden">
        <div className="border-b">
          <nav className="flex overflow-x-auto px-4" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 space-y-8">
          {tab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Account</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Username</label>
                      <input type="text" className="input" defaultValue="CodeForge User" />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input type="email" className="input" defaultValue="user@codeforge.local" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Bio</label>
                    <textarea className="textarea" rows={3} placeholder="Tell others about yourself..." />
                  </div>
                  <Button>Save Changes</Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Notifications</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Email notifications', desc: 'Receive email updates about your progress' },
                    { label: 'Push notifications', desc: 'Get browser notifications for achievements' },
                    { label: 'Weekly progress report', desc: 'Receive a summary of your weekly activity' },
                    { label: 'Community mentions', desc: 'Get notified when someone mentions you' },
                  ].map((notif, i) => (
                    <label key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <div>
                        <p className="font-medium">{notif.label}</p>
                        <p className="text-sm text-muted-foreground">{notif.desc}</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 rounded border-input" defaultChecked />
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Data Management</h3>
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline">Export Data</Button>
                  <Button variant="outline">Import Data</Button>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['System', 'Light', 'Dark', 'High Contrast', 'Sepia', 'Nord', 'Dracula'].map((theme) => (
                    <label key={theme} className="relative cursor-pointer">
                      <input type="radio" name="theme" className="sr-only" defaultChecked={theme === 'System'} />
                      <div className={`p-4 rounded-lg border-2 transition-colors ${theme === 'System' ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                        <p className="font-medium">{theme}</p>
                        <p className="text-sm text-muted-foreground mt-1">Adapts to your system preference</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Language</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic', 'Hindi'].map((lang) => (
                    <label key={lang} className="p-3 rounded-lg border hover:border-primary/50 cursor-pointer">
                      <input type="radio" name="lang" className="sr-only" defaultChecked={lang === 'English'} />
                      <p className="font-medium">{lang}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Font Size</h3>
                <div className="flex items-center gap-4">
                  <input type="range" min="12" max="24" step="1" defaultValue={14} className="flex-1" />
                  <span className="text-sm text-muted-foreground w-12">14px</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'editor' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Editor Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Tab Size</label>
                      <select className="input" defaultValue="2">
                        <option value="2">2 spaces</option>
                        <option value="4">4 spaces</option>
                        <option value="tab">Tabs</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Font Family</label>
                      <select className="input" defaultValue="JetBrains Mono">
                        <option>JetBrains Mono</option>
                        <option>Fira Code</option>
                        <option>Cascadia Code</option>
                        <option>Monospace</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Format on Save', desc: 'Automatically format code when saving' },
                      { label: 'Format on Paste', desc: 'Format pasted code automatically' },
                      { label: 'Word Wrap', desc: 'Wrap long lines' },
                      { label: 'Minimap', desc: 'Show code minimap' },
                      { label: 'Line Numbers', desc: 'Show line numbers' },
                      { label: 'Bracket Pair Colorization', desc: 'Color matching brackets' },
                    ].map((setting, i) => (
                      <label key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                        <div>
                          <p className="font-medium">{setting.label}</p>
                          <p className="text-sm text-muted-foreground">{setting.desc}</p>
                        </div>
                        <input type="checkbox" className="w-4 h-4 rounded border-input" defaultChecked />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">AI Assistant</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Provider</label>
                    <select className="input" defaultValue="ollama">
                      <option value="ollama">Ollama (Local)</option>
                      <option value="transformers">Transformers.js (Browser)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Ollama URL</label>
                    <input type="url" className="input" defaultValue="http://localhost:11434" />
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <select className="input" defaultValue="codellama:7b">
                      <option value="codellama:7b">CodeLlama 7B</option>
                      <option value="codellama:13b">CodeLlama 13B</option>
                      <option value="deepseek-coder:6.7b">DeepSeek Coder 6.7B</option>
                      <option value="wizardcoder:7b">WizardCoder 7B</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="ai-enabled" className="w-4 h-4 rounded border-input" defaultChecked />
                    <label htmlFor="ai-enabled" className="flex-1">
                      <p className="font-medium">Enable AI Assistant</p>
                      <p className="text-sm text-muted-foreground">Get code completions, explanations, and debugging help</p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Features</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Inline Completions', desc: 'Show code suggestions as you type' },
                    { label: 'Code Explanations', desc: 'Right-click to explain selected code' },
                    { label: 'Debugging Help', desc: 'Get help fixing errors' },
                    { label: 'Test Generation', desc: 'Generate unit tests for your code' },
                    { label: 'Refactoring Suggestions', desc: 'Get suggestions to improve code' },
                  ].map((feature, i) => (
                    <label key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <div>
                        <p className="font-medium">{feature.label}</p>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 rounded border-input" defaultChecked />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Data Collection</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Anonymous usage analytics', desc: 'Help improve CodeForge with anonymous data', enabled: false },
                    { label: 'Crash reporting', desc: 'Automatically report crashes for debugging', enabled: true },
                    { label: 'Feature usage tracking', desc: 'Track which features are used most', enabled: false },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 rounded border-input" defaultChecked={item.enabled} />
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Local Data</h3>
                <p className="text-muted-foreground mb-4">All your data is stored locally on your device. CodeForge does not send your code, progress, or personal data to any external servers.</p>
                <div className="flex gap-3">
                  <Button variant="outline">View Stored Data</Button>
                  <Button variant="outline">Clear All Data</Button>
                </div>
              </div>
            </div>
          )}

          {tab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Developer Options</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Enable debug logging', desc: 'Show detailed logs in console' },
                    { label: 'Experimental features', desc: 'Access beta features' },
                    { label: 'Strict mode', desc: 'Enforce strict TypeScript/ESLint rules' },
                    { label: 'Performance monitoring', desc: 'Show performance metrics' },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 rounded border-input" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Danger Zone</h3>
                <div className="flex gap-3">
                  <Button variant="outline">Reset All Settings</Button>
                  <Button variant="destructive">Clear All Data</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}