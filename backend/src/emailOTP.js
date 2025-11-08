import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export async function fetchLatestOTP(imapConfig, { maxWaitSec = 60, fromDomain = null } = {}) {
  const client = new ImapFlow({
    host: imapConfig.host || 'imap.gmail.com',
    port: imapConfig.port || 993,
    secure: true,
    auth: {
      user: imapConfig.user,
      pass: imapConfig.pass,
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.mailboxOpen('INBOX');

    const start = Date.now();
    while ((Date.now() - start) / 1000 < maxWaitSec) {
      const messages = await client.search({ since: new Date(Date.now() - 5 * 60 * 1000) }, { uid: true });
      if (!messages.length) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      // En yeni mesajı kontrol et
      const latest = messages[messages.length - 1];
      const msg = await client.fetchOne(String(latest), { source: true });
      const parsed = await simpleParser(msg.source);

      if (fromDomain && !parsed.from?.text?.includes(fromDomain)) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      const body = parsed.text || parsed.html || '';
      const otpMatch = body.match(/\b(\d{4,8})\b/);
      if (otpMatch) {
        await client.logout();
        return otpMatch[1];
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    await client.logout();
    return null;
  } catch (err) {
    console.warn('Email OTP hatası:', err?.message || err);
    await client.logout().catch(() => {});
    return null;
  }
}
