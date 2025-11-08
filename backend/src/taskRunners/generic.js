import { humanClick, humanPauseToRead, humanScrollRead } from '../behavior.js';
import { sleep, jitter } from '../utils.js';

export async function runGenericTask(page, task) {
  const card = task.locator;

  // Kart içindeki "Start/Open/Go" butonlarını dene
  const openBtn = card.locator(
    'a:has-text("Start"), a:has-text("Open"), a:has-text("Go"), button:has-text("Start"), button:has-text("Open")'
  ).first();
  if (await openBtn.isVisible().catch(() => false)) {
    await humanClick(page, openBtn);
  } else {
    await humanClick(page, card);
  }

  await page.waitForLoadState('domcontentloaded');
  await humanPauseToRead(page, page.locator('main, body'));

  const startBtn = page.locator(
    'button:has-text("Start"), button:has-text("Begin"), button:has-text("Continue"), a:has-text("Start")'
  ).first();
  if (await startBtn.isVisible().catch(() => false)) {
    await humanClick(page, startBtn);
    await page.waitForLoadState('domcontentloaded');
  }

  await humanScrollRead(page, { segments: 6 });

  // Basit tamamlanma sinyalleri
  await page.waitForSelector('text=Completed, text=Reward, text=Success', { timeout: 30000 }).catch(() => {});
}
