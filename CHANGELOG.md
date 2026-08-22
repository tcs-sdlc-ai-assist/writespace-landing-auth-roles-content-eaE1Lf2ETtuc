# Changelog

All notable changes to WriteSpace are documented in this file.

## 1.0.0

Initial release of the WriteSpace static blog MVP.

### Added

- Public landing page with responsive marketing content, feature cards, and previews of the three newest posts.
- Local registration and login workflows.
- Built-in demo Admin account.
- Role-aware public and authenticated navigation.
- Protected routes for authenticated readers and Admin-only management pages.
- Responsive newest-first blog index.
- Post creation, reading, editing, and confirmed deletion.
- Owner-based post controls for regular users.
- Full post-management access for Admin users.
- Admin dashboard with post and account statistics, quick actions, and controls for the five newest posts.
- User management with account creation, role assignment, confirmed deletion, default Admin protection, and self-deletion prevention.
- Accessible labels, semantic controls, visible keyboard focus states, responsive layouts, and reduced-motion support.
- Defensive handling for malformed, unavailable, or full browser storage.
- Vite development, production build, preview, and start scripts.
- Vitest, jsdom, and Testing Library test coverage for utilities, routing, authentication, blog workflows, and Admin workflows.
- GitHub Actions continuous integration for reproducible installation, source constraints, tests, and production builds.
- Vercel SPA fallback configuration and deployment documentation.

### Local data model

WriteSpace has no backend, database, remote API, or remote persistence. The browser is the system of record through exactly these localStorage keys:

- `writespace_posts` stores the post array.
- `writespace_users` stores the user array.
- `writespace_session` stores the active session object.

Data remains local to the current browser and origin. It is not synchronized across devices, browsers, Vercel preview deployments, or production domains. Clearing browser storage permanently removes the locally stored data.

### Setup and verification

The release supports the following commands:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm start
```

The production build is emitted to `dist/`. Vercel deployment uses automatic Vite detection and the rewrite-only `vercel.json` configuration.

### Security notice

WriteSpace is a demonstration application and does not provide secure authentication or authorization.

- Passwords are stored as plaintext in browser localStorage.
- The built-in Admin credentials are `admin` / `admin`.
- Client-side sessions, roles, users, and posts can be modified by the browser owner.
- Browser storage is not encrypted, backed up, or protected from local inspection.
- Real passwords, credentials, secrets, or sensitive personal information must never be used.
- Client-side route guards and ownership checks are user-interface controls, not a security boundary.