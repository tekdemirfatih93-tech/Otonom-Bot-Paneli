import 'dotenv/config';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { login, gotoTasks } from './sites/cashstars.js';

chromium.use(StealthPlugin());
import { discoverTasks } from './perception.js';
import { chooseTask } from './planner.js';
import { runGenericTask } from './taskRunners/generic.js';
import { runVideoTask } from './taskRunners/video.js';
import { humanPauseToRead } from './behavior.js';
import { sleep, jitter } from './utils.js';

const USER_DATA_DIR = './user-data';
const BASE_URL = 'https://www.cashstars.com';

async function main() {
  const headless = !!process.env.HEADLESS;
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless,
    viewport: { width: 1366, height: 800 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-web-security',
    ],
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  
  // Bot tespitinden kaçınmak için ek ayarlar
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, 'languages', { get: () => ['tr-TR', 'tr', 'en-US', 'en'] });
    window.chrome = { runtime: {} };
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await login(page, {
      email: process.env.CASHSTARS_EMAIL,
      password: process.env.CASHSTARS_PASSWORD,
    });

    await gotoTasks(page);
    await humanPauseToRead(page, page.locator('main, body'));

    const memory = new Map(); // basit bellek: task-id -> lastTimestamp

    for (let round = 0; round < 50; round++) {
      const tasks = await discoverTasks(page);
      if (!tasks.length) {
        console.log('Görev bulunamadı, kısa bir süre bekleniyor...');
        await sleep(jitter(4000));
        await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
        continue;
      }

      const next = chooseTask(tasks, memory);
      if (!next) {
        console.log('Uygun görev seçilemedi, bekleniyor...');
        await sleep(jitter(5000));
        continue;
      }

      console.log(`Seçilen görev: ${next.title} (${next.type})`);

      try {
        if (next.type === 'video') {
          await runVideoTask(page, next);
        } else {
          await runGenericTask(page, next);
        }
        memory.set(next.id, Date.now());
      } catch (e) {
        console.warn('Görev yürütme hatası:', e?.message || e);
      }

      await sleep(jitter(2000));
      // Görev listesine geri dön
      await gotoTasks(page);
      await humanPauseToRead(page, page.locator('main, body'));
    }
  } finally {
    // Oturum kalıcılığı için açık bırakıyoruz; kapanış isterseniz uncomment:
    // await context.close();
  }
}

main().catch((e) => {
  console.error('Ajan hatası:', e);
  process.exitCode = 1;
});
