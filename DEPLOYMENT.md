# WriteSpace Deployment Guide

WriteSpace is a static Vite application deployed to Vercel. It has no backend, database, server-side authentication, or remote persistence.

## Prerequisites

- Node.js 20
- npm
- A Vercel account for hosted deployments

## Local development

Install dependencies and start the Vite development server:

```sh
npm ci
npm run dev
```

Open the URL reported by Vite, typically `http://localhost:5173`.

## Production verification

Run the same checks expected by continuous integration:

```sh
npm ci
npm test
npm run build
```

The production output is generated in `dist/`.

Preview the production build locally:

```sh
npm run preview
```

The `start` script is an alias for the production preview command:

```sh
npm start
```

Before deployment, verify that:

- The landing page loads.
- Registration and login work.
- The default Admin can log in with the demo credentials.
- Authenticated users can create, read, edit, and delete their own posts.
- Admin routes are unavailable to regular users.
- The production build completes without errors.

## Environment variables

WriteSpace does not read or require environment variables.

Do not add credentials, passwords, session values, post content, user data, or other browser data to Vercel environment variables or local environment files. Authentication in this MVP is intentionally local and is not a security boundary.

The `.env.example` file documents this no-environment-variable contract.

## Vercel deployment

1. Push the repository to the connected source-control provider.
2. In Vercel, select **Add New Project**.
3. Import the WriteSpace repository.
4. Allow Vercel to detect the Vite framework settings.
5. Do not configure environment variables.
6. Deploy the project.

Do not add custom `builds`, `buildCommand`, `outputDirectory`, `installCommand`, or `framework` fields to `vercel.json`. Vercel should use its automatic Vite detection.

## SPA route fallback

The repository includes a rewrite-only `vercel.json`:

```json
{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

This rewrite serves the Vite entry document for every incoming path. React Router then resolves the client-side route. It allows direct navigation and browser refreshes on routes such as `/blogs`, `/blog/:id`, and `/admin` without returning a Vercel 404 response.

## Direct-route smoke tests

After deploying to a Vercel preview or production URL, open each route directly in a new browser tab:

| Route | Expected result |
|---|---|
| `/` | Public landing page |
| `/login` | Login page when signed out |
| `/register` | Registration page when signed out |
| `/blogs` | Login redirect when signed out; blog index when signed in |
| `/write` | Login redirect when signed out; writing form when signed in |
| `/blog/<id>` | Login redirect when signed out; reader or `Post not found` when signed in |
| `/edit/<id>` | Login redirect when signed out; editor, blog redirect, or not-found state when signed in |
| `/admin` | Login redirect for guests, `/blogs` redirect for regular users, dashboard for Admin |
| `/users` | Login redirect for guests, `/blogs` redirect for regular users, account management for Admin |
| `/unknown-route` | Public landing page |

Refresh each direct route to verify that the Vercel rewrite continues to serve the application.

Also verify these browser-local scenarios:

1. Clear site storage and reload the landing page.
2. Place malformed JSON in each WriteSpace localStorage key and confirm the application renders safe empty or signed-out states.
3. Deny or disable storage access, where supported, and confirm save failures remain visible without unintended navigation.
4. Cancel post and user deletion confirmation dialogs and confirm no records are removed.

## Continuous integration and delivery

The workflow at `.github/workflows/ci.yml` runs for pull requests and pushes to `main`. It performs:

1. Repository checkout.
2. Node.js 20 setup with npm caching.
3. Reproducible dependency installation using `npm ci`.
4. Source-constraint validation.
5. The Vitest test suite.
6. A production Vite build.

The source-constraint check verifies:

- `vercel.json` contains only the required SPA rewrite.
- `src/index.css` contains only the three Tailwind directives.
- Prohibited source patterns are absent.

Configure Vercel's Git integration to create preview deployments for pull requests and a production deployment from the protected `main` branch. Require the CI workflow to pass before merging.

## Rollback

Vercel retains previous deployments. To roll back:

1. Open the project in the Vercel dashboard.
2. Select **Deployments**.
3. Locate the last verified deployment.
4. Open its actions menu.
5. promote or redeploy that deployment to production.
6. Repeat the direct-route smoke tests.

A source rollback can also be performed by reverting the faulty commit and pushing the revert to `main`.

Rolling back application code does not roll back browser-local data. If a release changes a localStorage schema, backward compatibility or a versioned migration must be included before deployment.

## Browser-local data limitations

WriteSpace stores all application data in the current browser origin under these keys:

- `writespace_posts`
- `writespace_users`
- `writespace_session`

Operational implications:

- Data is not shared across browsers, devices, domains, or Vercel preview URLs.
- Preview and production deployments use different origins and therefore different storage.
- Clearing browser data permanently removes local posts, users, and sessions.
- Private browsing may remove data when the browsing session ends.
- Storage quotas and browser security policies may prevent writes.
- There is no server backup, restore process, replication, or cross-tab transaction protection.
- Deployments do not upload, migrate, or preserve browser-local records.
- Client-side roles and plaintext demo passwords can be modified by the browser owner.
- Real credentials and sensitive personal information must never be entered.

WriteSpace is a demonstration application. Its local authentication and authorization controls must not be treated as production security.