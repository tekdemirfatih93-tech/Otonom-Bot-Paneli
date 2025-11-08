import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { v4 as uuidv4 } from 'uuid';

chromium.use(StealthPlugin());
import path from 'node:path';
import { getConfig, saveConfig } from './config.js';
import { discoverTasks } from '../perception.js';
import { chooseTask } from '../planner.js';
import { runGenericTask } from '../taskRunners/generic.js';
import { runVideoTask } from '../taskRunners/video.js';
import { runSurveyTask } from '../taskRunners/survey.js';
import { humanPauseToRead } from '../behavior.js';
import { sleep, jitter } from '../utils.js';

class RunnerManager {
  constructor() {
    this.runners = new Map(); // id -> { running, loopPromise, stopFlag }
  }

  createSite(input) {
    const id = uuidv4();
    const site = {
      id,
      name: input?.name || 'Site',
      baseUrl: input?.baseUrl || '',
      headless: input?.headless !== undefined ? !!input.headless : false,
      enabled: input?.enabled !== undefined ? !!input.enabled : true,
      lastRun: null,
    };
    return site;
  }

  status() {
    const res = {};
    for (const [id, r] of this.runners.entries()) {
      res[id] = { running: !!r?.running, lastError: r?.lastError || null };
    }
    return res;
  }

  async start(id) {
    if (this.runners.get(id)?.running) return;
    const cfg = getConfig();
    const site = cfg.sites.find((s) => s.id === id);
    if (!site) throw new Error('Site not found');
    if (!site.baseUrl) throw new Error('Site URL required');

    const state = { running: true, stopFlag: false, lastError: null };
    this.runners.set(id, state);

    state.loopPromise = this.#loop(site, state).catch((e) => {
      state.lastError = e?.message || String(e);
      state.running = false;
    });
  }

  async stop(id) {
    const st = this.runners.get(id);
    if (!st) return;
    st.stopFlag = true;
    await st.loopPromise.catch(() => {});
    this.runners.delete(id);
  }

  async #loop(site, state) {
    const userDir = path.resolve(process.cwd(), 'user-data', site.id);
    const context = await chromium.launchPersistentContext(userDir, {
      headless: false,
      viewport: { width: 1366, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    });

    const page = await context.newPage();

    // Anti-detection: webdriver özelliğini gizle
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Chrome object
      window.chrome = {
        runtime: {},
      };
      
      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Plugins length
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['tr-TR', 'tr', 'en-US', 'en'],
      });
    });

    try {
      // İlk ziyaret - siteye git ve kullanıcının giriş yapmasını bekle
      console.log(`[${site.name}] Siteye gidiliyor: ${site.baseUrl}`);
      const initialUrl = site.baseUrl;
      await page.goto(initialUrl, { waitUntil: 'domcontentloaded' });
      
      // Giriş tespiti - URL değişikliği veya dashboard öğeleri
      console.log(`[${site.name}] Lütfen tarayıcıda giriş yapın...`);
      console.log(`[${site.name}] Giriş yapılana kadar bekleniyor (max 5 dakika)`);
      
      let loginDetected = false;
      const startTime = Date.now();
      const maxWait = 5 * 60 * 1000; // 5 dakika
      
      while (!loginDetected && (Date.now() - startTime) < maxWait && !state.stopFlag) {
        await sleep(2000); // Her 2 saniyede kontrol
        
        const currentUrl = page.url();
        
        // URL değişti mi? (login -> dashboard)
        if (currentUrl !== initialUrl && !currentUrl.includes('/login') && !currentUrl.includes('/signin')) {
          console.log(`[${site.name}] Giriş tespit edildi! (URL değişti: ${currentUrl})`);
          loginDetected = true;
          break;
        }
        
        // Dashboard öğeleri var mı?
        const dashboardSignals = [
          'text=Dashboard',
          'text=Logout',
          'text=Sign out',
          'text=Profile',
          'text=Account',
          'a:has-text("Tasks")',
          'a:has-text("Offers")',
          'a:has-text("Earn")',
          '[data-testid="user-menu"]',
          '.user-profile',
          '.balance',
          '.points'
        ];
        
        for (const signal of dashboardSignals) {
          if (await page.locator(signal).first().isVisible().catch(() => false)) {
            console.log(`[${site.name}] Giriş tespit edildi! (Dashboard öğesi bulundu: ${signal})`);
            loginDetected = true;
            break;
          }
        }
      }
      
      if (!loginDetected) {
        throw new Error('Giriş tespit edilemedi. Lütfen tekrar deneyin.');
      }
      
      // Giriş başarılı, biraz bekle
      console.log(`[${site.name}] Oturum kaydedildi. Görevler aranıyor...`);
      await sleep(3000);

      while (!state.stopFlag) {
        // Görevleri keşfet ve çalıştır
        await humanPauseToRead(page, page.locator('main, body'));
        
        const tasks = await discoverTasks(page);
        console.log(`[${site.name}] ${tasks.length} görev bulundu`);
        
        const next = chooseTask(tasks, new Map());
        if (next) {
          console.log(`[${site.name}] Görev başlatılıyor: ${next.title} (${next.type})`);
          if (next.type === 'video') await runVideoTask(page, next);
          else if (next.type === 'survey') await runSurveyTask(page, next, site);
          else await runGenericTask(page, next);
          console.log(`[${site.name}] Görev tamamlandı`);
        } else {
          console.log(`[${site.name}] Uygun görev bulunamadı, bekleniyor...`);
        }

        site.lastRun = new Date().toISOString();
        const cfg = getConfig();
        const idx = cfg.sites.findIndex((s) => s.id === site.id);
        if (idx !== -1) {
          cfg.sites[idx].lastRun = site.lastRun;
          saveConfig(cfg);
        }

        await sleep(jitter(4000));
        
        // Sayfayı yenile
        await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      }
    } finally {
      await context.close().catch(() => {});
      state.running = false;
    }
  }

}

export const runnerManager = new RunnerManager();
