import { color, font, DISCLAIMER } from './theme.js';
import Nav from './nav.js';

export const metadata = { title: 'myteslalife — mission control' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0, minHeight: '100vh', background: color.deep, color: color.text,
        fontFamily: `'${font.family}', system-ui, sans-serif`,
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px 60px' }}>
          <Nav />
          {children}
          <footer style={{ marginTop: 48, paddingTop: 16, borderTop: `1px solid ${color.line}`, color: color.muted, fontSize: 12, lineHeight: 1.5 }}>
            {DISCLAIMER}
          </footer>
        </div>
      </body>
    </html>
  );
}
