# Auth Test Checklist

Manual smoke test for the Clerk auth flow. Walk through this before deploying changes that touch auth, middleware, or `getAuthUser()`. Takes ~10 min.

Run in an **incognito window** so cached Clerk client state doesn't hide bugs.

## Setup

- [ ] DevTools → Console open the whole time. Any red error = investigate.
- [ ] DevTools → Network → check no requests are `blocked:csp` after page load.
- [ ] Have test accounts ready for each role:
  - Business owner: `daniel@boadtech.com`
  - Admin: (whichever DB user has `role = 'ADMIN'`)
  - Partner: (whichever DB user has `role = 'PARTNER'`)
  - Staff: (whichever DB user has `role = 'STAFF'`)

---

## 1. Public pages (unauthenticated)

- [ ] `/` loads, Navbar shows **Войти / Регистрация** buttons (no loading circle stuck).
- [ ] `/products`, `/pricing`, `/about`, `/blog` all load.
- [ ] `/login`, `/register`, `/forgot-password` all load.
- [ ] Visiting `/dashboard` redirects to `/login`.
- [ ] Visiting `/admin` redirects to `/login`.

## 2. Login — happy path (existing migrated user)

- [ ] Go to `/login`, enter email + correct password, click **Войти**.
- [ ] Lands on `/dashboard` **on the first try** (no manual refresh needed).
- [ ] Navbar now shows the user avatar/profile button.
- [ ] **Check DB:** `SELECT "clerkId" FROM users WHERE email = '...'` — should now be populated (self-healed on first request).

## 3. Login — error states

- [ ] Wrong password → red error contains a clickable **Сбросьте пароль** link going to `/forgot-password`.
- [ ] Non-existent email → "Пользователь с таким email не найден."
- [ ] Pwned password (`123456` or similar) → reset-password link in error.
- [ ] If `needs_second_factor` triggers → code entry screen appears, code from email works.

## 4. Registration

- [ ] `/register` → fill all fields, accept terms, submit.
- [ ] Either lands on `/dashboard` directly, OR shows "check your email" screen if email verification enforced.
- [ ] Duplicate email → "Пользователь с таким email уже зарегистрирован."

## 5. Forgot password / reset

- [ ] `/forgot-password` → enter email → "check your email" confirmation.
- [ ] Email arrives within ~1 min with a 6-digit code.
- [ ] `/reset-password` → enter code + new password (8+ chars, not breached) → success → redirects to dashboard, signed in.
- [ ] Old password no longer works on `/login`.

## 6. Role-based access — Business owner

Signed in as a `BUSINESS_OWNER`:
- [ ] `/dashboard` loads with full sidebar (Обзор, Плеер, Анонсы, etc.).
- [ ] Can navigate to all dashboard subpages without redirects.
- [ ] `/admin` → redirects to `/dashboard` (not allowed).
- [ ] `/dashboard/affiliate` accessible (visible to non-partners too).

## 7. Role-based access — Admin

Signed in as `ADMIN` (requires `metadata.role = "ADMIN"` in Clerk publicMetadata AND session token claim wired up):
- [ ] `/admin` loads.
- [ ] Admin sidebar appears.
- [ ] `/admin/content`, `/admin/users`, etc. all accessible.
- [ ] No silent redirects to `/dashboard`.

## 8. Role-based access — Partner

Signed in as `PARTNER`:
- [ ] Lands on `/dashboard/affiliate`, not `/dashboard`.
- [ ] Sidebar shows only: Кабинет партнёра, Мои лиды, Мои скрипты, Гайды.
- [ ] `/dashboard` (overview) → redirects to `/dashboard/affiliate`.
- [ ] `/dashboard/player`, `/dashboard/subscription` → redirect to `/dashboard/affiliate`.
- [ ] `/admin` → redirects to `/dashboard` → then to `/dashboard/affiliate`.

## 9. Role-based access — Staff (branch manager)

Signed in as `STAFF`:
- [ ] Lands on `/dashboard/player`.
- [ ] Can access `/dashboard/announcements`.
- [ ] `/dashboard` (overview) → redirects to `/dashboard/player`.
- [ ] `/dashboard/subscription`, `/dashboard/branches` → redirected away.

## 10. Sign out

- [ ] Click sign-out button (Navbar or sidebar).
- [ ] Lands on `/`.
- [ ] Navbar shows Войти/Регистрация again.
- [ ] Visiting `/dashboard` redirects to `/login`.
- [ ] Browser cookies `__session`, `__client_uat` should be cleared.

## 11. Webhook (production only — skip locally)

After creating a brand-new user in production via Clerk dashboard:
- [ ] Within ~5 sec, a row appears in the `users` table with the new `clerkId`.
- [ ] Clerk Dashboard → Webhooks → endpoint shows the event with `200 OK`.

Deleting a user in Clerk:
- [ ] The DB row's `clerkId` is cleared (but row is kept — historical data preserved).

## 12. Server actions still work

Run one action of each type while signed in to confirm `getAuthUser()` resolves correctly:
- [ ] Create something (e.g. add an announcement) → success.
- [ ] Read something (load a page that does a server-side DB fetch).
- [ ] Update something (edit a profile field).
- [ ] An admin-only action while signed in as non-admin → "Forbidden" error, no crash.

---

## Red flags during testing

If you see any of these, **don't deploy**:

- `blocked:csp` in Network for any internal asset
- Console error referencing `clerk.accounts.dev` or `*.clerk.bizmuzik.ru` failing to load
- Loading circle in Navbar never resolves
- "needs additional verification" / `needs_second_factor` with no UI to handle it
- Dashboard loads but data is empty/error (likely `getAuthUser()` returning null)
- Admin user can't reach `/admin` (session token claim not configured)
- Anyone can reach `/admin` regardless of role (middleware broken)
