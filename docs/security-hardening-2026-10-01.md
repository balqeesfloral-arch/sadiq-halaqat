# Security hardening — 2026-10-01

Disabled or unverified staff accounts are denied by database helpers and privileged RPCs. Membership writes cannot claim students from another mosque by ID. Record writes must reference a real student/halaqa relationship, including preserved historical memberships. Only scoped supervisors or administrators approve monthly plans; teacher edits invalidate an existing approval.

Students sign in with their existing number and a separate eight-digit code. Teachers and supervisors retrieve the card from the student's page, or copy a private login link. The link uses a URL fragment, which the login page removes immediately. Codes are never stored in remembered accounts. Cards can be rotated without changing the student's number or disrupting current sessions. Student creation generates a card automatically. Rate counters are atomic and keyed with HMAC digests, not raw IP addresses or names.

Staff registration requires email confirmation and a password of at least twelve characters. Registration, login and the public support form have server-side quotas. Public support writes are restricted to the Edge handler. Web Push subscriptions keep their original account owner; shared devices create a new subscription. Both the RPC and sending workers restrict endpoints to recognized HTTPS push providers. Notification destinations remain inside the application.

## Validation

- `scripts/verify-security-boundaries.sql`: transaction rollback checks for account status, email confirmation, mosque isolation, record attribution, plan approval, card access/rotation, push ownership/destinations and quotas.
- `scripts/verify-adaptive-learning.sql`: 21 isolated learning regression cases, including mid-month enrollment/resume and independent revision cycles.
- `npm run security:edge`: checks all deployed Edge sources and runs eleven security tests, with a mocked backend and no emails or real notifications.
- `npm run security:ui`: verifies two-field student login, fragment-only links, removal of credentials from browser storage, missing-code rejection and card rotation.
- `npm run security:check`: source scan, Edge/UI tests, lint, build, CSP hash verification and production artifact scan.
- Production dependencies: DOMPurify patched; `npm audit --omit=dev` has no findings at verification time.

The security workflow now fails on high/critical Sentinel or dependency findings, Semgrep errors and high/critical Trivy findings. Branch protection must still be configured by a repository administrator to require those checks before changes reach `main`.

## Deployment and operational controls

Apply `20261001053723_enforce_security_boundaries.sql`, deploy the eight Edge handlers with `_shared/security.ts`, then publish the frontend. Authenticated handlers retain JWT verification; public signup/login/support and secret-authenticated push handlers retain their explicit authentication models. Never deploy test files as function entrypoints.

The migration filename matches the version assigned by the production migration API. The migration and all eight handlers are applied, and Vercel has published the frontend. Seventeen database security checks and twenty-one learning checks passed against production with their fixture changes rolled back. Bounded HTTP checks confirmed authentication failures, support RPC restrictions and login throttling. GitHub's core audit, CodeQL, Semgrep and Trivy jobs passed.

Keep the stricter database boundaries and login code requirement during incident recovery. Rolling the frontend back to a release without code entry prevents fresh student login; fix forward instead of restoring weak name/number authentication.

Control-plane follow-ups require account-owner access: managed Postgres patch upgrade, leaked-password protection where available, administrator MFA enrollment/enforcement, GitHub branch protection, and Vercel firewall/protection review. Current integration permissions do not provide those settings. Email confirmation is enabled in the live Auth configuration; email delivery must use a production SMTP configuration. Validation did not send verification emails to real users.

These controls address the application findings. They do not constitute a guarantee against every security threat.
