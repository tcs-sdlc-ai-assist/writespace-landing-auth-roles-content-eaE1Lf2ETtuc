import PropTypes from 'prop-types';
import { DEFAULT_ADMIN, ROLES } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import Avatar from './Avatar';

const ROLE_BADGE_CLASSES = {
  [ROLES.admin]: 'bg-violet-100 text-violet-700',
  [ROLES.user]: 'bg-indigo-100 text-indigo-700',
};

function UserRow({
  user,
  currentSession = null,
  onDelete,
  isDeleting = false,
}) {
  const userId = user.id ?? user.userId;
  const isDefaultAdmin =
    userId === DEFAULT_ADMIN.userId &&
    user.username === DEFAULT_ADMIN.username;
  const isCurrentUser = currentSession?.userId === userId;
  const deleteDisabled = isDefaultAdmin || isCurrentUser || isDeleting;
  const deleteReason = isDefaultAdmin
    ? 'The default Admin cannot be deleted.'
    : isCurrentUser
      ? 'You cannot delete your own account.'
      : '';
  const roleClass =
    ROLE_BADGE_CLASSES[user.role] ?? ROLE_BADGE_CLASSES[ROLES.user];

  function handleDelete() {
    if (!deleteDisabled) {
      onDelete(userId);
    }
  }

  return (
    <article
      role="row"
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(12rem,2fr)_minmax(8rem,1.5fr)_minmax(6rem,0.75fr)_minmax(8rem,1fr)_auto] md:items-center md:rounded-none md:border-x-0 md:border-t-0 md:p-4 md:shadow-none"
    >
      <div role="cell" className="flex min-w-0 items-center gap-3">
        <Avatar role={user.role} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {user.displayName}
          </p>
          <p className="truncate text-sm text-slate-500 md:hidden">
            @{user.username}
          </p>
        </div>
      </div>

      <div role="cell" className="hidden min-w-0 md:block">
        <span className="truncate text-sm text-slate-600">
          @{user.username}
        </span>
      </div>

      <div role="cell" className="flex items-center justify-between md:block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
          Role
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleClass}`}
        >
          {user.role}
        </span>
      </div>

      <div role="cell" className="flex items-center justify-between md:block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
          Created
        </span>
        {user.createdAt ? (
          <time
            dateTime={user.createdAt}
            className="text-sm text-slate-600"
          >
            {formatDate(user.createdAt)}
          </time>
        ) : (
          <span className="text-sm text-slate-500">Default account</span>
        )}
      </div>

      <div role="cell" className="flex flex-col items-stretch md:items-end">
        <button
          type="button"
          disabled={deleteDisabled}
          aria-label={`Delete ${user.displayName}`}
          title={deleteReason || `Delete ${user.displayName}`}
          onClick={handleDelete}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
        {deleteReason && (
          <span className="mt-1 text-xs text-slate-500">{deleteReason}</span>
        )}
      </div>
    </article>
  );
}

UserRow.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    userId: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
  }).isRequired,
  currentSession: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }),
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
};

export default UserRow;