// Magic-link mail via Genius Eye Mail SMTP (nodemailer-free: raw SMTP over TLS is overkill here;
// we shell out to the platform's sendmail-compatible relay in prod, log in dev).
import { createTransport } from './smtp.mjs';

const APP_URL = process.env.APP_URL ?? 'https://myteslalife.com';

export async function sendMagicLinkEmail(email, token) {
  const link = `${APP_URL}/auth?token=${token}`;
  const subject = 'Your myteslalife sign-in link';
  const text = `Tap to sign in to myteslalife: ${link}\n\nThis link expires in 15 minutes. If you didn't request it, ignore this email.\n\nmyteslalife is an independent owner community and is not affiliated with Tesla, Inc.`;
  if (!process.env.SMTP_HOST) { console.log(`[mail:dev] to=${email} link=${link}`); return; }
  await createTransport().send({ to: email, subject, text });
}
