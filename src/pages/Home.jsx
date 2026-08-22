import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import { ROUTES } from '../utils/constants';
import { sortPostsNewestFirst } from '../utils/formatters';
import { getPosts } from '../utils/storage';

function Home({ session }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    setPosts(sortPostsNewestFirst(getPosts()));
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              WriteSpace stories
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Latest posts
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Discover the newest ideas and stories from the WriteSpace
              community.
            </p>
          </div>

          <Link
            to={ROUTES.write}
            className="inline-flex self-start items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:self-auto"
          >
            Write a post
          </Link>
        </div>

        {posts.length > 0 ? (
          <section
            aria-label="Blog posts"
            className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {posts.map((post, index) => (
              <BlogCard
                key={post.id}
                post={post}
                index={index}
                session={session}
              />
            ))}
          </section>
        ) : (
          <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <span aria-hidden="true" className="text-5xl">
              📝
            </span>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              No posts yet.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-slate-600">
              Be the first to share an idea, a lesson, or a story with the
              WriteSpace community.
            </p>
            <Link
              to={ROUTES.write}
              className="mt-7 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Write your first post
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

Home.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default Home;