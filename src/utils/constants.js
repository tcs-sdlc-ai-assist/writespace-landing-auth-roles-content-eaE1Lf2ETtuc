export const STORAGE_KEYS = Object.freeze({
  posts: 'writespace_posts',
  users: 'writespace_users',
  session: 'writespace_session',
});

export const ROLES = Object.freeze({
  admin: 'admin',
  user: 'user',
});

export const DEFAULT_ADMIN = Object.freeze({
  userId: 'admin',
  username: 'admin',
  password: 'admin',
  displayName: 'Admin',
  role: ROLES.admin,
});

export const ROUTES = Object.freeze({
  landing: '/',
  login: '/login',
  register: '/register',
  blogs: '/blogs',
  blog: '/blog/:id',
  write: '/write',
  edit: '/edit/:id',
  admin: '/admin',
  users: '/users',
});

export const BLOG_ACCENT_CLASSES = Object.freeze([
  'border-indigo-500',
  'border-violet-500',
  'border-pink-500',
  'border-teal-500',
]);

export const STORAGE_ERROR_MESSAGE = 'Unable to save changes. Please try again.';