import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROLES, STORAGE_KEYS } from '../utils/constants';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

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

function createPost(id, title, createdAt) {
  return {
    id,
    title,
    content: `Content for ${title}`,
    createdAt,
    authorId: 'user-1',
    authorName: 'Alice',
  };
}

function renderLanding(session = null) {
  return render(
    <MemoryRouter>
      <LandingPage session={session} />
    </MemoryRouter>,
  );
}

function renderAuthPage(page, session = null) {
  return render(
    <MemoryRouter initialEntries={[page]}>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage session={session} />}
        />
        <Route
          path="/register"
          element={<RegisterPage session={session} />}
        />
        <Route path="/blogs" element={<p>User blogs destination</p>} />
        <Route path="/admin" element={<p>Admin dashboard destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function completeLoginForm(username, password) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Username'), username);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));

  return user;
}

async function completeRegistrationForm({
  displayName = 'Alice Smith',
  username = 'alice',
  password = 'demo-only',
  confirmPassword = 'demo-only',
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

  if (confirmPassword) {
    await user.type(screen.getByLabelText('Confirm password'), confirmPassword);
  }

  await user.click(screen.getByRole('button', { name: 'Create account' }));

  return user;
}

describe('LandingPage', () => {
  it('renders only the three newest stored posts in newest-first order', async () => {
    window.localStorage.setItem(
      STORAGE_KEYS.posts,
      JSON.stringify([
        createPost('post-1', 'Oldest story', '2026-08-19T10:00:00.000Z'),
        createPost('post-3', 'Newest story', '2026-08-22T10:00:00.000Z'),
        createPost('post-2', 'Middle story', '2026-08-21T10:00:00.000Z'),
        createPost('post-4', 'Second newest story', '2026-08-21T18:00:00.000Z'),
      ]),
    );

    renderLanding();

    const latestSection = await screen.findByRole('heading', {
      name: 'Latest posts',
    });
    const section = latestSection.closest('section');

    expect(section).not.toBeNull();

    const cards = within(section).getAllByRole('article');

    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent('Newest story');
    expect(cards[1]).toHaveTextContent('Second newest story');
    expect(cards[2]).toHaveTextContent('Middle story');
    expect(
      within(section).queryByText('Oldest story'),
    ).not.toBeInTheDocument();
  });

  it('renders the exact empty message when there are no posts', async () => {
    renderLanding();

    expect(await screen.findByText('No posts yet.')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'View all posts →' }),
    ).not.toBeInTheDocument();
  });

  it('shows registration calls to action to a guest', () => {
    renderLanding();

    const startWritingLink = screen.getByRole('link', {
      name: 'Start Writing',
    });

    expect(startWritingLink).toHaveAttribute('href', '/register');
    expect(
      screen.getByRole('link', { name: 'Get Started' }),
    ).toHaveAttribute('href', '/register');
    expect(
      screen.getByRole('link', { name: 'Log in' }),
    ).toHaveAttribute('href', '/login');
  });

  it('shows role-aware dashboard actions to an authenticated Admin', () => {
    renderLanding(adminSession);

    expect(
      screen.getByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('href', '/admin');

    for (const link of screen.getAllByRole('link', {
      name: 'Go to Dashboard',
    })) {
      expect(link).toHaveAttribute('href', '/admin');
    }

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});

describe('LoginPage', () => {
  it('authenticates the default Admin before checking stored users', async () => {
    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([
        {
          id: 'imposter-admin',
          displayName: 'Stored Imposter',
          username: 'admin',
          password: 'admin',
          role: ROLES.user,
          createdAt: '2026-08-22T10:00:00.000Z',
        },
      ]),
    );

    renderAuthPage('/login');
    await completeLoginForm('admin', 'admin');

    expect(
      await screen.findByText('Admin dashboard destination'),
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.session)),
    ).toEqual(adminSession);
  });

  it('authenticates an exact stored-user credential pair', async () => {
    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([
        {
          id: userSession.userId,
          displayName: userSession.displayName,
          username: userSession.username,
          password: 'demo-only',
          role: ROLES.user,
          createdAt: '2026-08-22T10:00:00.000Z',
        },
      ]),
    );

    renderAuthPage('/login');
    await completeLoginForm('alice', 'demo-only');

    expect(
      await screen.findByText('User blogs destination'),
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.session)),
    ).toEqual(userSession);
  });

  it('renders the exact invalid-credential error and remains on login', async () => {
    renderAuthPage('/login');
    await completeLoginForm('alice', 'incorrect');

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent('Invalid username or password.');
    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('validates required fields before attempting authentication', async () => {
    const user = userEvent.setup();

    renderAuthPage('/login');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(
      screen.queryByText('Invalid username or password.'),
    ).not.toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('validates all required registration fields', async () => {
    const user = userEvent.setup();

    renderAuthPage('/register');
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(
      screen.getByText('Display name is required.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(
      screen.getByText('Confirm password is required.'),
    ).toBeInTheDocument();
  });

  it('rejects mismatched passwords with the exact validation text', async () => {
    renderAuthPage('/register');

    await completeRegistrationForm({
      password: 'demo-only',
      confirmPassword: 'different',
    });

    expect(
      screen.getByText('Passwords do not match.'),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.users)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it.each([
    ['a stored username', 'alice'],
    ['the default Admin username', 'admin'],
  ])('rejects %s with the exact duplicate error', async (_, username) => {
    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([
        {
          id: 'user-1',
          displayName: 'Existing Alice',
          username: 'alice',
          password: 'existing-password',
          role: ROLES.user,
          createdAt: '2026-08-20T10:00:00.000Z',
        },
      ]),
    );

    renderAuthPage('/register');

    await completeRegistrationForm({
      displayName: 'New Writer',
      username,
    });

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent('Username is already taken.');
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.users)),
    ).toHaveLength(1);
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('persists a new user and session before navigating to blogs', async () => {
    renderAuthPage('/register');

    await completeRegistrationForm();

    expect(
      await screen.findByText('User blogs destination'),
    ).toBeInTheDocument();

    const users = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.users),
    );
    const session = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.session),
    );

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      displayName: 'Alice Smith',
      username: 'alice',
      password: 'demo-only',
      role: ROLES.user,
    });
    expect(users[0].id).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(users[0].createdAt))).toBe(false);
    expect(session).toEqual({
      userId: users[0].id,
      username: 'alice',
      displayName: 'Alice Smith',
      role: ROLES.user,
    });
  });
});

describe('authenticated auth-page redirects', () => {
  it.each([
    ['/login', userSession, 'User blogs destination'],
    ['/register', userSession, 'User blogs destination'],
    ['/login', adminSession, 'Admin dashboard destination'],
    ['/register', adminSession, 'Admin dashboard destination'],
  ])(
    'redirects an authenticated visitor from %s to the role home',
    async (page, session, destinationText) => {
      renderAuthPage(page, session);

      await waitFor(() => {
        expect(screen.getByText(destinationText)).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('heading', { name: 'Welcome back' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Create your account' }),
      ).not.toBeInTheDocument();
    },
  );
});