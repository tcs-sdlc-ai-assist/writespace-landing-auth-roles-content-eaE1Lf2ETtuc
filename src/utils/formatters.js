const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

/**
 * Formats an ISO date string as a short, human-readable date.
 *
 * @param {string} dateValue - The date value to format.
 * @returns {string} The formatted date or a defensive fallback.
 */
export function formatDate(dateValue) {
  const timestamp = Date.parse(dateValue);

  if (Number.isNaN(timestamp)) {
    return 'Invalid date';
  }

  return dateFormatter.format(new Date(timestamp));
}

/**
 * Returns a newest-first copy of a post collection.
 *
 * @param {Array<{id?: string, createdAt?: string}>} posts - Posts to sort.
 * @returns {Array<{id?: string, createdAt?: string}>} A sorted copy.
 */
export function sortPostsNewestFirst(posts) {
  if (!Array.isArray(posts)) {
    return [];
  }

  return [...posts].sort((firstPost, secondPost) => {
    const firstTimestamp = Date.parse(firstPost?.createdAt);
    const secondTimestamp = Date.parse(secondPost?.createdAt);
    const safeFirstTimestamp = Number.isNaN(firstTimestamp)
      ? Number.NEGATIVE_INFINITY
      : firstTimestamp;
    const safeSecondTimestamp = Number.isNaN(secondTimestamp)
      ? Number.NEGATIVE_INFINITY
      : secondTimestamp;

    if (safeFirstTimestamp !== safeSecondTimestamp) {
      return safeSecondTimestamp - safeFirstTimestamp;
    }

    return String(firstPost?.id ?? '').localeCompare(
      String(secondPost?.id ?? ''),
    );
  });
}

/**
 * Creates a post excerpt limited to 120 content characters.
 *
 * @param {string} content - Post content.
 * @returns {string} The excerpt, with an ellipsis when truncated.
 */
export function getExcerpt(content) {
  if (typeof content !== 'string') {
    return '';
  }

  return content.length > 120 ? `${content.slice(0, 120)}…` : content;
}

/**
 * Derives a four-digit year from a date.
 *
 * @param {Date} [date=new Date()] - Date used to derive the year.
 * @returns {number} The current year, or the system year for an invalid date.
 */
export function getCurrentYear(date = new Date()) {
  const year = date instanceof Date ? date.getFullYear() : Number.NaN;

  return Number.isNaN(year) ? new Date().getFullYear() : year;
}