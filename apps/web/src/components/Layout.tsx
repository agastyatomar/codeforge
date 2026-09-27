import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useLocaleStore } from '../store/localeStore';
import { Menu, X, Home, BookOpen, Code, Globe, User, Settings, Trophy, MessageSquare, Zap, Layers, Palette, ChevronDown, LogOut, Sun, Moon, Monitor, Smartphone, Tablet } from 'lucide-react';
import { clsx } from 'clsx';

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false);
  const [localeMenuOpen, setLocaleMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/builds', label: 'Builds', icon: Code },
    { path: '/worlds', label: 'Worlds', icon: Globe },
    { path: '/challenges', label: 'Challenges', icon: Zap },
    { path: '/community', label: 'Community', icon: MessageSquare },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-primary" aria-label="CodeForge Home">
                <Code className="w-8 h-8" />
                <span>CodeForge</span>
              </NavLink>

              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )
                    }
                  >
                    <item.icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Change theme"
                  aria-expanded={themeMenuOpen}
                >
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                {themeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                    {['light', 'dark', 'system'].map((t) => (
                      <button
                        key={t}
                        onClick={() => { toggleTheme(t as any); setThemeMenuOpen(false); }}
                        className={clsx(
                          'w-full px-4 py-2 text-left text-sm transition-colors',
                          theme === t ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                        )}
                      >
                        <Monitor className="w-4 h-4 inline mr-2" />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setLocaleMenuOpen(!localeMenuOpen)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Change language"
                  aria-expanded={localeMenuOpen}
                >
                  <Globe className="w-5 h-5" />
                </button>
                {localeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-popover border border-border rounded-lg shadow-lg py-1 z-50 max-h-60 overflow-auto">
                    {['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar', 'hi'].map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLocale(l); setLocaleMenuOpen(false); }}
                        className={clsx(
                          'w-full px-4 py-2 text-left text-sm transition-colors',
                          locale === l ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                        )}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                      <NavLink
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </NavLink>
                      <NavLink
                        to="/avatar"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Palette className="w-4 h-4" />
                        Customize Avatar
                      </NavLink>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-accent"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Login
                </NavLink>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                      location.pathname === item.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-surface border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">CodeForge</h3>
              <p className="text-muted-foreground text-sm">Learn to code locally. No cloud required.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Learn</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><NavLink to="/courses" className="hover:text-primary">Courses</NavLink></li>
                <li><NavLink to="/challenges" className="hover:text-primary">Challenges</NavLink></li>
                <li><NavLink to="/builds" className="hover:text-primary">Builds</NavLink></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><NavLink to="/community" className="hover:text-primary">Forum</NavLink></li>
                <li><NavLink to="/leaderboard" className="hover:text-primary">Leaderboard</NavLink></li>
                <li><NavLink to="/worlds" className="hover:text-primary">Worlds</NavLink></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com/codeforge" target="_blank" rel="noopener noreferrer" className="hover:text-primary">GitHub</a></li>
                <li><a href="/docs" className="hover:text-primary">Documentation</a></li>
                <li><a href="/about" className="hover:text-primary">About</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>CodeForge - Local-first learn to code platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}