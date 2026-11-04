import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/projects', label: 'Projects' },
    { to: '/my-projects', label: 'My Projects' },
    { to: '/exchanges', label: 'Exchanges' },
    { to: '/people', label: 'People' },
    { to: '/notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-indigo-600 tracking-tight">
                SkillBridge
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile/edit"
                    className="text-sm font-medium text-slate-700 hover:text-indigo-600"
                  >
                    {user.fullName || user.email}
                  </Link>
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    Log out
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <span className="text-xl font-bold leading-none block w-6 h-6 text-center">✕</span>
                ) : (
                  <span className="text-xl font-bold leading-none block w-6 h-6 text-center">☰</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
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
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    to="/profile/edit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-indigo-600 font-medium"
                  >
                    Edit profile
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Log out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          SkillBridge &copy; {new Date().getFullYear()} — Student Collaboration Platform
        </div>
      </footer>
    </div>
  );
}

