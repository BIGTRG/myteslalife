import { DISCLAIMER, color, font } from '@mtl/tokens';

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — myteslalife</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>body{background:${color.deep};color:${color.text};font-family:'${font.family}',sans-serif;max-width:760px;margin:0 auto;padding:48px 24px;line-height:1.65}
h1{font-weight:700}h2{color:${color.spark};font-size:1.1rem;margin-top:2em}a{color:${color.brand}}
.muted{color:${color.muted};font-size:.9rem}</style></head><body>
<h1>${title}</h1>${body}
<hr style="border-color:${color.line};margin-top:3em"><p class="muted">${DISCLAIMER}</p></body></html>`;

export const tosHtml = () => page('Terms of Service', `
<p class="muted">Effective July 31, 2026 · myteslalife.com, operated by TRG Tech Link</p>
<h2>1. The service</h2><p>myteslalife is an independent community platform for Tesla owners: car profiles, a community feed, clubs, a charging directory, and a marketplace of curated third-party products. We are not affiliated with Tesla, Inc.</p>
<h2>2. Eligibility & accounts</h2><p>You must be 13 or older. You are responsible for your account; sign-in is via emailed magic link or Apple/Google. You can delete your account at any time in the app (Settings → Delete account), which removes your profile and revokes all sessions.</p>
<h2>3. Your content</h2><p>You own what you post and grant us a license to display it within the service. No unlawful, infringing, or deceptive content. We may moderate, hide, or remove content and accounts that violate these terms.</p>
<h2>4. Marketplace</h2><p>Marketplace links are affiliate links to third-party sellers; <strong>myteslalife earns a commission</strong> on marked links. Products are sold by third parties under their terms. We are not the seller of record for affiliate products.</p>
<h2>5. Vehicle data</h2><p>Phase 1 uses only information you enter manually. If you later connect vehicle telemetry, it is used solely to power your own features per the Privacy Policy, with granular consent. We never sell your telemetry or precise location.</p>
<h2>6. No advice</h2><p>Battery statistics, valuations, tax figures, and earnings estimates shown in the app are informational estimates only — not financial, tax, or professional advice.</p>
<h2>7. Disclaimers & liability</h2><p>The service is provided "as is". To the maximum extent permitted by law, our liability is limited to the amount you paid us in the 12 months before a claim.</p>
<h2>8. Disputes</h2><p>North Carolina law governs. Contact admin@trgtechlink.com first; most issues are resolved quickly.</p>
<h2>9. Changes</h2><p>We will notify you of material changes in-app or by email; continued use is acceptance.</p>`);

export const privacyHtml = () => page('Privacy Policy', `
<p class="muted">Effective July 31, 2026 · myteslalife.com, operated by TRG Tech Link</p>
<h2>What we collect</h2><p><strong>Phase 1 (now):</strong> your email, name, car details you enter manually (model, year, mileage, nickname, photos), posts, follows, club memberships, and product-link clicks. <strong>Later (with separate opt-in consent):</strong> vehicle telemetry via Tesla's official Fleet API — battery, charging, and location — each behind its own toggle.</p>
<h2>How we use it</h2><p>To run your garage, feed, clubs, and marketplace features; to compute aggregated, de-identified community statistics; and to send service email (magic links, notifications you enable). Purpose limitation applies: data collected for a feature is not reused for unrelated purposes without new consent.</p>
<h2>What we never do</h2><p><strong>We never sell your personal information, telemetry, or precise location.</strong> Partner and research products use aggregated, de-identified fleet statistics only.</p>
<h2>Sharing</h2><p>Service providers under contract (hosting, email, payments), and third-party sellers only when you click out to their stores. Affiliate links are disclosed inline.</p>
<h2>Your rights</h2><p>Access, correct, download, or delete your data anytime: in-app or via privacy@myteslalife.com. California residents: we honor CCPA rights including the right to limit use of sensitive personal information (precise geolocation). We honor applicable state privacy laws (VA, CO, CT, TX, and others).</p>
<h2>Retention & security</h2><p>Data is kept while your account is active and deleted on account closure (backups purge within 35 days). Transport encryption everywhere; tokens stored hashed.</p>
<h2>Children</h2><p>The service is not directed to children under 13.</p>
<h2>Contact</h2><p>TRG Tech Link · privacy@myteslalife.com · admin@trgtechlink.com</p>`);
