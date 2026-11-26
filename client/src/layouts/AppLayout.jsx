import { useId, useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const menuId = useId();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setLogoutError(error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/projects', label: 'Projects' },
    { to: '/my-projects', label: 'My Projects' },
    { to: '/applications', label: 'My applications' },
    { to: '/exchanges', label: 'Exchanges' },
    { to: '/people', label: 'People' },
  ];

  const profileUrl = user?.id ? `/users/${user.id}` : '/profile/edit';
  const userInitial = (user?.fullName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 lg:gap-6">
              <Link to="/" className="text-xl font-bold text-indigo-700 tracking-tight">
                SkillBridge
              </Link>

              {/* Desktop Nav Links */}
              <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `px-2 py-2 lg:px-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Desktop User Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <Link to="/projects/new" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">Create project</Link>
              {user && (
                <div className="flex items-center gap-3">
                  <Link
                    to={profileUrl}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-700 transition-colors"
                    aria-label="View your public profile"
                  >
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 border border-indigo-200">
                      {userInitial}
                    </span>
                    <span className="hidden max-w-[140px] truncate lg:inline">
                      {user.fullName || user.email}
                    </span>
                  </Link>
                  <Button variant="secondary" size="sm" loading={isLoggingOut} onClick={handleLogout}>
                    Log out
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 lg:gap-0">
              <NotificationBell onClick={() => setMobileMenuOpen(false)} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-expanded={mobileMenuOpen}
                aria-controls={menuId}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <span aria-hidden="true" className="block size-6 text-center text-xl font-bold leading-none">
                  {mobileMenuOpen ? '✕' : '☰'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <nav id={menuId} aria-label="Mobile navigation" hidden={!mobileMenuOpen} className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md [overflow-wrap:anywhere]">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="pt-4 border-t border-slate-200 mt-2 flex flex-col gap-2">
            {user && (
              <>
                <div className="px-3 py-1 text-sm font-medium text-slate-700">
                  Signed in as <span className="font-semibold">{user.fullName || user.email}</span>
                </div>
                <Link
                  to={profileUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-700 hover:text-indigo-700 font-medium"
                >
                  Public profile
                </Link>
                <Link
                  to="/profile/edit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-indigo-700 font-medium"
                >
                  Edit profile
                </Link>
                <Link
                  to="/projects/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-indigo-700 font-medium"
                >
                  Create project
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-1"
                  loading={isLoggingOut}
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 [overflow-wrap:anywhere]">
        <ErrorBanner error={logoutError} onRetry={handleLogout} className="mb-4" />
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-700">
        <div className="max-w-6xl mx-auto px-4">
          SkillBridge &copy; {new Date().getFullYear()} — Student Collaboration Platform
        </div>
      </footer>
    </div>
  );
}
