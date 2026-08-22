import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { homeForSession } from '../utils/auth';
import { ROUTES } from '../utils/constants';
import Avatar from './Avatar';

function PublicNavbar({ session = null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <nav
        aria-label="Public navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          to={ROUTES.landing}
          className="flex items-center gap-2 rounded-md text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg text-white"
          >
            W
          </span>
          <span>WriteSpace</span>
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar role={session.role} size="sm" />
              <div className="leading-tight">
                <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
                  {session.displayName}
                </p>
                <p className="text-xs capitalize text-slate-500">
                  {session.role}
                </p>
              </div>
            </div>
            <Link
              to={homeForSession(session)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={ROUTES.login}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-4"
            >
              Log in
            </Link>
            <Link
              to={ROUTES.register}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-4"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

PublicNavbar.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }),
};

export default PublicNavbar;