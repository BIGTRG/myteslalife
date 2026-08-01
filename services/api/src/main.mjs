import { createPool, migrate } from '@mtl/db';
import { createApp } from './app.mjs';
import { sendMagicLinkEmail } from './mailer.mjs';

const pool = createPool();
await migrate(pool);
const port = Number(process.env.PORT ?? 8110);
createApp({ pool, sendEmail: sendMagicLinkEmail }).listen(port, () =>
  console.log(`[myteslalife api] listening :${port}`));
