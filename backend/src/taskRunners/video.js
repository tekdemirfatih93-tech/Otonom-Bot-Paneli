import { humanPauseToRead } from '../behavior.js';
import { sleep, jitter } from '../utils.js';

export async function runVideoTask(page, task) {
  const card = task.locator;
  const openBtn = card.locator(
    'a:has-text("Watch"), a:has-text("Start"), button:has-text("Watch"), button:has-text("Start")'
  ).first();
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
  } else {
    await card.click();
  }
  await page.waitForLoadState('domcontentloaded');
  await humanPauseToRead(page, page.locator('main, body'));

  // Sayfada video ara (iframe içinde dahil)
  let played = false;
  const video = page.locator('video').first();
  if (await video.isVisible().catch(() => false)) {
    await video.evaluate((v) => v.play && v.play());
    played = true;
  } else {
    const frames = page.frames();
    for (const f of frames) {
      const v = f.locator('video').first();
      if (await v.isVisible().catch(() => false)) {
        await v.evaluate((vv) => vv.play && vv.play());
        played = true;
        break;
      }
    }
  }

  if (!played) return; // video yoksa vazgeç

  // Bitene kadar beklemeye çalış
  await page
    .waitForFunction(() => {
      let v = document.querySelector('video');
      if (!v) {
        const ifr = document.querySelector('iframe');
        try {
          v = ifr?.contentDocument?.querySelector('video');
        } catch (_) {}
      }
      return v && (v.ended || (v.duration && v.currentTime && v.duration - v.currentTime < 1));
    }, null, { timeout: 15 * 60 * 1000 })
    .catch(() => {});
}
