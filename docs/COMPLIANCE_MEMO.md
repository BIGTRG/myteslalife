# myteslalife — Compliance Pre-Check Memo (v1, Jul 31 2026)
Prepared per TRG standing directive (deon_compliance_precheck). Verify currency quarterly; re-run at launch via deon_app_launch_checklist.

## 1. Tesla trademark & the name "myteslalife" — HIGHEST STRUCTURAL RISK
- TESLA is a registered mark (USPTO Reg. 4443472 et al., in use since 2003) covering vehicles, parts/accessories, **toys, and lifestyle goods**.
- Tesla actively enforces against domains incorporating "tesla": WIPO D2025-1306 (bulk UDRP win, 2025); NAF case vs. `teslaunch.net` (accessory seller — mark + extra letters = confusingly similar). Passive holding still counted as bad faith.
- Our exposure is higher than a pure fan site because the platform is **commercial** (subscriptions, 12% marketplace commission, private-label "Essentials"). The Essentials private label is the sharpest edge: selling branded physical goods to Tesla owners under a tesla-containing brand overlaps Tesla's own accessory/lifestyle classes.
- Mitigations (mostly already in the Master Brief — keep them non-negotiable):
  1. Non-affiliation disclaimer on every public surface (brief §4 line — verbatim, footer + app store listings).
  2. Never use Tesla's stylized T, product photos as brand assets, or "Tesla" alone as the brand; wordmark stays one-word lowercase.
  3. Nominative fair use posture: we reference Tesla only to describe compatibility/community, never sponsorship.
  4. "myteslalife Essentials" products must never carry Tesla marks; consider branding Essentials under the wheel mark only.
  5. Own a fallback domain now (e.g., mytl.app or similar) so a UDRP loss is a rebrand of the domain, not the company. Cheap insurance.
  6. Document this position (this memo) — good-faith evidence if challenged.
- Bottom line: proceed-with-eyes-open. This is a business-risk acceptance decision for Deon (T3), not a build blocker for Phase 1.

## 2. Tesla Fleet API / Fleet Telemetry terms (Phase 2 gate)
- All usage must comply with the Fleet API Agreement; Tesla bans violating accounts **without notice** — a ban kills Pillars 1/2/5 overnight. Treat ToS compliance as an SLO.
- Virtual-key model requires owner-in-the-loop pairing; request **minimum scopes** (vehicle_device_data, vehicle_location only with explicit member consent; vehicle_cmds only for Controls users).
- Telemetry data belongs to the member: no resale, no sharing beyond the member's own features (see §5 — GM precedent). Robotaxi owner-fleet program is announced but NOT open — Earnings screen stays a "coming soon" state; no revenue claims.
- 2020-and-older S/X unsupported for streaming — support flows must say so honestly (already in 07 charter).

## 3. Charge Pass™ wallet — MONEY TRANSMITTER TERRITORY (T3, correctly gated)
- 49 states + DC license money transmission (Montana the lone exception); most now follow the Money Transmission Modernization Act model. Licensing attaches **where the customer is**, not where TRG is incorporated. NMLS applications, per-state bonds, BSA/AML program as a federal MSB.
- "One balance, every network" = a reloadable balance redeemable with **third parties** (ChargePoint, EVgo, EA...) → open-loop stored value → classic licensing trigger. Closed-loop (redeemable only with us) is often exempt, but that defeats the product.
- Lawful paths when ready: (a) partner with a licensed program manager / BaaS sponsor that holds the licenses and the float; (b) structure as pass-through payment with a licensed processor, no held balance; (c) full MTL buildout (slow, expensive — not year 1).
- **Decision: no money-holding feature ships in Phase 1 or 2.** The brief's T3 gate is correct. Same analysis as Escrow Brands (MTL/NMLS).

## 4. Marketplace & commerce
- **FTC Endorsement Guides (16 CFR Part 255):** material connections must be disclosed clearly and conspicuously. Every affiliate link, commissioned quote, and sponsored placement gets an inline "myteslalife earns a commission" disclosure — the Copilot charter already mandates this; extend it to Feed mod-lists and Marketplace UI from day 1 (build it into the component, not editorial habit).
- **AI-generated content:** CarSoul posts and Copilot suggestions are still "advertising" when they push products — same disclosure rules apply; no fabricated experiences/reviews (also brief Honesty Rule 3).
- **INFORM Consumers Act:** once vendor storefronts/classifieds host high-volume third-party sellers (200+ transactions AND $5k+/yr), we must collect/verify seller identity and display seller contact info. Design vendor onboarding to capture this from the start.
- **Marketplace facilitator sales tax:** most states make the marketplace collect/remit sales tax on facilitated sales once nexus thresholds hit. Use Stripe Tax (or similar) when checkout ships; classifieds P2P is different from facilitated storefront sales — get this classified before the storefront (not affiliate) phase.
- **1099-K / payouts:** vendor and affiliate payouts through Stripe Connect keep tax reporting on Stripe's rails; aligns with the two-agent finance rule.
- Tesla has NO affiliate program and NO resellers (brief §8) — never imply otherwise in commerce copy.

## 5. Telemetry & member data privacy — ACTIVE ENFORCEMENT AREA
- Regulators are specifically targeting connected-car data. CCPA enforcement: **GM/OnStar $12.75M** (May 2026 — sold driver behavior + precise geolocation to brokers; purpose limitation treated as substantive, not a disclosure checkbox), **Honda $650k** (first CPPA settlement), Ford. California AG + CPPA run a dedicated connected-vehicle initiative.
- Rules for us (bake into schema + policies before Phase 2 telemetry):
  1. **Never sell member telemetry or precise location. Period.** "Data & Partners" revenue (Oracle API, lead-gen) must use aggregated/de-identified fleet stats only, with a documented de-identification standard.
  2. Purpose limitation: telemetry is collected to power the member's own features. Any new use (e.g., valuations product) needs its own consent.
  3. Granular consent at onboarding: separate toggles for telemetry ingestion, location precision (exact/city/hidden — already in CarSoul charter), public profile visibility, benchmarking participation.
  4. Data minimization + retention schedule; deletion on account close; DSAR (access/delete/correct) flow — CA/CO/VA/CT/TX etc. state privacy laws all in scope at our member counts.
  5. Precise geolocation = "sensitive personal information" under CCPA — limit-use right must be honored.
- Privacy Policy + ToS ship WITH Phase 1 (per Deon's standing rule), covering: manual profile data now, telemetry later (versioned update), marketplace transactions, AI agents acting on member data, children (13+ only), arbitration/venue.

## 6. Outreach & growth agents
- **Community Scout / Growth:** platform ToS are law (brief Honesty Rule 2); no fake accounts/astroturfing (Rule 3) — also FTC-relevant (fake reviews rule). T2 human approval on external posts already required — keep it.
- **Lifecycle Mailer:** CAN-SPAM (identity, physical address, working unsubscribe); TCPA if SMS ever added (express written consent, opt-out). Send from Genius Eye Mail infra.
- Referral/waitlist promos: no deceptive "earnings" claims, especially around future robotaxi income — FTC treats unsubstantiated earnings claims harshly. Never project robotaxi revenue to members until the program exists.

## 7. Misc
- Earnings screen tax tiles: label "estimate — not tax advice."
- App Store / Play: Apple 4.2/5.1 (data collection disclosure, account deletion in-app required); Google Data Safety form must match the privacy policy.
- Charging data: NREL/AFDC is public-domain US-gov data (attribution good practice); Open Charge Map is CC-BY-SA-ish licensed — check current OCM license terms before caching/redistributing at scale.

## Open items for Deon (T3 decisions)
1. Accept and document the trademark risk posture; approve buying a fallback domain.
2. Confirm: no data sales, aggregated-only Oracle/partner products (locks §5.1 into the brief).
3. Charge Pass: park until a licensed-partner path is chosen (recommend program-manager partnership when the time comes).
4. Essentials private label branding: wheel mark only, no "tesla" on physical goods — confirm.
