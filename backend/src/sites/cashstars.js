import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { humanClick, humanType } from '../behavior.js';
import { fetchLatestOTP } from '../emailOTP.js';

const BASE_URL = 'https://www.cashstars.com';

async function promptOTP(hint = 'OTP kodunu girin: ') {
  const rl = readline.createInterface({ input, output });
  try {
    const code = await rl.question(hint);
    return code.trim();
  } finally {
    rl.close();
  }
}

export async function gotoTasks(page) {
  const link = page.locator('a:has-text("Tasks"), a:has-text("Offers"), a:has-text("Earn")').first();
  if (await link.isVisible().catch(() => false)) {
    await humanClick(page, link);
  } else {
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  }
}

export async function login(page, { email, password, imapConfig = null }) {
  if (!email || !password) {
    console.warn('CASHSTARS_EMAIL ve CASHSTARS_PASSWORD ortam değişkenlerini ayarlayın.');
    return;
  }

  // Zaten girişliyse geç
  if (await page.locator('text=Dashboard, text=Logout').first().isVisible().catch(() => false)) {
    return;
  }

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' }).catch(() => {});

  const emailSel = page.locator('input[type="email"], input[name*="email" i]').first();
  const passSel = page.locator('input[type="password"], input[name*="password" i]').first();
  const submitSel = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first();

  if (await emailSel.isVisible().catch(() => false)) {
    await emailSel.fill('');
    await humanType(emailSel, email);
  }
  if (await passSel.isVisible().catch(() => false)) {
    await passSel.fill('');
    await humanType(passSel, password);
  }
  if (await submitSel.isVisible().catch(() => false)) {
    await humanClick(page, submitSel);
  }

  await page.waitForLoadState('domcontentloaded');

  // OTP alanı varsa e-posta veya kullanıcıdan al
  const otpField = page.locator('input[autocomplete="one-time-code"], input[name*="otp" i]').first();
  if (await otpField.isVisible().catch(() => false)) {
    let otp = process.env.CASHSTARS_OTP;
    if (!otp && imapConfig?.user && imapConfig?.pass) {
      console.log('E-posta OTP bekleniyor...');
      otp = await fetchLatestOTP(imapConfig, { maxWaitSec: 60, fromDomain: 'cashstars' });
    }
    if (!otp) {
      otp = await promptOTP();
    }
    await otpField.fill(otp);
    const verifyBtn = page.locator('button:has-text("Verify"), button:has-text("Continue")').first();
    if (await verifyBtn.isVisible().catch(() => false)) {
      await humanClick(page, verifyBtn);
    }
    await page.waitForLoadState('domcontentloaded');
  }
}
