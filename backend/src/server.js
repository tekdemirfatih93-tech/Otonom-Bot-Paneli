import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig, saveConfig, ensureConfig } from './server/config.js';
import { runnerManager } from './server/runnerManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

ensureConfig();

// API: list sites
app.get('/api/sites', (req, res) => {
  res.json(getConfig().sites || []);
});

// API: create site
app.post('/api/sites', (req, res) => {
  const cfg = getConfig();
  const site = runnerManager.createSite(req.body);
  cfg.sites.push(site);
  saveConfig(cfg);
  res.json(site);
});

// API: update site
app.put('/api/sites/:id', (req, res) => {
  const cfg = getConfig();
  const idx = cfg.sites.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const updated = { ...cfg.sites[idx], ...req.body, id: cfg.sites[idx].id };
  cfg.sites[idx] = updated;
  saveConfig(cfg);
  res.json(updated);
});

// API: delete site
app.delete('/api/sites/:id', (req, res) => {
  const cfg = getConfig();
  const idx = cfg.sites.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  runnerManager.stop(req.params.id).catch(() => {});
  cfg.sites.splice(idx, 1);
  saveConfig(cfg);
  res.json({ ok: true });
});

// API: start/stop
app.post('/api/start/:id', async (req, res) => {
  try {
    await runnerManager.start(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e?.message || String(e) });
  }
});

app.post('/api/stop/:id', async (req, res) => {
  try {
    await runnerManager.stop(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e?.message || String(e) });
  }
});

// API: status
app.get('/api/status', (req, res) => {
  res.json(runnerManager.status());
});

const port = process.env.PORT || 3300;
app.listen(port, () => {
  console.log(`UI running on http://localhost:${port}`);
});
