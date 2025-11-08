import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
const configPath = path.join(dataDir, 'config.json');

const defaultConfig = { sites: [] };

export function ensureConfig() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

export function getConfig() {
  ensureConfig();
  const raw = fs.readFileSync(configPath, 'utf8');
  try { return JSON.parse(raw); } catch { return { ...defaultConfig }; }
}

export function saveConfig(cfg) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}
