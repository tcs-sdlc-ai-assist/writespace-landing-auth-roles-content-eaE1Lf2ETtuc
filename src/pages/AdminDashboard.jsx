import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { isAdmin } from '../utils/auth';
import {
  DEFAULT_ADMIN,
  ROLES,
  ROUTES,
  STORAGE_ERROR_MESSAGE,
} from '../utils/constants';
import { formatDate, sortPostsNewestFirst } from '../utils/formatters';
import { getPosts, getUsers, savePosts } from '../utils/storage';

function AdminDashboard({ session }) {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageError, setPageError] = useState('');
  const [deletingPostId, setDeletingPostId] = useState('');

  useEffect(() => {
    setPosts(sortPostsNewestFirst(getPosts()));
    setUsers(getUsers());
  }, []);

  const recentPosts = posts.slice(0, 5);
  const storedAdminCount = users.filter(
    (user) => user && user.role === ROLES.admin,
  ).length;
  const regularUserCount = users.filter(
    (user) => user && user.role === ROLES.user,
  ).length;

  const statistics = [
    {
      label: 'Total Posts',
      value: posts.length,
      icon: '📝',
      accent: 'indigo',
    },
    {
      label: 'Total Users',
      value: users.length + 1,
      icon: '👥',
      accent: 'violet',
    },
    {
      label: 'Admin Users',
      value: storedAdminCount + 1,
      icon: '👑',
      accent: 'pink',
    },
    {
      label: 'Regular Users',
      value: regularUserCount,
      icon: '📚',
      accent: 'teal',
    },
  ];

  function handleDelete(postId) {
    setPageError('');

    if (!isAdmin(session)) {
      setPageError('You are not authorized to delete this post.');
      return;
    }

    if (!window.confirm('Delete this post?')) {
      return;
    }

    setDeletingPostId(postId);

    try {
      const latestPosts = getPosts();
      const postIndex = latestPosts.findIndex(
        (post) => post && post.id === postId,
      );

      if (postIndex < 0) {
        setPosts(sortPostsNewestFirst(latestPosts));
        setPageError('Post not found');
        return;
      }

      const nextPosts = [...latestPosts];
      nextPosts.splice(postIndex, 1);

      if (!savePosts(nextPosts)) {
        setPageError(STORAGE_ERROR_MESSAGE);
        return;
      }

      setPosts(sortPostsNewestFirst(nextPosts));
    } catch {
      setPageError(STORAGE_ERROR_MESSAGE);
    } finally {
      setDeletingPostId('');
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-100">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {session.displayName}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-indigo-100">
            Review WriteSpace activity, manage accounts, and keep recent
            stories organized from one place.
          </p>
        </section>

        {pageError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {pageError}
          </div>
        )}

        <section
          aria-label="Admin statistics"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statistics.map((statistic) => (
            <StatCard
              key={statistic.label}
              label={statistic.label}
              value={statistic.value}
              icon={statistic.icon}
              accent={statistic.accent}
            />
          ))}
        </section>

        <section
          aria-labelledby="quick-actions-heading"
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2
            id="quick-actions-heading"
            className="text-xl font-bold text-slate-900"
          >
            Quick actions
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to={ROUTES.write}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span aria-hidden="true" className="mr-2">
                ✍️
              </span>
              Write a post
            </Link>
            <Link
              to={ROUTES.users}
              className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <span aria-hidden="true" className="mr-2">
                👥
              </span>
              Manage users
            </Link>
            <Link
              to={ROUTES.blogs}
              className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 font-semibold text-teal-700 transition-colors hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:col-span-2 lg:col-span-1"
            >
              <span aria-hidden="true" className="mr-2">
                📚
              </span>
              View all posts
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="recent-posts-heading"
          className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2
                id="recent-posts-heading"
                className="text-xl font-bold text-slate-900"
              >
                Recent posts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The five newest stories on WriteSpace.
              </p>
            </div>
            <Link
              to={ROUTES.blogs}
              className="self-start rounded-md text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:self-auto"
            >
              View all →
            </Link>
          </div>

          {recentPosts.length > 0 ? (
            <ul className="divide-y divide-slate-200">
              {recentPosts.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/blog/${encodeURIComponent(post.id)}`}
                      className="block truncate rounded-sm font-semibold text-slate-900 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      By {post.authorName || DEFAULT_ADMIN.displayName}
                      <span aria-hidden="true"> · </span>
                      <time dateTime={post.createdAt}>
                        {formatDate(post.createdAt)}
                      </time>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      to={`/edit/${encodeURIComponent(post.id)}`}
                      aria-label={`Edit ${post.title}`}
                      className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete ${post.title}`}
                      disabled={deletingPostId === post.id}
                      onClick={() => handleDelete(post.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {deletingPostId === post.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-14 text-center">
              <span aria-hidden="true" className="text-4xl">
                📝
              </span>
              <p className="mt-4 font-semibold text-slate-700">
                No posts yet.
              </p>
              <Link
                to={ROUTES.write}
                className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Write the first post
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

AdminDashboard.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default AdminDashboard;