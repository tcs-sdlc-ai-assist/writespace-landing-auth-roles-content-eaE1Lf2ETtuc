import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROLES, STORAGE_KEYS } from '../utils/constants';
import Avatar, { getAvatar } from './Avatar';
import BlogCard from './BlogCard';
import ProtectedRoute from './ProtectedRoute';
import UserRow from './UserRow';

const userSession = {
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  role: ROLES.user,
};

const adminSession = {
  userId: 'admin',
  username: 'admin',
  displayName: 'Admin',
  role: ROLES.admin,
};

const post = {
  id: 'post-1',
  title: 'First post',
  content: 'A'.repeat(121),
  createdAt: '2026-08-22T10:05:00.000Z',
  authorId: 'user-1',
  authorName: 'Alice',
};

const storedUser = {
  id: 'user-2',
  displayName: 'Bob Writer',
  username: 'bob',
  role: ROLES.user,
  createdAt: '2026-08-21T10:00:00.000Z',
};

function renderBlogCard(session = null, index = 0) {
  return render(
    <MemoryRouter>
      <BlogCard post={post} index={index} session={session} />
    </MemoryRouter>,
  );
}

function storeSession(session) {
  window.localStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify(session),
  );
}

function renderProtectedRoute({
  session = null,
  adminOnly = false,
  useChildren = false,
} = {}) {
  if (session) {
    storeSession(session);
  }

  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/blogs" element={<p>Blogs page</p>} />
        {useChildren ? (
          <Route
            path="/private"
            element={
              <ProtectedRoute adminOnly={adminOnly}>
                <p>Protected content</p>
              </ProtectedRoute>
            }
          />
        ) : (
          <Route element={<ProtectedRoute adminOnly={adminOnly} />}>
            <Route path="/private" element={<p>Protected content</p>} />
          </Route>
        )}
      </Routes>
    </MemoryRouter>,
  );
}

describe('Avatar', () => {
  it('renders the Admin crown with violet styling and an accessible label', () => {
    render(<Avatar role={ROLES.admin} size="lg" />);

    const avatar = screen.getByRole('img', { name: 'Admin avatar' });

    expect(avatar).toHaveTextContent('👑');
    expect(avatar).toHaveClass('bg-violet-600', 'h-14', 'w-14');
  });

  it('uses safe user presentation for user and unknown roles', () => {
    expect(getAvatar(ROLES.user)).toEqual({
      emoji: '📖',
      className: 'bg-indigo-500',
      label: 'User avatar',
    });
    expect(getAvatar('owner')).toEqual({
      emoji: '📖',
      className: 'bg-indigo-500',
      label: 'User avatar',
    });

    render(<Avatar role="owner" />);

    expect(screen.getByRole('img', { name: 'User avatar' })).toHaveClass(
      'bg-indigo-500',
    );
  });
});

describe('BlogCard', () => {
  it('renders a linked post with deterministic accent, excerpt, date, and author', () => {
    renderBlogCard(userSession, 2);

    expect(
      screen.getByRole('link', { name: 'Read First post' }),
    ).toHaveAttribute('href', '/blog/post-1');
    expect(screen.getByText(`${'A'.repeat(120)}…`)).toBeInTheDocument();
    expect(screen.getByText('Aug 22, 2026')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveClass('border-pink-500');
  });

  it.each([
    ['the post owner', userSession],
    ['an Admin', adminSession],
  ])('shows the edit action to %s', (_, session) => {
    renderBlogCard(session);

    expect(
      screen.getByRole('link', { name: 'Edit First post' }),
    ).toHaveAttribute('href', '/edit/post-1');
  });

  it('hides the edit action from a user who does not own the post', () => {
    renderBlogCard({
      ...userSession,
      userId: 'user-3',
      username: 'charlie',
      displayName: 'Charlie',
    });

    expect(
      screen.queryByRole('link', { name: 'Edit First post' }),
    ).not.toBeInTheDocument();
  });

  it('wraps negative accent indexes into the configured accent sequence', () => {
    renderBlogCard(userSession, -1);

    expect(screen.getByRole('article')).toHaveClass('border-teal-500');
  });
});

describe('UserRow', () => {
  it('renders responsive account data and invokes deletion for another account', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <UserRow
        user={storedUser}
        currentSession={userSession}
        onDelete={onDelete}
      />,
    );

    const row = screen.getByRole('row');
    const username = screen.getByText('@bob');

    expect(row).toHaveClass('grid', 'md:grid-cols-[minmax(12rem,2fr)_minmax(8rem,1.5fr)_minmax(6rem,0.75fr)_minmax(8rem,1fr)_auto]');
    expect(username.closest('[role="cell"]')).toHaveClass('hidden', 'md:block');
    expect(screen.getByText('Bob Writer')).toBeInTheDocument();
    expect(screen.getByText('Aug 21, 2026')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Delete Bob Writer' }),
    );

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('user-2');
  });

  it('disables deletion of the active user account', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <UserRow
        user={{ ...storedUser, id: userSession.userId }}
        currentSession={userSession}
        onDelete={onDelete}
      />,
    );

    const deleteButton = screen.getByRole('button', {
      name: 'Delete Bob Writer',
    });

    expect(deleteButton).toBeDisabled();
    expect(
      screen.getByText('You cannot delete your own account.'),
    ).toBeInTheDocument();

    await user.click(deleteButton);

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('disables deletion of the immutable default Admin account', () => {
    const onDelete = vi.fn();

    render(
      <UserRow
        user={{
          userId: 'admin',
          displayName: 'Admin',
          username: 'admin',
          role: ROLES.admin,
        }}
        currentSession={userSession}
        onDelete={onDelete}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Delete Admin' }),
    ).toBeDisabled();
    expect(
      screen.getByText('The default Admin cannot be deleted.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Default account')).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  it('redirects a guest to the login route', () => {
    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders nested protected content for an authenticated user', () => {
    renderProtectedRoute({ session: userSession });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects a non-Admin away from an Admin-only route', () => {
    renderProtectedRoute({
      session: userSession,
      adminOnly: true,
      useChildren: true,
    });

    expect(screen.getByText('Blogs page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders an Admin-only route for a valid Admin session', () => {
    renderProtectedRoute({
      session: adminSession,
      adminOnly: true,
      useChildren: true,
    });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('treats a malformed stored session as a guest', () => {
    window.localStorage.setItem(STORAGE_KEYS.session, '{invalid-json');

    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});