import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UserRow from '../components/UserRow';
import {
  DEFAULT_ADMIN,
  ROLES,
  STORAGE_ERROR_MESSAGE,
} from '../utils/constants';
import { getUsers, saveUsers } from '../utils/storage';
import {
  isUsernameTaken,
  isValidRole,
  validateRequiredFields,
} from '../utils/validation';

const initialForm = {
  displayName: '',
  username: '',
  password: '',
  role: ROLES.user,
};

function UserManagement({ session }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState('');

  useEffect(() => {
    setUsers(getUsers());
  }, []);

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
    setSuccessMessage('');
  }

  function validateForm() {
    const errors = validateRequiredFields(form, {
      displayName: 'Display name',
      username: 'Username',
      password: 'Password',
      role: 'Role',
    });

    if (!errors.displayName && form.displayName.trim().length > 100) {
      errors.displayName = 'Display name must be 100 characters or fewer.';
    }

    if (!errors.username && form.username.trim().length > 50) {
      errors.username = 'Username must be 50 characters or fewer.';
    }

    if (!errors.role && !isValidRole(form.role)) {
      errors.role = 'Select a valid role.';
    }

    return errors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setPageError('');
    setSuccessMessage('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const latestUsers = getUsers();
      const username = form.username.trim();

      if (isUsernameTaken(username, latestUsers)) {
        setPageError('Username is already taken.');
        return;
      }

      const newUser = {
        id: crypto.randomUUID(),
        displayName: form.displayName.trim(),
        username,
        password: form.password,
        role: form.role,
        createdAt: new Date().toISOString(),
      };
      const nextUsers = [...latestUsers, newUser];

      if (!saveUsers(nextUsers)) {
        setPageError(STORAGE_ERROR_MESSAGE);
        return;
      }

      setUsers(nextUsers);
      setForm(initialForm);
      setFieldErrors({});
      setSuccessMessage('User created successfully.');
    } catch {
      setPageError(STORAGE_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDelete(userId) {
    setPageError('');
    setSuccessMessage('');

    if (
      userId === DEFAULT_ADMIN.userId ||
      userId === session.userId
    ) {
      setPageError('You cannot delete this account.');
      return;
    }

    if (!window.confirm('Delete this user?')) {
      return;
    }

    setDeletingUserId(userId);

    try {
      const latestUsers = getUsers();
      const userIndex = latestUsers.findIndex(
        (user) => user && user.id === userId,
      );

      if (userIndex < 0) {
        setUsers(latestUsers);
        setPageError('User not found.');
        return;
      }

      const userToDelete = latestUsers[userIndex];

      if (
        userToDelete.id === DEFAULT_ADMIN.userId ||
        userToDelete.username === DEFAULT_ADMIN.username ||
        userToDelete.id === session.userId
      ) {
        setPageError('You cannot delete this account.');
        return;
      }

      const nextUsers = [...latestUsers];
      nextUsers.splice(userIndex, 1);

      if (!saveUsers(nextUsers)) {
        setPageError(STORAGE_ERROR_MESSAGE);
        return;
      }

      setUsers(nextUsers);
      setSuccessMessage('User deleted successfully.');
    } catch {
      setPageError(STORAGE_ERROR_MESSAGE);
    } finally {
      setDeletingUserId('');
    }
  }

  const defaultAdmin = {
    userId: DEFAULT_ADMIN.userId,
    displayName: DEFAULT_ADMIN.displayName,
    username: DEFAULT_ADMIN.username,
    role: DEFAULT_ADMIN.role,
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            User management
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Create local demo accounts, assign roles, and manage existing
            WriteSpace users.
          </p>
        </div>

        {pageError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {pageError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        <section
          aria-labelledby="create-user-heading"
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <h2
              id="create-user-heading"
              className="text-xl font-bold text-slate-900"
            >
              Create user
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Credentials are stored only in this browser for demonstration.
            </p>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold text-slate-700"
              >
                Display name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                value={form.displayName}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={
                  fieldErrors.displayName ? 'display-name-error' : undefined
                }
                placeholder="Enter a display name"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.displayName && (
                <p
                  id="display-name-error"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {fieldErrors.displayName}
                </p>
              )}
            </div>

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
                autoComplete="off"
                value={form.username}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username ? 'username-error' : undefined
                }
                placeholder="Choose a unique username"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                placeholder="Create a demo password"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
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

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-semibold text-slate-700"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.role)}
                aria-describedby={fieldErrors.role ? 'role-error' : undefined}
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={ROLES.user}>User</option>
                <option value={ROLES.admin}>Admin</option>
              </select>
              {fieldErrors.role && (
                <p
                  id="role-error"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {fieldErrors.role}
                </p>
              )}
            </div>

            <div className="md:col-span-2 md:flex md:justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400 md:w-auto"
              >
                {isSubmitting ? 'Creating user…' : 'Create user'}
              </button>
            </div>
          </form>
        </section>

        <section
          aria-labelledby="accounts-heading"
          className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-6 py-5">
            <h2
              id="accounts-heading"
              className="text-xl font-bold text-slate-900"
            >
              Accounts
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {users.length + 1}{' '}
              {users.length + 1 === 1 ? 'account' : 'accounts'}, including the
              default Admin.
            </p>
          </div>

          <div role="table" aria-label="WriteSpace accounts">
            <div
              role="row"
              className="hidden grid-cols-[minmax(12rem,2fr)_minmax(8rem,1.5fr)_minmax(6rem,0.75fr)_minmax(8rem,1fr)_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid"
            >
              <span role="columnheader">Name</span>
              <span role="columnheader">Username</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">Created</span>
              <span role="columnheader" className="text-right">
                Actions
              </span>
            </div>

            <div
              role="rowgroup"
              className="space-y-4 bg-slate-50 p-4 md:space-y-0 md:bg-white md:p-0"
            >
              <UserRow
                user={defaultAdmin}
                currentSession={session}
                onDelete={handleDelete}
              />
              {users.map((user, index) => (
                <UserRow
                  key={`${user.id}-${index}`}
                  user={user}
                  currentSession={session}
                  onDelete={handleDelete}
                  isDeleting={deletingUserId === user.id}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

UserManagement.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default UserManagement;