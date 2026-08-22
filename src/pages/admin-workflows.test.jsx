import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ADMIN,
  ROLES,
  STORAGE_ERROR_MESSAGE,
  STORAGE_KEYS,
} from '../utils/constants';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';

const adminSession = {
  userId: DEFAULT_ADMIN.userId,
  username: DEFAULT_ADMIN.username,
  displayName: DEFAULT_ADMIN.displayName,
  role: ROLES.admin,
};

function createPost({
  id = 'post-1',
  title = 'First post',
  createdAt = '2026-08-22T10:00:00.000Z',
} = {}) {
  return {
    id,
    title,
    content: `Content for ${title}`,
    createdAt,
    authorId: 'user-1',
    authorName: 'Alice',
  };
}

function createUser({
  id = 'user-1',
  displayName = 'Alice Writer',
  username = 'alice',
  password = 'demo-only',
  role = ROLES.user,
  createdAt = '2026-08-22T10:00:00.000Z',
} = {}) {
  return {
    id,
    displayName,
    username,
    password,
    role,
    createdAt,
  };
}

function storePosts(posts) {
  window.localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
}

function storeUsers(users) {
  window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function renderDashboard(session = adminSession) {
  return render(
    <MemoryRouter>
      <AdminDashboard session={session} />
    </MemoryRouter>,
  );
}

function renderUserManagement(session = adminSession) {
  return render(
    <MemoryRouter>
      <UserManagement session={session} />
    </MemoryRouter>,
  );
}

async function completeUserForm({
  displayName = 'Bob Writer',
  username = 'bob',
  password = 'demo-password',
  role = ROLES.user,
} = {}) {
  const user = userEvent.setup();

  if (displayName) {
    await user.type(screen.getByLabelText('Display name'), displayName);
  }

  if (username) {
    await user.type(screen.getByLabelText('Username'), username);
  }

  if (password) {
    await user.type(screen.getByLabelText('Password'), password);
  }

  await user.selectOptions(screen.getByLabelText('Role'), role);

  return user;
}

describe('AdminDashboard', () => {
  it('renders the four exactly labeled statistics from stored data', async () => {
    storePosts([
      createPost(),
      createPost({
        id: 'post-2',
        title: 'Second post',
        createdAt: '2026-08-21T10:00:00.000Z',
      }),
    ]);
    storeUsers([
      createUser(),
      createUser({
        id: 'admin-2',
        displayName: 'Second Admin',
        username: 'second-admin',
        role: ROLES.admin,
      }),
    ]);

    renderDashboard();

    expect(
      await screen.findByRole('region', { name: 'Total Posts: 2' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Total Users: 3' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Admin Users: 2' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Regular Users: 1' }),
    ).toBeInTheDocument();
  });

  it('renders quick actions with their expected destinations', () => {
    renderDashboard();

    expect(
      screen.getByRole('link', { name: /Write a post/ }),
    ).toHaveAttribute('href', '/write');
    expect(
      screen.getByRole('link', { name: /Manage users/ }),
    ).toHaveAttribute('href', '/users');
    expect(
      screen.getByRole('link', { name: /View all posts/ }),
    ).toHaveAttribute('href', '/blogs');
  });

  it('shows only the five newest posts in newest-first order with edit controls', async () => {
    storePosts(
      Array.from({ length: 6 }, (_, index) =>
        createPost({
          id: `post-${index + 1}`,
          title: `Story ${index + 1}`,
          createdAt: `2026-08-${String(index + 10).padStart(2, '0')}T10:00:00.000Z`,
        }),
      ),
    );

    renderDashboard();

    const newestTitle = await screen.findByText('Story 6');
    const recentSection = screen
      .getByRole('heading', { name: 'Recent posts' })
      .closest('section');

    expect(recentSection).not.toBeNull();

    const listItems = within(recentSection).getAllByRole('listitem');

    expect(listItems).toHaveLength(5);
    expect(listItems[0]).toContainElement(newestTitle);
    expect(listItems[1]).toHaveTextContent('Story 5');
    expect(listItems[2]).toHaveTextContent('Story 4');
    expect(listItems[3]).toHaveTextContent('Story 3');
    expect(listItems[4]).toHaveTextContent('Story 2');
    expect(within(recentSection).queryByText('Story 1')).not.toBeInTheDocument();
    expect(
      within(recentSection).getByRole('link', { name: 'Edit Story 6' }),
    ).toHaveAttribute('href', '/edit/post-6');
  });

  it('does not delete a recent post when confirmation is cancelled', async () => {
    const originalPost = createPost();
    storePosts([originalPost]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderDashboard();

    await user.click(
      await screen.findByRole('button', { name: 'Delete First post' }),
    );

    expect(confirmSpy).toHaveBeenCalledWith('Delete this post?');
    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts)),
    ).toEqual([originalPost]);
  });

  it('deletes exactly the selected recent post after confirmation', async () => {
    const deletedPost = createPost();
    const remainingPost = createPost({
      id: 'post-2',
      title: 'Keep this post',
      createdAt: '2026-08-21T10:00:00.000Z',
    });
    storePosts([deletedPost, remainingPost]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderDashboard();

    await user.click(
      await screen.findByRole('button', { name: 'Delete First post' }),
    );

    await waitFor(() => {
      expect(screen.queryByText('First post')).not.toBeInTheDocument();
    });

    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts)),
    ).toEqual([remainingPost]);
    expect(screen.getByText('Keep this post')).toBeInTheDocument();
  });

  it('keeps the post visible and reports a failed delete write', async () => {
    const originalPost = createPost();
    storePosts([originalPost]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderDashboard();
    await screen.findByText('First post');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(
      screen.getByRole('button', { name: 'Delete First post' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      STORAGE_ERROR_MESSAGE,
    );
    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts)),
    ).toEqual([originalPost]);
  });

  it('renders an empty recent-post state when no posts exist', () => {
    renderDashboard();

    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Write the first post' }),
    ).toHaveAttribute('href', '/write');
  });
});

describe('UserManagement account creation', () => {
  it('validates all required text fields before creating an account', async () => {
    const user = userEvent.setup();

    renderUserManagement();

    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(
      screen.getByText('Display name is required.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.users)).toBeNull();
  });

  it.each([
    ['a stored username', 'alice'],
    ['the reserved default Admin username', 'admin'],
  ])('rejects %s without changing stored users', async (_, username) => {
    const existingUser = createUser();
    storeUsers([existingUser]);
    renderUserManagement();

    const user = await completeUserForm({
      displayName: 'Duplicate Account',
      username,
    });
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Username is already taken.',
    );
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.users)),
    ).toEqual([existingUser]);
  });

  it('creates an Admin account with a UUID and ISO timestamp', async () => {
    renderUserManagement();

    const user = await completeUserForm({
      displayName: 'Content Manager',
      username: 'manager',
      password: 'local-password',
      role: ROLES.admin,
    });
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'User created successfully.',
    );

    const storedUsers = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.users),
    );

    expect(storedUsers).toHaveLength(1);
    expect(storedUsers[0]).toMatchObject({
      displayName: 'Content Manager',
      username: 'manager',
      password: 'local-password',
      role: ROLES.admin,
    });
    expect(storedUsers[0].id).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(storedUsers[0].createdAt))).toBe(false);
    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toHaveValue(ROLES.user);
  });

  it('does not clear the form or navigate when account persistence fails', async () => {
    renderUserManagement();
    const user = await completeUserForm();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      STORAGE_ERROR_MESSAGE,
    );
    expect(screen.getByLabelText('Display name')).toHaveValue('Bob Writer');
    expect(screen.getByLabelText('Username')).toHaveValue('bob');
    expect(screen.getByLabelText('Password')).toHaveValue('demo-password');
  });
});

describe('UserManagement account listing and deletion', () => {
  it('renders the default Admin and responsive stored-account data', async () => {
    storeUsers([createUser()]);
    renderUserManagement();

    const storedName = await screen.findByText('Alice Writer');
    const storedRow = storedName.closest('[role="row"]');

    expect(storedRow).not.toBeNull();
    expect(storedRow).toHaveClass(
      'grid',
      'md:grid-cols-[minmax(12rem,2fr)_minmax(8rem,1.5fr)_minmax(6rem,0.75fr)_minmax(8rem,1fr)_auto]',
    );
    expect(within(storedRow).getAllByText('@alice')).toHaveLength(2);
    expect(within(storedRow).getByText('Aug 22, 2026')).toBeInTheDocument();
    expect(screen.getByText('Default account')).toBeInTheDocument();
    expect(screen.getByText('2 accounts, including the default Admin.')).toBeInTheDocument();
  });

  it('keeps an account when confirmed deletion is cancelled', async () => {
    const existingUser = createUser();
    storeUsers([existingUser]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderUserManagement();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Alice Writer' }),
    );

    expect(confirmSpy).toHaveBeenCalledWith('Delete this user?');
    expect(screen.getByText('Alice Writer')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.users)),
    ).toEqual([existingUser]);
  });

  it('deletes exactly the selected account after confirmation', async () => {
    const deletedUser = createUser();
    const remainingUser = createUser({
      id: 'user-2',
      displayName: 'Bob Writer',
      username: 'bob',
    });
    storeUsers([deletedUser, remainingUser]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderUserManagement();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Alice Writer' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'User deleted successfully.',
    );
    expect(screen.queryByText('Alice Writer')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Writer')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.users)),
    ).toEqual([remainingUser]);
  });

  it('disables deletion of the immutable default Admin', () => {
    renderUserManagement();

    const deleteButton = screen.getByRole('button', {
      name: 'Delete Admin',
    });

    expect(deleteButton).toBeDisabled();
    expect(
      screen.getByText('The default Admin cannot be deleted.'),
    ).toBeInTheDocument();
  });

  it('disables deletion of a stored account matching the active session', async () => {
    const storedAdminSession = {
      userId: 'stored-admin',
      username: 'manager',
      displayName: 'Current Manager',
      role: ROLES.admin,
    };
    storeUsers([
      createUser({
        id: storedAdminSession.userId,
        displayName: storedAdminSession.displayName,
        username: storedAdminSession.username,
        role: ROLES.admin,
      }),
    ]);

    renderUserManagement(storedAdminSession);

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete Current Manager',
    });

    expect(deleteButton).toBeDisabled();
    expect(
      screen.getByText('You cannot delete your own account.'),
    ).toBeInTheDocument();
  });

  it('keeps the account listed and reports a failed deletion write', async () => {
    const existingUser = createUser();
    storeUsers([existingUser]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderUserManagement();
    await screen.findByText('Alice Writer');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(
      screen.getByRole('button', { name: 'Delete Alice Writer' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      STORAGE_ERROR_MESSAGE,
    );
    expect(screen.getByText('Alice Writer')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.users)),
    ).toEqual([existingUser]);
  });
});