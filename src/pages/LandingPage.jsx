import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import PublicNavbar from '../components/PublicNavbar';
import { homeForSession } from '../utils/auth';
import { ROUTES } from '../utils/constants';
import {
  getCurrentYear,
  sortPostsNewestFirst,
} from '../utils/formatters';
import { getPosts } from '../utils/storage';

const features = [
  {
    icon: '✍️',
    title: 'Write with focus',
    description:
      'Create and edit thoughtful posts in a simple workspace designed to keep your ideas at the center.',
    accent: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: '📚',
    title: 'Discover stories',
    description:
      'Browse the newest writing from the community and enjoy every post in a clean reading view.',
    accent: 'bg-violet-100 text-violet-700',
  },
  {
    icon: '✨',
    title: 'Manage with ease',
    description:
      'Keep your work organized with ownership-aware controls and a clear, responsive dashboard.',
    accent: 'bg-pink-100 text-pink-700',
  },
];

function LandingPage({ session = null }) {
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    setLatestPosts(sortPostsNewestFirst(getPosts()).slice(0, 3));
  }, []);

  const primaryDestination = session
    ? homeForSession(session)
    : ROUTES.register;
  const primaryLabel = session ? 'Go to Dashboard' : 'Start Writing';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar session={session} />

      <main>
        <section className="overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-100">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div className="text-center lg:text-left">
              <span className="inline-flex rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700">
                Your ideas deserve space
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Write freely.
                <span className="block text-indigo-600">Share thoughtfully.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 lg:mx-0">
                WriteSpace is a welcoming place to shape your ideas, publish
                your stories, and discover thoughtful writing from others.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to={primaryDestination}
                  className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {primaryLabel}
                </Link>
                <a
                  href="#latest-posts"
                  className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center text-base font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Explore Stories
                </a>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="relative mx-auto h-80 w-full max-w-lg"
            >
              <div className="absolute left-4 top-8 w-64 animate-bounce rounded-2xl border border-indigo-100 bg-white p-5 shadow-xl motion-reduce:animate-none sm:left-10">
                <div className="h-3 w-20 rounded-full bg-indigo-200" />
                <div className="mt-4 h-5 w-44 rounded-full bg-slate-800" />
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-full rounded-full bg-slate-200" />
                  <div className="h-2.5 w-5/6 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-3/5 rounded-full bg-slate-200" />
                </div>
              </div>

              <div className="absolute bottom-5 right-3 w-64 animate-pulse rounded-2xl border border-violet-100 bg-white p-5 shadow-xl motion-reduce:animate-none sm:right-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-500" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 rounded-full bg-slate-700" />
                    <div className="h-2 w-16 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="mt-5 h-5 w-40 rounded-full bg-slate-800" />
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-full rounded-full bg-slate-200" />
                  <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
                </div>
              </div>

              <div className="absolute right-8 top-2 flex h-14 w-14 animate-bounce items-center justify-center rounded-2xl bg-pink-500 text-2xl text-white shadow-lg motion-reduce:animate-none sm:right-16">
                ✦
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Made for storytellers
            </p>
            <h2
              id="features-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Everything you need to share your voice
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${feature.accent}`}
                >
                  {feature.icon}
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="latest-posts"
          aria-labelledby="latest-posts-heading"
          className="border-y border-slate-200 bg-white"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Fresh from WriteSpace
                </p>
                <h2
                  id="latest-posts-heading"
                  className="mt-2 text-3xl font-bold tracking-tight text-slate-900"
                >
                  Latest posts
                </h2>
              </div>
              {latestPosts.length > 0 && (
                <Link
                  to={session ? ROUTES.blogs : ROUTES.login}
                  className="self-start rounded-lg text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:self-auto"
                >
                  View all posts →
                </Link>
              )}
            </div>

            {latestPosts.length > 0 ? (
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post, index) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    index={index}
                    session={session}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <span aria-hidden="true" className="text-4xl">
                  📝
                </span>
                <p className="mt-4 text-lg font-semibold text-slate-700">
                  No posts yet.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-indigo-600">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-16">
            <h2 className="text-3xl font-bold text-white">
              Make room for your next great idea.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
              Join WriteSpace and turn your thoughts into stories worth sharing.
            </p>
            <Link
              to={primaryDestination}
              className="mt-7 inline-flex rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              {primaryLabel}
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <Link
            to={ROUTES.landing}
            className="rounded-md text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            WriteSpace
          </Link>
          <p className="text-sm">
            © {getCurrentYear()} WriteSpace. A space for every story.
          </p>
        </div>
      </footer>
    </div>
  );
}

LandingPage.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }),
};

export default LandingPage;