import { STORAGE_KEYS } from './constants';

/**
 * Safely reads and parses an array from localStorage.
 *
 * @param {string} key - Storage key to read.
 * @returns {Array<unknown>} The parsed array or an empty array on failure.
 */
function readArray(key) {
  try {
    const serializedValue = window.localStorage.getItem(key);

    if (serializedValue === null) {
      return [];
    }

    const parsedValue = JSON.parse(serializedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

/**
 * Safely serializes and writes an array to localStorage.
 *
 * @param {string} key - Storage key to write.
 * @param {unknown} values - Array value to persist.
 * @returns {boolean} Whether the write succeeded.
 */
function writeArray(key, values) {
  try {
    if (!Array.isArray(values)) {
      return false;
    }

    const serializedValue = JSON.stringify(values);
    window.localStorage.setItem(key, serializedValue);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads all stored posts.
 *
 * @returns {Array<object>} Stored posts or an empty array on failure.
 */
export function getPosts() {
  return readArray(STORAGE_KEYS.posts);
}

/**
 * Persists the complete post collection.
 *
 * @param {Array<object>} posts - Posts to persist.
 * @returns {boolean} Whether the write succeeded.
 */
export function savePosts(posts) {
  return writeArray(STORAGE_KEYS.posts, posts);
}

/**
 * Reads all stored users.
 *
 * @returns {Array<object>} Stored users or an empty array on failure.
 */
export function getUsers() {
  return readArray(STORAGE_KEYS.users);
}

/**
 * Persists the complete user collection.
 *
 * @param {Array<object>} users - Users to persist.
 * @returns {boolean} Whether the write succeeded.
 */
export function saveUsers(users) {
  return writeArray(STORAGE_KEYS.users, users);
}