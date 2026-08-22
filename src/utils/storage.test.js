import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from './constants';
import { getPosts, getUsers, savePosts, saveUsers } from './storage';

const post = {
  id: 'post-1',
  title: 'First post',
  content: 'Hello world',
  createdAt: '2026-08-22T10:05:00.000Z',
  authorId: 'user-1',
  authorName: 'Alice',
};

const user = {
  id: 'user-1',
  displayName: 'Alice',
  username: 'alice',
  password: 'demo-only',
  role: 'user',
  createdAt: '2026-08-22T10:00:00.000Z',
};

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('post persistence', () => {
    it('writes and reads posts using the exact posts storage key', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      expect(savePosts([post])).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEYS.posts,
        JSON.stringify([post]),
      );
      expect(getPosts()).toEqual([post]);
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEYS.posts);
    });

    it('returns an empty array when stored post JSON is malformed', () => {
      window.localStorage.setItem(STORAGE_KEYS.posts, '{invalid-json');

      expect(getPosts()).toEqual([]);
    });

    it.each([
      ['a JSON object', JSON.stringify({ post })],
      ['JSON null', 'null'],
      ['a JSON string', JSON.stringify('post')],
    ])('returns an empty array when posts contain %s', (_, storedValue) => {
      window.localStorage.setItem(STORAGE_KEYS.posts, storedValue);

      expect(getPosts()).toEqual([]);
    });

    it('returns an empty array when post storage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Storage unavailable', 'SecurityError');
      });

      expect(getPosts()).toEqual([]);
    });

    it('rejects non-array post values without writing storage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      expect(savePosts({ post })).toBe(false);
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('returns false when post serialization fails', () => {
      const circularPosts = [];
      circularPosts.push(circularPosts);

      expect(savePosts(circularPosts)).toBe(false);
      expect(window.localStorage.getItem(STORAGE_KEYS.posts)).toBeNull();
    });

    it('returns false when a post write exceeds storage availability', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      expect(savePosts([post])).toBe(false);
    });
  });

  describe('user persistence', () => {
    it('writes and reads users using the exact users storage key', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      expect(saveUsers([user])).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEYS.users,
        JSON.stringify([user]),
      );
      expect(getUsers()).toEqual([user]);
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEYS.users);
    });

    it('returns an empty array when no users have been stored', () => {
      expect(getUsers()).toEqual([]);
    });

    it('returns an empty array when stored user JSON is malformed', () => {
      window.localStorage.setItem(STORAGE_KEYS.users, '[invalid-json');

      expect(getUsers()).toEqual([]);
    });

    it('returns an empty array when the stored user value is not an array', () => {
      window.localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify({ users: [user] }),
      );

      expect(getUsers()).toEqual([]);
    });

    it('rejects non-array user values without writing storage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      expect(saveUsers(null)).toBe(false);
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('returns false when user serialization fails', () => {
      const circularUsers = [];
      circularUsers.push(circularUsers);

      expect(saveUsers(circularUsers)).toBe(false);
    });

    it('returns false when a user write throws an error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Storage unavailable', 'SecurityError');
      });

      expect(saveUsers([user])).toBe(false);
    });
  });
});