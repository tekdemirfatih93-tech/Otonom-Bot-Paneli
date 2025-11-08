import { sleep, jitter } from './utils.js';

// Basit görev keşfi: Kartlar ve tür/başlık çıkarımı
export async function discoverTasks(page) {
  const cards = page.locator('[data-task-card], .task-card, .offer-card, [role="article"], [class*="task" i]');
  const count = await cards.count();
  const list = [];
  for (let i = 0; i < count; i++) {
    const el = cards.nth(i);
    const title = (await el.locator('h1, h2, h3, .title, [data-title]').first().textContent().catch(() => 'Task'))?.trim() || 'Task';
    const raw = (await el.innerText().catch(() => ''))?.toLowerCase() || '';
    let type = 'generic';
    if (raw.includes('video')) type = 'video';
    else if (raw.includes('survey')) type = 'survey';
    else if (raw.includes('offer')) type = 'offer';
    else if (raw.includes('game') || raw.includes('play')) type = 'game';

    const rewardMatch = raw.match(/\$?\s?(\d+[\.,]?\d*)\s*(points|pt|usd|\$)?/i);
    const reward = rewardMatch ? Number(rewardMatch[1].replace(',', '.')) : undefined;

    const id = `${title}-${i}`;
    list.push({ id, index: i, title, type, reward, locator: el });
  }
  return list;
}
