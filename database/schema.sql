-- Logs tablosu
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  site TEXT
);

-- Errors tablosu (self-healing için)
CREATE TABLE IF NOT EXISTS errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  site TEXT,
  page_url TEXT,
  screenshot_path TEXT,
  resolved BOOLEAN DEFAULT 0,
  resolution_strategy TEXT,
  ai_analysis TEXT
);

-- Learning data (başarılı stratejiler)
CREATE TABLE IF NOT EXISTS learning_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_signature TEXT UNIQUE,
  successful_strategy TEXT,
  success_count INTEGER DEFAULT 1,
  last_success DATETIME,
  confidence_score REAL
);

-- Captcha logs
CREATE TABLE IF NOT EXISTS captcha_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  captcha_type TEXT,
  site TEXT,
  success BOOLEAN,
  ai_confidence REAL,
  solution TEXT,
  time_taken INTEGER
);

-- Site configurations
CREATE TABLE IF NOT EXISTS site_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT UNIQUE,
  base_url TEXT,
  selectors TEXT,
  custom_logic TEXT,
  last_updated DATETIME
);

-- Indexes for performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_errors_type ON errors(error_type);
CREATE INDEX idx_errors_resolved ON errors(resolved);
CREATE INDEX idx_learning_signature ON learning_data(error_signature);
