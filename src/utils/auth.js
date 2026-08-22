import { DEFAULT_ADMIN, ROLES, ROUTES, STORAGE_KEYS } from './constants';
import { getUsers } from './storage';
import { isSessionRecord } from './validation';

export const SESSION_CHANGE_EVENT = 'writespace:session-change';

/**
 * Notifies the application shell that the session changed in the current tab.
 *
 * @returns {void}
 */
function dispatchSessionChange() {
  try {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  } catch {
    // Session persistence remains successful if event dispatch is unavailable.
  }
}

/**
 * Projects an account into the public session shape.
 *
 * @param {{id?: string, userId?: string, username: string, displayName: string, role: string}} account - Account to project.
 * @returns {{userId: string, username: string, displayName: string, role: string}} Session data.
 */
function createSession(account) {
  return {
    userId: account.userId ?? account.id,
    username: account.username,
    displayName: account.displayName,
    role: account.role,
  };
}

/**
 * Reads and validates the current browser session.
 *
 * @returns {{userId: string, username: string, displayName: string, role: string} | null} The current session or null.
 */
export function getSession() {
  try {
    const serializedSession = window.localStorage.getItem(STORAGE_KEYS.session);

    if (serializedSession === null) {
      return null;
    }

    const session = JSON.parse(serializedSession);
    return isSessionRecord(session) ? session : null;
  } catch {
    return null;
  }
}

/**
 * Validates and persists a browser session.
 *
 * @param {unknown} session - Session value to persist.
 * @returns {boolean} Whether the session was saved.
 */
export function setSession(session) {
  try {
    if (!isSessionRecord(session)) {
      return false;
    }

    window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } catch {
    return false;
  }

  dispatchSessionChange();
  return true;
}

/**
 * Removes the current browser session.
 *
 * @returns {boolean} Whether the session was removed.
 */
export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    return false;
  }

  dispatchSessionChange();
  return true;
}

/**
 * Authenticates the default Admin or an exact stored-user credential pair.
 *
 * @param {unknown} username - Submitted username.
 * @param {unknown} password - Submitted password.
 * @returns {{userId: string, username: string, displayName: string, role: string} | null} A session projection or null.
 */
export function authenticate(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return null;
  }

  if (
    username === DEFAULT_ADMIN.username &&
    password === DEFAULT_ADMIN.password
  ) {
    return createSession(DEFAULT_ADMIN);
  }

  const user = getUsers().find(
    (candidate) =>
      candidate &&
      typeof candidate === 'object' &&
      !Array.isArray(candidate) &&
      candidate.username === username &&
      candidate.password === password,
  );

  if (!user || !isSessionRecord(createSession(user))) {
    return null;
  }

  return createSession(user);
}

/**
 * Determines whether a session may edit or delete a post.
 *
 * @param {unknown} session - Current session.
 * @param {unknown} post - Post being modified.
 * @returns {boolean} Whether modification is allowed.
 */
export function canModifyPost(session, post) {
  if (
    !isSessionRecord(session) ||
    !post ||
    typeof post !== 'object' ||
    Array.isArray(post)
  ) {
    return false;
  }

  if (session.role === ROLES.admin) {
    return true;
  }

  return (
    session.role === ROLES.user &&
    typeof post.authorId === 'string' &&
    session.userId === post.authorId
  );
}

/**
 * Returns the appropriate landing route for a session.
 *
 * @param {unknown} session - Current session.
 * @returns {'/admin' | '/blogs' | '/login'} The role-appropriate route.
 */
export function homeForSession(session) {
  if (!isSessionRecord(session)) {
    return ROUTES.login;
  }

  return session.role === ROLES.admin ? ROUTES.admin : ROUTES.blogs;
}

/**
 * Determines whether a session has Admin privileges.
 *
 * @param {unknown} session - Current session.
 * @returns {boolean} Whether the session belongs to an Admin.
 */
export function isAdmin(session) {
  return isSessionRecord(session) && session.role === ROLES.admin;
}