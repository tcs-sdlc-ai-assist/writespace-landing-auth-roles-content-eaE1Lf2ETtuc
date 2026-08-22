import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  authenticate,
  homeForSession,
  setSession,
} from '../utils/auth';
import { ROUTES, STORAGE_ERROR_MESSAGE } from '../utils/constants';
import { validateRequiredFields } from '../utils/validation';

const initialForm = {
  username: '',
  password: '',
};

function LoginPage({ session = null }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pageError, setPageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) {
    return <Navigate to={homeForSession(session)} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
    setPageError('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    setPageError('');

    const errors = validateRequiredFields(form, {
      username: 'Username',
      password: 'Password',
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedSession = authenticate(form.username, form.password);

      if (!authenticatedSession) {
        setPageError('Invalid username or password.');
        return;
      }

      if (!setSession(authenticatedSession)) {
        setPageError(STORAGE_ERROR_MESSAGE);
        return;
      }

      navigate(homeForSession(authenticatedSession), { replace: true });
    } catch {
      setPageError('Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-100 px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <Link
          to={ROUTES.landing}
          className="mx-auto flex w-fit items-center gap-2 rounded-md text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm"
          >
            W
          </span>
          <span>WriteSpace</span>
        </Link>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Log in to continue writing and discovering stories.
            </p>
          </div>

          <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
            {pageError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {pageError}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username ? 'username-error' : undefined
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your username"
              />
              {fieldErrors.username && (
                <p
                  id="username-error"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your password"
              />
              {fieldErrors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to WriteSpace?{' '}
            <Link
              to={ROUTES.register}
              className="rounded-sm font-semibold text-indigo-700 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create an account
            </Link>
          </p>

          <aside className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-center text-xs leading-5 text-slate-500">
            This is a local demo. Do not use a real password.
          </aside>
        </section>
      </div>
    </main>
  );
}

LoginPage.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }),
};

export default LoginPage;