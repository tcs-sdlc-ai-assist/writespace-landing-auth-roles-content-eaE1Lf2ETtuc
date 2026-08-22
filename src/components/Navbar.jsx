import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, homeForSession, isAdmin } from '../utils/auth';
import { ROUTES } from '../utils/constants';
import Avatar from './Avatar';

const baseLinkClasses =
  'rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2';

function getNavLinkClasses({ isActive }) {
  return `${baseLinkClasses} ${
    isActive
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;
}

function Navbar({ session }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const admin = isAdmin(session);
  const navigationItems = admin
    ? [
        { label: 'Dashboard', to: ROUTES.admin },
        { label: 'Blogs', to: ROUTES.blogs },
        { label: 'Write', to: ROUTES.write },
        { label: 'Users', to: ROUTES.users },
      ]
    : [
        { label: 'Blogs', to: ROUTES.blogs },
        { label: 'Write', to: ROUTES.write },
      ];

  function closeMenus() {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }

  function handleLogout() {
    setLogoutError('');

    if (!clearSession()) {
      setLogoutError('Unable to log out. Please try again.');
      return;
    }

    closeMenus();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <nav
        aria-label="Authenticated navigation"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex min-h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              to={homeForSession(session)}
              onClick={closeMenus}
              className="flex shrink-0 items-center gap-2 rounded-md text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg text-white"
              >
                W
              </span>
              <span>WriteSpace</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={getNavLinkClasses}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {logoutError && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {logoutError}
              </p>
            )}

            <div className="relative">
              <button
                type="button"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                aria-controls="profile-menu"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Avatar role={session.role} size="sm" />
                <span className="min-w-0">
                  <span className="block max-w-40 truncate text-sm font-semibold text-slate-900">
                    {session.displayName}
                  </span>
                  <span className="block text-xs capitalize text-slate-500">
                    {session.role}
                  </span>
                </span>
                <span aria-hidden="true" className="text-xs text-slate-500">
                  ▾
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  id="profile-menu"
                  role="menu"
                  className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={
              isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 md:hidden"
          >
            <span aria-hidden="true">{isMobileMenuOpen ? '×' : '☰'}</span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-slate-200 py-4 md:hidden"
          >
            <div className="mb-4 flex items-center gap-3 px-2">
              <Avatar role={session.role} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {session.displayName}
                </p>
                <p className="text-xs capitalize text-slate-500">
                  {session.role}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMenus}
                  className={getNavLinkClasses}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Log out
              </button>
              {logoutError && (
                <p
                  role="alert"
                  className="mt-2 px-3 text-sm font-medium text-red-600"
                >
                  {logoutError}
                </p>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

Navbar.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default Navbar;