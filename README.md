# WriteSpace

WriteSpace is a local, single-page blog MVP for writing, reading, and managing posts. It is built with React and Vite and stores all application data in the browser.

The project has no backend, database, remote API, external authentication provider, or remote persistence. It is intended for demonstration purposes only.

## Features

### Public experience

- Responsive landing page
- Product feature overview
- Preview of the three newest posts
- Guest login and registration actions
- Role-aware dashboard action for authenticated visitors

### Authentication

- Local username and password login
- Self-service user registration
- Built-in Admin account
- Role-aware redirects
- Protected authenticated routes
- Admin-only route guards
- Same-tab session refresh and cross-tab storage-event support

### Blog management

- Newest-first post index
- Full post reader
- Post creation
- Owner-aware post editing and deletion
- Admin access to edit and delete all posts
- Confirmation before destructive actions
- Preserved line breaks in post content
- Defensive not-found and storage-error states

### Administration

- Dashboard statistics
- Five newest posts with inline controls
- User account creation
- User and Admin role assignment
- Responsive account listing
- Confirmed account deletion
- Default Admin deletion protection
- Active-account self-deletion protection

### Accessibility and responsive design

- Semantic labels and buttons
- Visible keyboard focus rings
- Responsive mobile, tablet, and desktop layouts
- Mobile navigation menu
- Accessible avatar labels
- Reduced-motion support for landing-page decoration

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page and latest-post preview |
| `/login` | Guest | Login form; authenticated visitors redirect by role |
| `/register` | Guest | Registration form; authenticated visitors redirect by role |
| `/blogs` | Authenticated | Newest-first blog index |
| `/blog/:id` | Authenticated | Full post reader |
| `/write` | Authenticated | Create a post |
| `/edit/:id` | Authenticated owner or Admin | Edit an existing post |
| `/admin` | Admin | Administration dashboard |
| `/users` | Admin | User account management |

Unknown application routes redirect to `/`.

## Tech stack

- JavaScript with ES modules and JSX
- React 18
- React DOM 18
- React Router DOM 6
- Vite 5
- Tailwind CSS 3
- PostCSS and Autoprefixer
- PropTypes
- Vitest
- jsdom
- Testing Library
- Vercel static hosting

## Prerequisites

- Node.js 20
- npm

## Installation

Install the exact dependency tree recorded in `package-lock.json`:

```sh
npm ci
```

If no lockfile is available during initial setup, generate one with:

```sh
npm install
```

Commit the generated `package-lock.json` so local development and continuous integration use reproducible dependency versions.

## Development

Start the Vite development server:

```sh
npm run dev
```

Open the URL reported by Vite, typically:

```text
http://localhost:5173
```

Vite provides React Fast Refresh and hot module replacement during development.

## Testing

Run the complete test suite once:

```sh
npm test
```

Run tests in watch mode:

```sh
npm run test:watch
```

Tests use Vitest, jsdom, and Testing Library. They cover:

- Defensive localStorage reads and writes
- Authentication and authorization policies
- Session persistence and signaling
- Public landing and authentication workflows
- Protected and Admin-only route behavior
- Post creation, reading, editing, and deletion
- Admin statistics and recent-post controls
- User creation and deletion safeguards
- Responsive presentation contracts
- Validation, empty states, and storage failures

Tests do not make network requests.

## Production build

Create an optimized production build:

```sh
npm run build
```

Vite writes the generated static assets to `dist/`.

Preview the production build locally:

```sh
npm run preview
```

The `start` command is an alias for the production preview server:

```sh
npm start
```

## Usage

### Default Admin

Use the built-in demonstration account:

```text
Username: admin
Password: admin
```

The default Admin:

- Can access `/admin` and `/users`
- Can create posts
- Can edit or delete any post
- Can create local user and Admin accounts
- Cannot be deleted

### Regular users

A visitor can register at `/register`. A registered user:

- Is assigned the `user` role
- Is signed in automatically after successful registration
- Can browse all stored posts
- Can create posts
- Can edit and delete only posts they own

Usernames are case-sensitive and must be unique. The username `admin` is reserved.

### Creating and editing posts

Post forms require:

- A non-blank title of no more than 200 trimmed characters
- Non-blank content

Submitted title and content are preserved as entered. Whitespace-only submissions are rejected, and line breaks are preserved in the reader.

### Deleting records

Post and user deletion requires browser confirmation. Cancelling the confirmation does not change storage.

The following accounts cannot be deleted:

- The built-in default Admin
- The account associated with the active session

## Browser-local persistence

WriteSpace uses exactly three localStorage keys:

| Key | Value |
|---|---|
| `writespace_posts` | JSON array of posts |
| `writespace_users` | JSON array of stored accounts |
| `writespace_session` | JSON object representing the active session |

Storage reads and writes are handled defensively. Malformed or unavailable array storage produces an empty array, while malformed or unavailable session storage produces a signed-out state. Failed writes display an error and prevent success navigation.

### Post schema

```js
{
  id: 'UUID string',
  title: 'Post title',
  content: 'Post content',
  createdAt: 'ISO-8601 date-time string',
  authorId: 'Author account ID',
  authorName: 'Author display name',
}
```

Posts are displayed newest first using `createdAt`, with `id` used as a deterministic tie-breaker. Editing changes only `title` and `content`; original identity, author, and creation-time fields remain unchanged.

### Stored user schema

```js
{
  id: 'UUID string',
  displayName: 'Display name',
  username: 'Case-sensitive username',
  password: 'Plaintext demonstration password',
  role: 'admin or user',
  createdAt: 'ISO-8601 date-time string',
}
```

The built-in Admin is immutable and is not included in the `writespace_users` array.

### Session schema

```js
{
  userId: 'Account ID',
  username: 'Username',
  displayName: 'Display name',
  role: 'admin or user',
}
```

## Environment configuration

WriteSpace does not use environment variables.

Do not place passwords, credentials, session values, post content, browser data, or secrets in environment files. `.env.example` documents this contract.

## Project structure

```text
writespace/
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Avatar.jsx
│   │   ├── BlogCard.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── PublicNavbar.jsx
│   │   ├── StatCard.jsx
│   │   ├── UserRow.jsx
│   │   └── components.test.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── Home.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ReadBlog.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── UserManagement.jsx
│   │   ├── WriteBlog.jsx
│   │   ├── admin-workflows.test.jsx
│   │   ├── blog-workflows.test.jsx
│   │   └── public-auth.test.jsx
│   ├── test/
│   │   └── setup.js
│   ├── utils/
│   │   ├── auth.js
│   │   ├── auth.test.js
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   ├── storage.js
│   │   ├── storage.test.js
│   │   └── validation.js
│   ├── App.jsx
│   ├── App.test.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── vite.config.js
└── vitest.config.js
```

`App.jsx` owns the router and complete route map. `main.jsx` only mounts `App` inside React Strict Mode.

`src/index.css` contains only the required Tailwind directives. All application styling is expressed with Tailwind utility classes.

## Continuous integration

The GitHub Actions workflow runs on pull requests and pushes to `main`. It performs:

1. Repository checkout
2. Node.js 20 setup
3. Reproducible installation with `npm ci`
4. Source-constraint validation
5. Vitest execution
6. Production build

The constraint checks verify that:

- `vercel.json` contains only the required SPA rewrite
- `src/index.css` contains only the three Tailwind directives
- Prohibited source patterns are absent

## Vercel deployment

WriteSpace is deployed as a static Vite application.

1. Import the repository into Vercel.
2. Allow Vercel to detect Vite automatically.
3. Do not configure environment variables.
4. Deploy.

The project uses this rewrite-only Vercel configuration:

```json
{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

The rewrite allows direct requests and browser refreshes on client-side routes to load the Vite document before React Router resolves the route.

After deployment, directly open and refresh:

- `/`
- `/login`
- `/register`
- `/blogs`
- `/write`
- `/blog/<id>`
- `/edit/<id>`
- `/admin`
- `/users`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed verification, CI/CD, rollback, and operational guidance.

## Limitations

- There is no backend or remote database.
- Authentication is not secure.
- Authorization is enforced only in client-side code.
- Passwords are stored as plaintext.
- Data is scoped to the current browser origin.
- Data is not synchronized across devices, browsers, tabs, preview deployments, or production domains.
- Concurrent changes in multiple tabs may overwrite one another.
- Clearing browser storage permanently removes all local data.
- Private-browsing data may be removed when the browser session ends.
- Storage quotas and browser policies may prevent persistence.
- There is no backup, recovery, password reset, email verification, or account recovery.
- Rich text, uploads, tags, categories, comments, and likes are not supported.

## Privacy and security warning

WriteSpace is a demonstration architecture, not a security boundary.

Do not enter real passwords, credentials, secrets, sensitive personal information, or confidential content. Anyone with access to the browser profile can inspect or modify stored users, passwords, roles, sessions, and posts through browser developer tools.

No application data is intentionally transmitted to a server, but browser-local storage is not encrypted or protected from the browser owner. Client-side route guards and ownership checks provide user-interface behavior only and must not be used as production authorization.

## License

Private and proprietary.

Copyright © WriteSpace. All rights reserved. This source code may not be copied, modified, distributed, sublicensed, or used outside its authorized context without prior written permission.