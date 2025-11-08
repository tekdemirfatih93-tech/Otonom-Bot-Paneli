import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../database/app.db');
export let db;

export function initDatabase() {
  try {
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      console.log('✅ Database initialized successfully');
    } else {
      console.warn('⚠️  Schema file not found, creating basic structure');
      createBasicSchema();
    }

    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

function createBasicSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT,
      message TEXT,
      site TEXT
    );
    
    CREATE TABLE IF NOT EXISTS errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      error_type TEXT,
      error_message TEXT,
      resolved BOOLEAN DEFAULT 0
    );
  `);
}

export function logToDatabase(level, message, site = null) {
  if (!db) return;
  try {
    db.prepare('INSERT INTO logs (level, message, site) VALUES (?, ?, ?)').run(level, message, site);
  } catch (err) {
    console.error('Log insert failed:', err.message);
  }
}
