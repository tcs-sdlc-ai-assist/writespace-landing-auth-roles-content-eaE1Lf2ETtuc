import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { canModifyPost } from '../utils/auth';
import {
  BLOG_ACCENT_CLASSES,
  DEFAULT_ADMIN,
  ROLES,
} from '../utils/constants';
import { formatDate, getExcerpt } from '../utils/formatters';
import Avatar from './Avatar';

function BlogCard({ post, index = 0, session = null }) {
  const accentIndex =
    ((index % BLOG_ACCENT_CLASSES.length) + BLOG_ACCENT_CLASSES.length) %
    BLOG_ACCENT_CLASSES.length;
  const accentClass = BLOG_ACCENT_CLASSES[accentIndex];
  const postPath = `/blog/${encodeURIComponent(post.id)}`;
  const editPath = `/edit/${encodeURIComponent(post.id)}`;
  const authorRole =
    post.authorId === DEFAULT_ADMIN.userId ? ROLES.admin : ROLES.user;
  const canEdit = canModifyPost(session, post);

  return (
    <article
      className={`relative flex h-full flex-col rounded-xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${accentClass}`}
    >
      <Link
        to={postPath}
        aria-label={`Read ${post.title}`}
        className="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      />

      <div className="pointer-events-none relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="break-words text-xl font-bold leading-snug text-slate-900">
            {post.title}
          </h2>
          {canEdit && (
            <Link
              to={editPath}
              className="pointer-events-auto relative z-10 shrink-0 rounded-md px-2.5 py-1.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={`Edit ${post.title}`}
            >
              Edit
            </Link>
          )}
        </div>

        <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
          {getExcerpt(post.content)}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar role={authorRole} size="sm" />
            <span className="truncate text-sm font-medium text-slate-700">
              {post.authorName}
            </span>
          </div>
          <time
            dateTime={post.createdAt}
            className="shrink-0 text-xs text-slate-500"
          >
            {formatDate(post.createdAt)}
          </time>
        </div>
      </div>
    </article>
  );
}

BlogCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    authorId: PropTypes.string.isRequired,
    authorName: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number,
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }),
};

export default BlogCard;