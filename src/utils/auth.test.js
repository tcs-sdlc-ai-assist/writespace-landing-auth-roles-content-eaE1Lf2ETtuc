import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_CHANGE_EVENT,
  authenticate,
  canModifyPost,
  clearSession,
  getSession,
  homeForSession,
  isAdmin,
  setSession,
} from './auth';
import { ROLES, ROUTES, STORAGE_KEYS } from './constants';

const adminSession = {
  userId: 'admin',
  username: 'admin',
  displayName: 'Admin',
  role: ROLES.admin,
};

const userSession = {
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  role: ROLES.user,
};

const post = {
  id: 'post-1',
  title: 'First post',
  content: 'Hello world',
  createdAt: '2026-08-22T10:05:00.000Z',
  authorId: 'user-1',
  authorName: 'Alice',
};

describe('auth', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('session persistence', () => {
    it('persists and reads a valid session using the exact session key', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      expect(setSession(userSession)).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEYS.session,
        JSON.stringify(userSession),
      );
      expect(getSession()).toEqual(userSession);
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEYS.session);
    });

    it('emits a same-tab session-change event after saving a session', () => {
      const listener = vi.fn();
      window.addEventListener(SESSION_CHANGE_EVENT, listener);

      expect(setSession(userSession)).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener(SESSION_CHANGE_EVENT, listener);
    });

    it.each([
      ['null', null],
      ['an array', []],
      ['a missing user ID', { ...userSession, userId: '' }],
      ['a missing username', { ...userSession, username: '' }],
      ['a missing display name', { ...userSession, displayName: '' }],
      ['an unknown role', { ...userSession, role: 'editor' }],
    ])('rejects %s as an invalid session', (_, invalidSession) => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      expect(setSession(invalidSession)).toBe(false);
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('returns null when no session has been stored', () => {
      expect(getSession()).toBeNull();
    });

    it('returns null when the stored session contains malformed JSON', () => {
      window.localStorage.setItem(STORAGE_KEYS.session, '{invalid-json');

      expect(getSession()).toBeNull();
    });

    it('returns null when the stored session has an invalid shape', () => {
      window.localStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify({ ...userSession, role: 'editor' }),
      );

      expect(getSession()).toBeNull();
    });

    it('returns null when session storage cannot be read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Storage unavailable', 'SecurityError');
      });

      expect(getSession()).toBeNull();
    });

    it('returns false and does not signal when a session write fails', () => {
      const listener = vi.fn();
      window.addEventListener(SESSION_CHANGE_EVENT, listener);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      expect(setSession(userSession)).toBe(false);
      expect(listener).not.toHaveBeenCalled();

      window.removeEventListener(SESSION_CHANGE_EVENT, listener);
    });

    it('clears a stored session and emits a session-change event', () => {
      window.localStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify(userSession),
      );
      const listener = vi.fn();
      window.addEventListener(SESSION_CHANGE_EVENT, listener);

      expect(clearSession()).toBe(true);
      expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener(SESSION_CHANGE_EVENT, listener);
    });

    it('returns false and does not signal when clearing storage fails', () => {
      const listener = vi.fn();
      window.addEventListener(SESSION_CHANGE_EVENT, listener);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('Storage unavailable', 'SecurityError');
      });

      expect(clearSession()).toBe(false);
      expect(listener).not.toHaveBeenCalled();

      window.removeEventListener(SESSION_CHANGE_EVENT, listener);
    });
  });

  describe('authentication', () => {
    it('authenticates the immutable default Admin credentials', () => {
      expect(authenticate('admin', 'admin')).toEqual(adminSession);
    });

    it('gives default Admin credentials precedence over stored users', () => {
      window.localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify([
          {
            id: 'stored-admin',
            username: 'admin',
            displayName: 'Imposter',
            password: 'admin',
            role: ROLES.user,
          },
        ]),
      );

      expect(authenticate('admin', 'admin')).toEqual(adminSession);
    });

    it('authenticates an exact stored user credential pair', () => {
      window.localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify([
          {
            id: 'user-1',
            username: 'alice',
            displayName: 'Alice',
            password: 'demo-only',
            role: ROLES.user,
            createdAt: '2026-08-22T10:00:00.000Z',
          },
        ]),
      );

      expect(authenticate('alice', 'demo-only')).toEqual(userSession);
    });

    it.each([
      ['alice', 'wrong-password'],
      ['Alice', 'demo-only'],
      ['', ''],
      [null, 'demo-only'],
    ])(
      'rejects invalid or non-exact credentials for username %s',
      (username, password) => {
        window.localStorage.setItem(
          STORAGE_KEYS.users,
          JSON.stringify([
            {
              id: 'user-1',
              username: 'alice',
              displayName: 'Alice',
              password: 'demo-only',
              role: ROLES.user,
            },
          ]),
        );

        expect(authenticate(username, password)).toBeNull();
      },
    );

    it('rejects a stored account that cannot produce a valid session', () => {
      window.localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify([
          {
            id: '',
            username: 'alice',
            displayName: 'Alice',
            password: 'demo-only',
            role: ROLES.user,
          },
        ]),
      );

      expect(authenticate('alice', 'demo-only')).toBeNull();
    });
  });

  describe('authorization policy', () => {
    it('allows an Admin to modify any post', () => {
      expect(canModifyPost(adminSession, post)).toBe(true);
      expect(
        canModifyPost(adminSession, { ...post, authorId: 'another-user' }),
      ).toBe(true);
    });

    it('allows a user to modify a post they own', () => {
      expect(canModifyPost(userSession, post)).toBe(true);
    });

    it('rejects another user, an invalid role, or a missing post', () => {
      expect(
        canModifyPost(
          { ...userSession, userId: 'user-2' },
          post,
        ),
      ).toBe(false);
      expect(
        canModifyPost(
          { ...userSession, role: 'editor' },
          post,
        ),
      ).toBe(false);
      expect(canModifyPost(userSession, null)).toBe(false);
      expect(canModifyPost(null, post)).toBe(false);
    });

    it('recognizes only valid Admin sessions as Admin', () => {
      expect(isAdmin(adminSession)).toBe(true);
      expect(isAdmin(userSession)).toBe(false);
      expect(isAdmin({ ...adminSession, role: 'owner' })).toBe(false);
      expect(isAdmin(null)).toBe(false);
    });

    it('selects the role-specific home route with login as the safe fallback', () => {
      expect(homeForSession(adminSession)).toBe(ROUTES.admin);
      expect(homeForSession(userSession)).toBe(ROUTES.blogs);
      expect(homeForSession(null)).toBe(ROUTES.login);
      expect(homeForSession({ ...userSession, role: 'editor' })).toBe(
        ROUTES.login,
      );
    });
  });
});