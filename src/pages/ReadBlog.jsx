import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { canModifyPost } from '../utils/auth';
import {
  DEFAULT_ADMIN,
  ROLES,
  ROUTES,
  STORAGE_ERROR_MESSAGE,
} from '../utils/constants';
import { formatDate } from '../utils/formatters';
import { getPosts, savePosts } from '../utils/storage';

function ReadBlog({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pageError, setPageError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const matchingPost = getPosts().find(
      (candidate) => candidate && candidate.id === id,
    );

    setPost(matchingPost ?? null);
    setIsLoaded(true);
  }, [id]);

  function handleDelete() {
    setPageError('');

    if (!post || !canModifyPost(session, post)) {
      navigate(ROUTES.blogs, { replace: true });
      return;
    }

    if (!window.confirm('Delete this post?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const latestPosts = getPosts();
      const postIndex = latestPosts.findIndex(
        (candidate) => candidate && candidate.id === id,
      );

      if (postIndex < 0) {
        setPost(null);
        return;
      }

      const latestPost = latestPosts[postIndex];

      if (!canModifyPost(session, latestPost)) {
        navigate(ROUTES.blogs, { replace: true });
        return;
      }

      const nextPosts = [...latestPosts];
      nextPosts.splice(postIndex, 1);

      if (!savePosts(nextPosts)) {
        setPageError(STORAGE_ERROR_MESSAGE);
        return;
      }

      navigate(ROUTES.blogs, { replace: true });
    } catch {
      setPageError(STORAGE_ERROR_MESSAGE);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
        <div
          role="status"
          className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-600 sm:px-6 lg:px-8"
        >
          Loading post…
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 shadow-sm">
            <span aria-hidden="true" className="text-5xl">
              📄
            </span>
            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              Post not found
            </h1>
            <p className="mt-3 text-slate-600">
              This post may have been removed or the link may be incorrect.
            </p>
            <Link
              to={ROUTES.blogs}
              className="mt-7 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Back to blogs
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const canModify = canModifyPost(session, post);
  const authorRole =
    post.authorId === DEFAULT_ADMIN.userId ? ROLES.admin : ROLES.user;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          to={ROUTES.blogs}
          className="inline-flex rounded-md text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          ← Back to blogs
        </Link>

        <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                  WriteSpace story
                </p>
                <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {post.title}
                </h1>
              </div>

              {canModify && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    to={`/edit/${encodeURIComponent(post.id)}`}
                    className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Edit post
                  </Link>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete post'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <Avatar role={authorRole} size="md" />
              <div>
                <p className="font-semibold text-slate-800">
                  {post.authorName}
                </p>
                <time
                  dateTime={post.createdAt}
                  className="text-sm text-slate-500"
                >
                  {formatDate(post.createdAt)}
                </time>
              </div>
            </div>

            {pageError && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {pageError}
              </div>
            )}
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <p className="whitespace-pre-wrap break-words text-base leading-8 text-slate-700 sm:text-lg">
              {post.content}
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

ReadBlog.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default ReadBlog;