// Basit sezgisel planlayıcı: tekrarları azalt, kolay görevleri öncele
export function chooseTask(tasks, memory) {
  if (!tasks?.length) return null;

  const scored = tasks.map((t) => {
    const last = memory.get(t.id) || 0;
    const freshness = Math.min(1, (Date.now() - last) / (10 * 60 * 1000)); // 0..1
    const base = t.type === 'video' ? 1.0 : t.type === 'generic' ? 0.8 : 0.6;
    const reward = t.reward ? Math.min(1, t.reward / 5) : 0.2;
    const score = base * 0.6 + reward * 0.2 + freshness * 0.2;
    return { ...t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}
