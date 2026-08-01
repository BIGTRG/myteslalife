// Minimal SMTP client (STARTTLS + AUTH LOGIN) — no external deps.
// Config: SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, MAIL_FROM.
import { createConnection } from 'node:net';
import { connect as tlsConnect } from 'node:tls';

export function createTransport(cfg = {}) {
  const host = cfg.host ?? process.env.SMTP_HOST;
  const port = Number(cfg.port ?? process.env.SMTP_PORT ?? 587);
  const user = cfg.user ?? process.env.SMTP_USER;
  const pass = cfg.pass ?? process.env.SMTP_PASS;
  const from = cfg.from ?? process.env.MAIL_FROM ?? 'myteslalife <no-reply@myteslalife.com>';

  async function send({ to, subject, text }) {
    let sock = createConnection({ host, port });
    const read = () => new Promise((resolve, reject) => {
      let buf = '';
      const onData = (d) => {
        buf += d.toString();
        // complete when last line is "NNN " (space after code)
        if (/^\d{3} [^\n]*\r?\n$/m.test(buf.split(/\r?\n/).filter(Boolean).pop() + '\n')) {
          sock.off('data', onData); resolve(buf);
        }
      };
      sock.on('data', onData);
      sock.once('error', reject);
      setTimeout(() => reject(new Error('smtp timeout')), 15000);
    });
    const cmd = async (c) => { if (c !== null) sock.write(c + '\r\n'); const r = await read(); 
      const code = Number(r.slice(0,3)); if (code >= 400) throw new Error(`smtp ${c?.split(' ')[0] ?? 'banner'}: ${r.trim()}`); return r; };

    await cmd(null); // banner
    await cmd('EHLO myteslalife.com');
    await cmd('STARTTLS');
    sock = tlsConnect({ socket: sock, servername: host });
    await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); });
    await cmd('EHLO myteslalife.com');
    await cmd('AUTH LOGIN');
    await cmd(Buffer.from(user).toString('base64'));
    await cmd(Buffer.from(pass).toString('base64'));
    await cmd(`MAIL FROM:<${from.match(/<(.+)>/)?.[1] ?? from}>`);
    await cmd(`RCPT TO:<${to}>`);
    await cmd('DATA');
    const msg = [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, 'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8', '', text.replace(/^\./gm, '..'), '.'].join('\r\n');
    await cmd(msg);
    await cmd('QUIT').catch(() => {});
    sock.end();
  }
  return { send };
}
