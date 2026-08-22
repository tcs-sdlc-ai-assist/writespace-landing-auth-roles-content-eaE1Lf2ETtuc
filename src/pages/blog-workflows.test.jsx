import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROLES, STORAGE_ERROR_MESSAGE, STORAGE_KEYS } from '../utils/constants';
import Home from './Home';
import ReadBlog from './ReadBlog';
import WriteBlog from './WriteBlog';

const userSession = {
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  role: ROLES.user,
};

const otherUserSession = {
  userId: 'user-2',
  username: 'bob',
  displayName: 'Bob',
  role: ROLES.user,
};

const adminSession = {
  userId: 'admin',
  username: 'admin',
  displayName: 'Admin',
  role: ROLES.admin,
};

function createPost({
  id = 'post-1',
  title = 'First post',
  content = 'First line\nSecond line',
  createdAt = '2026-08-22T10:05:00.000Z',
  authorId = userSession.userId,
  authorName = userSession.displayName,
} = {}) {
  return {
    id,
    title,
    content,
    createdAt,
    authorId,
    authorName,
  };
}

function storePosts(posts) {
  window.localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
}

function Destination() {
  const { id } = useParams();

  return <p>Reader destination {id}</p>;
}

function renderHome(session = userSession) {
  return render(
    <MemoryRouter>
      <Home session={session} />
    </MemoryRouter>,
  );
}

function renderWriteBlog({
  path = '/write',
  session = userSession,
} = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/write" element={<WriteBlog session={session} />} />
        <Route path="/edit/:id" element={<WriteBlog session={session} />} />
        <Route path="/blog/:id" element={<Destination />} />
        <Route path="/blogs" element={<p>Blogs destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderReadBlog({
  path = '/blog/post-1',
  session = userSession,
} = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/blog/:id" element={<ReadBlog session={session} />} />
        <Route path="/edit/:id" element={<p>Edit destination</p>} />
        <Route path="/blogs" element={<p>Blogs destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function completePostForm({
  title = 'A new story',
  content = 'A thoughtful post with two lines.\nThe second line.',
} = {}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Title'), title);
  await user.type(screen.getByLabelText('Content'), content);

  return user;
}

describe('Home', () => {
  it('renders every post newest first in a responsive card grid', async () => {
    storePosts([
      createPost({
        id: 'post-old',
        title: 'Old story',
        createdAt: '2026-08-19T10:00:00.000Z',
      }),
      createPost({
        id: 'post-new',
        title: 'Newest story',
        createdAt: '2026-08-22T10:00:00.000Z',
      }),
      createPost({
        id: 'post-middle',
        title: 'Middle story',
        createdAt: '2026-08-21T10:00:00.000Z',
      }),
    ]);

    renderHome();

    const postGrid = await screen.findByRole('region', {
      name: 'Blog posts',
    });
    const cards = within(postGrid).getAllByRole('article');

    expect(postGrid).toHaveClass(
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3',
    );
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent('Newest story');
    expect(cards[1]).toHaveTextContent('Middle story');
    expect(cards[2]).toHaveTextContent('Old story');
  });

  it('renders the specified empty state and write call to action', async () => {
    renderHome();

    expect(await screen.findByText('No posts yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Write your first post' }),
    ).toHaveAttribute('href', '/write');
  });
});

describe('WriteBlog create workflow', () => {
  it('shows required field errors and does not create a blank post', async () => {
    const user = userEvent.setup();

    renderWriteBlog();
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Content is required.')).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.posts)).toBeNull();
  });

  it('creates a post with UUID, ISO date, author data, and preserved content', async () => {
    renderWriteBlog();
    const user = await completePostForm();

    expect(screen.getByText('49 characters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    const posts = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.posts),
    );

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      title: 'A new story',
      content: 'A thoughtful post with two lines.\nThe second line.',
      authorId: userSession.userId,
      authorName: userSession.displayName,
    });
    expect(posts[0].id).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(posts[0].createdAt))).toBe(false);
    expect(
      await screen.findByText(`Reader destination ${posts[0].id}`),
    ).toBeInTheDocument();
  });

  it('keeps the form visible and shows an error when post persistence fails', async () => {
    renderWriteBlog();
    const user = await completePostForm();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      STORAGE_ERROR_MESSAGE,
    );
    expect(
      screen.getByRole('heading', { name: 'Write a post' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Reader destination/)).not.toBeInTheDocument();
  });

  it('provides a ghost Cancel link back to the blog index', () => {
    renderWriteBlog();

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/blogs',
    );
  });
});

describe('WriteBlog edit workflow', () => {
  it('prefills an owned post and updates only title and content', async () => {
    const originalPost = createPost();
    storePosts([originalPost]);

    renderWriteBlog({ path: '/edit/post-1' });

    const titleInput = await screen.findByDisplayValue('First post');
    const contentInput = screen.getByDisplayValue('First line\nSecond line');
    const user = userEvent.setup();

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/blog/post-1',
    );

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');
    await user.clear(contentInput);
    await user.type(contentInput, 'Updated content');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Reader destination post-1'),
    ).toBeInTheDocument();

    const [updatedPost] = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.posts),
    );

    expect(updatedPost).toEqual({
      ...originalPost,
      title: 'Updated title',
      content: 'Updated content',
    });
  });

  it('redirects a non-owner away without exposing the edit form', async () => {
    storePosts([createPost()]);

    renderWriteBlog({
      path: '/edit/post-1',
      session: otherUserSession,
    });

    expect(
      await screen.findByText('Blogs destination'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Edit post' }),
    ).not.toBeInTheDocument();
  });

  it('renders the exact not-found state for a missing edit target', async () => {
    renderWriteBlog({ path: '/edit/missing-post' });

    expect(
      await screen.findByRole('heading', { name: 'Post not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to blogs' }),
    ).toHaveAttribute('href', '/blogs');
  });
});

describe('ReadBlog', () => {
  it('renders the full post with author, date, and whitespace-preserved content', async () => {
    storePosts([createPost()]);

    renderReadBlog();

    expect(
      await screen.findByRole('heading', { name: 'First post' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Aug 22, 2026')).toBeInTheDocument();

    const content = screen.getByText('First line Second line');

    expect(content).toHaveClass('whitespace-pre-wrap');
    expect(content).toHaveTextContent('First line Second line');
  });

  it('renders the exact not-found state with a back link', async () => {
    renderReadBlog({ path: '/blog/missing-post' });

    expect(
      await screen.findByRole('heading', { name: 'Post not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to blogs' }),
    ).toHaveAttribute('href', '/blogs');
  });

  it.each([
    ['the post owner', userSession],
    ['an Admin', adminSession],
  ])('shows edit and delete controls to %s', async (_, session) => {
    storePosts([createPost()]);

    renderReadBlog({ session });

    expect(
      await screen.findByRole('link', { name: 'Edit post' }),
    ).toHaveAttribute('href', '/edit/post-1');
    expect(
      screen.getByRole('button', { name: 'Delete post' }),
    ).toBeInTheDocument();
  });

  it('hides edit and delete controls from a non-owner', async () => {
    storePosts([createPost()]);

    renderReadBlog({ session: otherUserSession });

    expect(
      await screen.findByRole('heading', { name: 'First post' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Edit post' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete post' }),
    ).not.toBeInTheDocument();
  });

  it('does not delete or navigate when deletion confirmation is cancelled', async () => {
    const originalPost = createPost();
    storePosts([originalPost]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderReadBlog();

    await user.click(
      await screen.findByRole('button', { name: 'Delete post' }),
    );

    expect(confirmSpy).toHaveBeenCalledWith('Delete this post?');
    expect(
      screen.getByRole('heading', { name: 'First post' }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts)),
    ).toEqual([originalPost]);
  });

  it('deletes exactly the selected post and navigates after confirmation', async () => {
    const remainingPost = createPost({
      id: 'post-2',
      title: 'Keep this post',
    });
    storePosts([createPost(), remainingPost]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderReadBlog();

    await user.click(
      await screen.findByRole('button', { name: 'Delete post' }),
    );

    expect(confirmSpy).toHaveBeenCalledWith('Delete this post?');
    expect(
      await screen.findByText('Blogs destination'),
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts)),
    ).toEqual([remainingPost]);
  });

  it('blocks navigation and displays an error when deletion cannot be saved', async () => {
    const originalPost = createPost();
    storePosts([originalPost]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderReadBlog();

    await screen.findByRole('heading', { name: 'First post' });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(screen.getByRole('button', { name: 'Delete post' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        STORAGE_ERROR_MESSAGE,
      );
    });

    expect(
      screen.getByRole('heading', { name: 'First post' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Blogs destination')).not.toBeInTheDocument();
  });
});