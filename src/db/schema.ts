export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id),
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  subjects TEXT NOT NULL DEFAULT '[]',
  chapters TEXT NOT NULL DEFAULT '[]',
  hours_studied REAL NOT NULL DEFAULT 0,
  study_type TEXT NOT NULL DEFAULT 'other',
  focus_rating INTEGER NOT NULL DEFAULT 0,
  exam_type TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  ai_raw TEXT,
  ai_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id);

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id),
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  insights TEXT NOT NULL DEFAULT '[]',
  topic_coverage TEXT NOT NULL DEFAULT '{}',
  strengths TEXT NOT NULL DEFAULT '[]',
  weaknesses TEXT NOT NULL DEFAULT '[]',
  recommendations TEXT NOT NULL DEFAULT '[]',
  entry_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_week_start ON weekly_reviews(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_user ON weekly_reviews(user_id);

CREATE TABLE IF NOT EXISTS daily_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id),
  date TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  insights TEXT NOT NULL DEFAULT '[]',
  total_hours REAL NOT NULL DEFAULT 0,
  subjects TEXT NOT NULL DEFAULT '[]',
  strengths TEXT NOT NULL DEFAULT '[]',
  weaknesses TEXT NOT NULL DEFAULT '[]',
  recommendations TEXT NOT NULL DEFAULT '[]',
  entry_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_reviews(date);
CREATE INDEX IF NOT EXISTS idx_daily_user ON daily_reviews(user_id);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id),
  target_hours_per_week REAL NOT NULL DEFAULT 35,
  subjects TEXT NOT NULL DEFAULT '["Physics","Chemistry","Mathematics"]',
  selected_exams TEXT NOT NULL DEFAULT '[]',
  exam_type TEXT NOT NULL DEFAULT 'JEE',
  exam_date TEXT,
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);

CREATE TABLE IF NOT EXISTS syllabus (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id),
  exam_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  class_level TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started',
  completed_at TEXT,
  last_revised_at TEXT,
  revision_count INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_syllabus_unique ON syllabus(user_id, exam_type, subject, chapter);
CREATE INDEX IF NOT EXISTS idx_syllabus_exam ON syllabus(user_id, exam_type, subject);

CREATE TABLE IF NOT EXISTS mock_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id),
  exam_type TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  test_name TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  max_marks REAL NOT NULL DEFAULT 0,
  percentage REAL NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_date ON mock_tests(date);
CREATE INDEX IF NOT EXISTS idx_mock_tests_subject ON mock_tests(subject);
CREATE INDEX IF NOT EXISTS idx_mock_tests_user ON mock_tests(user_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'authenticated',
  stream TEXT,
  goal TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`;
