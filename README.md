# DOLPHY — Project Onboard

A polished five-chapter project-intake experience with a private admin dashboard. Built with Next.js, React, TypeScript, Tailwind CSS and MySQL for deployment at `projectonboard.thedolphy.com`.

## Local preview

Requires Node.js 22 or newer.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run start
```

Open `http://localhost:3000` for the client intake and `http://localhost:3000/admin` for the dashboard. The locally configured admin login works, but form submissions remain disabled until `DATABASE_URL` points to MySQL.

## Project map

- `src/components/intake.tsx` — welcome, five chapters, review and success experience.
- `src/app/admin` — private login, lead dashboard and complete brief pages.
- `src/lib/storage.ts` — pooled MySQL connection, automatic table creation and submission queries.
- `src/lib/admin-auth.ts` — password verification and signed 12-hour HTTP-only sessions.
- `src/app/api/submit/route.ts` — validated, rate-limited client submission endpoint.
- `src/app/api/admin` — login and logout endpoints.
- `src/lib/config.ts` — editable intake choices and USD budget bands.
- `docs/DEPLOYMENT.md` — Hostinger MySQL, environment and subdomain instructions.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run start
# In another terminal:
npx.cmd playwright test
```

Tests cover server validation, database mapping, duplicate protection, credentials, signed sessions, cross-origin rejection, full desktop/mobile intake completion, draft recovery, admin access and logout.

## Security and data handling

Client drafts remain in their browser for up to seven days and are removed after confirmed submission. Submitted briefs are stored in the private Hostinger MySQL database. The dashboard is server-protected and excluded from indexing.

Admin credentials are configured only through environment variables. Passwords are verified with scrypt; plaintext is not stored in the repository or browser bundle. Authentication cookies are signed, HTTP-only, same-site strict, and secure on the production HTTPS domain. Login attempts are limited per process.

The submission endpoint validates all values, caps bodies at 24 KB, checks origin, uses a honeypot, limits attempts, and relies on a unique submission ID so normal retries do not duplicate a brief. On horizontally scaled hosting, process-local rate limits are not shared across instances.

The application creates its `project_submissions` table automatically when it first connects. Back up and restrict access to the MySQL database through Hostinger.
