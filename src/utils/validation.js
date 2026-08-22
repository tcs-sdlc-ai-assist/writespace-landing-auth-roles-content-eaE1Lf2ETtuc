import { DEFAULT_ADMIN, ROLES } from './constants';

/**
 * Checks whether a value is a non-empty string after trimming.
 *
 * @param {unknown} value - Value to inspect.
 * @returns {boolean} Whether the value is a non-empty string.
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks whether a value is a supported role.
 *
 * @param {unknown} role - Role to inspect.
 * @returns {boolean} Whether the role is supported.
 */
export function isValidRole(role) {
  return role === ROLES.admin || role === ROLES.user;
}

/**
 * Checks whether a value is a valid ISO-8601 date string.
 *
 * @param {unknown} value - Date value to inspect.
 * @returns {boolean} Whether the value is a parseable date string.
 */
export function isValidDateString(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

/**
 * Performs broad structural validation of a post record.
 *
 * @param {unknown} value - Potential post record.
 * @returns {boolean} Whether the value has the required post shape.
 */
export function isPostRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    value.title.trim().length <= 200 &&
    isNonEmptyString(value.content) &&
    isValidDateString(value.createdAt) &&
    isNonEmptyString(value.authorId) &&
    isNonEmptyString(value.authorName) &&
    value.authorName.trim().length <= 100
  );
}

/**
 * Performs broad structural validation of a stored user record.
 *
 * @param {unknown} value - Potential user record.
 * @returns {boolean} Whether the value has the required user shape.
 */
export function isUserRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.displayName) &&
    value.displayName.trim().length <= 100 &&
    isNonEmptyString(value.username) &&
    value.username.trim().length <= 50 &&
    value.username !== DEFAULT_ADMIN.username &&
    isNonEmptyString(value.password) &&
    isValidRole(value.role) &&
    isValidDateString(value.createdAt)
  );
}

/**
 * Performs broad structural validation of a session record.
 *
 * @param {unknown} value - Potential session record.
 * @returns {boolean} Whether the value has the required session shape.
 */
export function isSessionRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.userId) &&
    isNonEmptyString(value.username) &&
    isNonEmptyString(value.displayName) &&
    isValidRole(value.role)
  );
}

/**
 * Produces field-level errors for missing form values.
 *
 * @param {Record<string, unknown>} values - Form values keyed by field name.
 * @param {Record<string, string>} fieldLabels - Labels keyed by field name.
 * @returns {Record<string, string>} Errors keyed by missing field name.
 */
export function validateRequiredFields(values, fieldLabels) {
  const safeValues =
    values && typeof values === 'object' && !Array.isArray(values) ? values : {};
  const safeLabels =
    fieldLabels && typeof fieldLabels === 'object' && !Array.isArray(fieldLabels)
      ? fieldLabels
      : {};

  return Object.entries(safeLabels).reduce((errors, [fieldName, label]) => {
    const value = safeValues[fieldName];
    const isMissing =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim().length === 0);

    if (isMissing) {
      errors[fieldName] = `${label} is required.`;
    }

    return errors;
  }, {});
}

/**
 * Checks exact, case-sensitive username uniqueness, including the default Admin.
 *
 * @param {unknown} username - Username to inspect.
 * @param {unknown} users - Stored user collection.
 * @returns {boolean} Whether the username is already reserved or stored.
 */
export function isUsernameTaken(username, users) {
  if (typeof username !== 'string') {
    return false;
  }

  if (username === DEFAULT_ADMIN.username) {
    return true;
  }

  if (!Array.isArray(users)) {
    return false;
  }

  return users.some(
    (user) =>
      user &&
      typeof user === 'object' &&
      !Array.isArray(user) &&
      user.username === username,
  );
}