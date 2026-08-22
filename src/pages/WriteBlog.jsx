import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { canModifyPost } from '../utils/auth';
import { ROUTES, STORAGE_ERROR_MESSAGE } from '../utils/constants';
import { getPosts, savePosts } from '../utils/storage';

const initialForm = {
  title: '',
  content: '',
};

function WriteBlog({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = typeof id === 'string';
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pageError, setPageError] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setForm(initialForm);
      setFieldErrors({});
      setPageError('');
      setIsNotFound(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsNotFound(false);
    setPageError('');

    try {
      const post = getPosts().find(
        (candidate) => candidate && candidate.id === id,
      );

      if (!post) {
        setIsNotFound(true);
        return;
      }

      if (!canModifyPost(session, post)) {
        navigate(ROUTES.blogs, { replace: true });
        return;
      }

      setForm({
        title: typeof post.title === 'string' ? post.title : '',
        content: typeof post.content === 'string' ? post.content : '',
      });
      setFieldErrors({});
    } catch {
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditing, navigate, session]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
    setPageError('');
  }

  function validateForm() {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = 'Title is required.';
    } else if (form.title.trim().length > 200) {
      errors.title = 'Title must be 200 characters or fewer.';
    }

    if (!form.content.trim()) {
      errors.content = 'Content is required.';
    }

    return errors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setPageError('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const latestPosts = getPosts();

      if (isEditing) {
        const postIndex = latestPosts.findIndex(
          (candidate) => candidate && candidate.id === id,
        );

        if (postIndex < 0) {
          setIsNotFound(true);
          return;
        }

        if (!canModifyPost(session, latestPosts[postIndex])) {
          navigate(ROUTES.blogs, { replace: true });
          return;
        }

        const nextPosts = [...latestPosts];
        nextPosts[postIndex] = {
          ...latestPosts[postIndex],
          title: form.title,
          content: form.content,
        };

        if (!savePosts(nextPosts)) {
          setPageError(STORAGE_ERROR_MESSAGE);
          return;
        }

        navigate(`/blog/${encodeURIComponent(id)}`, { replace: true });
        return;
      }

      const newPost = {
        id: crypto.randomUUID(),
        title: form.title,
        content: form.content,
        createdAt: new Date().toISOString(),
        authorId: session.userId,
        authorName: session.displayName,
      };

      if (!savePosts([...latestPosts, newPost])) {
        setPageError(STORAGE_ERROR_MESSAGE);
        return;
      }

      navigate(`/blog/${encodeURIComponent(newPost.id)}`, { replace: true });
    } catch {
      setPageError(STORAGE_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
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

  if (isNotFound) {
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

  const cancelDestination = isEditing
    ? `/blog/${encodeURIComponent(id)}`
    : ROUTES.blogs;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            {isEditing ? 'Update your story' : 'Create a new story'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {isEditing ? 'Edit post' : 'Write a post'}
          </h1>
          <p className="mt-3 text-slate-600">
            {isEditing
              ? 'Refine your ideas and save your changes.'
              : 'Give your ideas room to grow and share them with the community.'}
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form noValidate onSubmit={handleSubmit}>
            {pageError && (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {pageError}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Title
                </label>
                <span className="text-xs text-slate-500">
                  {form.title.length}/200
                </span>
              </div>
              <input
                id="title"
                name="title"
                type="text"
                maxLength={200}
                value={form.title}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                placeholder="Give your story a clear title"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.title && (
                <p
                  id="title-error"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {fieldErrors.title}
                </p>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="content"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Content
                </label>
                <span className="text-xs text-slate-500">
                  {form.content.length} characters
                </span>
              </div>
              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.content)}
                aria-describedby={
                  fieldErrors.content ? 'content-error' : 'content-help'
                }
                placeholder="Tell your story…"
                className="mt-2 block min-h-80 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.content ? (
                <p
                  id="content-error"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {fieldErrors.content}
                </p>
              ) : (
                <p id="content-help" className="mt-1.5 text-sm text-slate-500">
                  Line breaks will be preserved when your post is published.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <Link
                to={cancelDestination}
                className="rounded-lg px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {isSubmitting
                  ? 'Saving…'
                  : isEditing
                    ? 'Save changes'
                    : 'Publish post'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

WriteBlog.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default WriteBlog;