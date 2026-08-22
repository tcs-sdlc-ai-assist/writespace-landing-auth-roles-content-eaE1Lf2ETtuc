import { act, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES, STORAGE_KEYS } from './utils/constants';
import { setSession } from './utils/auth';

const routerState = vi.hoisted(() => ({
  initialEntries: ['/'],
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  const React = await import('react');

  return {
    ...actual,
    BrowserRouter: ({ children }) =>
      React.createElement(
        actual.MemoryRouter,
        { initialEntries: routerState.initialEntries },
        children,
      ),
  };
});

import App from './App';

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

function storeSession(session) {
  window.localStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify(session),
  );
}

function renderAt(path, session = null) {
  routerState.initialEntries = [path];

  if (session) {
    storeSession(session);
  }

  return render(<App />);
}

describe('App routing', () => {
  beforeEach(() => {
    routerState.initialEntries = ['/'];
  });

  it('renders the public landing route with the guest navigation shell', () => {
    renderAt('/');

    expect(
      screen.getByRole('heading', { name: /Write freely/i }),
    ).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', {
      name: 'Public navigation',
    });

    expect(
      within(navigation).getByRole('link', { name: 'Log in' }),
    ).toHaveAttribute('href', '/login');
    expect(
      within(navigation).getByRole('link', { name: 'Get Started' }),
    ).toHaveAttribute('href', '/register');
  });

  it('renders the public login and registration routes for guests', () => {
    const { unmount } = renderAt('/login');

    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();

    unmount();
    renderAt('/register');

    expect(
      screen.getByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/blogs'],
    ['/write'],
    ['/edit/post-1'],
    ['/blog/post-1'],
    ['/admin'],
    ['/users'],
  ])('redirects a guest from protected route %s to login', async (path) => {
    renderAt(path);

    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', {
        name: 'Authenticated navigation',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the authenticated user shell with user navigation links', async () => {
    renderAt('/blogs', userSession);

    expect(
      await screen.findByRole('heading', { name: 'Latest posts' }),
    ).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', {
      name: 'Authenticated navigation',
    });

    expect(
      within(navigation).getByRole('link', { name: 'Blogs' }),
    ).toHaveAttribute('href', '/blogs');
    expect(
      within(navigation).getByRole('link', { name: 'Write' }),
    ).toHaveAttribute('href', '/write');
    expect(
      within(navigation).queryByRole('link', { name: 'Users' }),
    ).not.toBeInTheDocument();
    expect(
      within(navigation).queryByRole('link', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();
    expect(within(navigation).getByText('Alice')).toBeInTheDocument();
  });

  it('redirects an authenticated user away from the Admin dashboard', async () => {
    renderAt('/admin', userSession);

    expect(
      await screen.findByRole('heading', { name: 'Latest posts' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Welcome back, Alice/),
    ).not.toBeInTheDocument();
  });

  it('redirects an authenticated user away from user management', async () => {
    renderAt('/users', userSession);

    expect(
      await screen.findByRole('heading', { name: 'Latest posts' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'User management' }),
    ).not.toBeInTheDocument();
  });

  it('allows an Admin to access the dashboard with all role links', async () => {
    renderAt('/admin', adminSession);

    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Admin' }),
    ).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', {
      name: 'Authenticated navigation',
    });

    expect(
      within(navigation).getByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('href', '/admin');
    expect(
      within(navigation).getByRole('link', { name: 'Blogs' }),
    ).toHaveAttribute('href', '/blogs');
    expect(
      within(navigation).getByRole('link', { name: 'Write' }),
    ).toHaveAttribute('href', '/write');
    expect(
      within(navigation).getByRole('link', { name: 'Users' }),
    ).toHaveAttribute('href', '/users');
  });

  it('allows an Admin to access user management', async () => {
    renderAt('/users', adminSession);

    expect(
      await screen.findByRole('heading', { name: 'User management' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: 'WriteSpace accounts' }),
    ).toBeInTheDocument();
  });

  it('maps both create and edit routes to the shared writing page', async () => {
    const { unmount } = renderAt('/write', userSession);

    expect(
      await screen.findByRole('heading', { name: 'Write a post' }),
    ).toBeInTheDocument();

    unmount();
    renderAt('/edit/missing-post', userSession);

    expect(
      await screen.findByRole('heading', { name: 'Post not found' }),
    ).toBeInTheDocument();
  });

  it('maps the post reader route and renders its not-found state', async () => {
    renderAt('/blog/missing-post', userSession);

    expect(
      await screen.findByRole('heading', { name: 'Post not found' }),
    ).toBeInTheDocument();
  });

  it('redirects unknown routes to the public landing page', async () => {
    renderAt('/unknown-route');

    expect(
      await screen.findByRole('heading', { name: /Write freely/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Public navigation' }),
    ).toBeInTheDocument();
  });

  it('shows the role-aware public shell for an authenticated visitor', () => {
    renderAt('/', adminSession);

    const navigation = screen.getByRole('navigation', {
      name: 'Public navigation',
    });

    expect(
      within(navigation).getByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('href', '/admin');
    expect(
      within(navigation).queryByRole('link', { name: 'Log in' }),
    ).not.toBeInTheDocument();
  });

  it('refreshes the public shell after a same-tab session-change event', async () => {
    renderAt('/');

    expect(
      screen.getByRole('link', { name: 'Get Started' }),
    ).toBeInTheDocument();

    await act(async () => {
      expect(setSession(userSession)).toBe(true);
    });

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: 'Dashboard' }),
      ).toHaveAttribute('href', '/blogs');
    });

    expect(
      screen.queryByRole('link', { name: 'Get Started' }),
    ).not.toBeInTheDocument();
  });
});