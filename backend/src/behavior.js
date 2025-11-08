import { sleep, jitter, rand, randInt } from './utils.js';

export async function humanPauseToRead(page, areaLocator, { wpm = 220 } = {}) {
  try {
    const text = (await areaLocator.first().innerText()).trim();
    const words = text.split(/\s+/).length;
    const seconds = Math.min(15, Math.max(1.5, (words / wpm) * (1 + rand(-0.25, 0.4))));
    await sleep(jitter(seconds * 1000, 0.4));
  } catch (_) {
    await sleep(jitter(1200));
  }
}

export async function humanMoveMouse(page, x, y) {
  const { x: sx, y: sy } = await page.mouse._lastMove || { x: randInt(30, 200), y: randInt(30, 120) };
  const steps = randInt(18, 42);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // ease in-out cubic
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const nx = sx + (x - sx) * e + rand(-1.5, 1.5);
    const ny = sy + (y - sy) * e + rand(-1.5, 1.5);
    await page.mouse.move(nx, ny, { steps: 1 });
    await sleep(rand(4, 12));
  }
}

export async function humanClick(page, locator, { delayMean = 110 } = {}) {
  const box = await locator.boundingBox();
  if (!box) {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
  }
  const b = (await locator.boundingBox()) || { x: 100, y: 100, width: 10, height: 10 };
  const tx = b.x + rand(0.3, 0.7) * b.width;
  const ty = b.y + rand(0.3, 0.7) * b.height;
  await humanMoveMouse(page, tx, ty);
  await sleep(jitter(delayMean, 0.5));
  await page.mouse.down();
  await sleep(rand(35, 120));
  await page.mouse.up();
}

export async function humanType(locator, text) {
  await locator.focus();
  for (const ch of text) {
    await locator.type(ch, { delay: jitter(50, 0.6) });
    if (Math.random() < 0.08) await sleep(rand(60, 180));
  }
}

export async function humanScrollRead(page, { segments = 6 } = {}) {
  for (let i = 0; i < segments; i++) {
    await page.mouse.wheel(0, randInt(300, 700));
    await sleep(jitter(randInt(500, 1400)));
  }
}
