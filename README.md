# myteslalife

Every car has a life. This is where it lives. — myteslalife.com

Independent Tesla-owner community platform: Garage, Community, Marketplace, Charging Hub, and an AI layer (CarSoul™, Member Copilot). Not affiliated with Tesla, Inc.

## Layout
- `packages/tokens` — design tokens (single source of truth; zero hardcoded colors elsewhere)
- `packages/db` — Postgres migrations + client (migrator, audit log, tracking events)
- `services/api` — REST API v1 (node:http custom router, magic-link auth, rate-limited)
- `apps/admin` — Next.js admin (moderation queue, member lookup, metrics)
- `apps/mobile` — React Native / Expo app (8 screens per approved mockup)
- `docs/` — approved mockups + compliance memo (read before changing scope)

## Run
```bash
npm install
npm test                      # embedded Postgres; no root, no daemon needed
DATABASE_URL=... node services/api/src/main.mjs
```

## Compliance (see docs/COMPLIANCE_MEMO.md)
- Tesla non-affiliation disclaimer on every public surface (from `@mtl/tokens`)
- Affiliate links always carry "myteslalife earns a commission" disclosure
- No telemetry in Phase 1; no data sales ever; Charge Pass wallet gated (money transmitter)
- ToS + Privacy served at `/legal/terms`, `/legal/privacy`
