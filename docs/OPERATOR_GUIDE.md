# myteslalife — Operator Quick-Start

Live URLs
- App: https://myteslalife.com (Expo web; same code ships to iOS/Android via EAS)
- Admin: https://admin.myteslalife.com — sign in with an email listed in `ADMIN_EMAILS`
- API: https://api.myteslalife.com
- Legal: https://myteslalife.com/legal/terms · /legal/privacy

Admin console (mission control)
1. **Dashboard** — north star (weekly active cars) + 7-day funnel (visits → waitlist → signups → cars → posts).
2. **Moderation** — open reports queue. Actions: hide / remove / keep post, then resolve the report (actioned or dismissed). Everything is audit-logged.
3. **Members** — look up any member by email; see cars, posts, sessions.
4. **Approvals** — T2 agent approval packets. Each packet is decide-once: approve or reject with a note.

Operations
- Stack lives on fleet #1 (`/home/viktor/myteslalife/deploy`, Docker Compose: `mtl-postgres`, `mtl-api` :8110, `mtl-admin` :8111, `mtl-web` :8112, all localhost-bound behind nginx + Let's Encrypt).
- Config: `deploy/.env` on the server (Postgres password, SMTP creds, `ADMIN_EMAILS`, `MAIL_FROM`). To add an admin: append the email to `ADMIN_EMAILS`, then `docker compose up -d api`.
- Magic-link email is sent from Genius Eye Mail (`mtlmailer@geniuseye.ai`). Links expire in 15 minutes, single use.
- Deploy an update: push to `main` (github.com/BIGTRG/myteslalife), then on the server: pull/ship files, `TMPDIR=/home/viktor/tmp docker compose build && docker compose up -d`.
- E2E check after any deploy: `node tools/e2e_prod.mjs` (20 checks incl. real email delivery).

Data + compliance
- Members can delete their account in-app (Settings → Delete). Email is anonymized so they can re-register.
- Never sell or share telemetry (locked posture). FTC affiliate disclosure is rendered on every marketplace surface. Tesla non-affiliation disclaimer on sign-in, car profiles, and legal pages.
