export const QUERIES = {
  // Entries
  CREATE_ENTRY: `INSERT INTO entries (id, date, content, subjects, chapters, hours_studied, tags, ai_raw, ai_status)
    VALUES (@id, @date, @content, @subjects, @chapters, @hours_studied, @tags, @ai_raw, @ai_status)`,
  GET_ENTRY: `SELECT * FROM entries WHERE id = ?`,
  GET_ENTRY_BY_DATE: `SELECT * FROM entries WHERE date = ?`,
  LIST_ENTRIES: `SELECT * FROM entries ORDER BY date DESC, created_at DESC`,
  LIST_ENTRIES_RANGE: `SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date DESC`,
  UPDATE_ENTRY: `UPDATE entries SET content = @content, subjects = @subjects, chapters = @chapters,
    hours_studied = @hours_studied, tags = @tags, ai_raw = @ai_raw, ai_status = @ai_status WHERE id = @id`,
  DELETE_ENTRY: `DELETE FROM entries WHERE id = ?`,

  // Weekly Reviews
  CREATE_REVIEW: `INSERT INTO weekly_reviews (id, week_start, week_end, content, insights,
    topic_coverage, strengths, weaknesses, recommendations, entry_ids)
    VALUES (@id, @week_start, @week_end, @content, @insights, @topic_coverage,
    @strengths, @weaknesses, @recommendations, @entry_ids)`,
  GET_REVIEW: `SELECT * FROM weekly_reviews WHERE id = ?`,
  GET_REVIEW_BY_WEEK: `SELECT * FROM weekly_reviews WHERE week_start = ?`,
  LIST_REVIEWS: `SELECT * FROM weekly_reviews ORDER BY week_start DESC`,
  UPSERT_REVIEW: `INSERT OR REPLACE INTO weekly_reviews (id, week_start, week_end, content, insights,
    topic_coverage, strengths, weaknesses, recommendations, entry_ids, created_at)
    VALUES (@id, @week_start, @week_end, @content, @insights, @topic_coverage,
    @strengths, @weaknesses, @recommendations, @entry_ids,
    COALESCE((SELECT created_at FROM weekly_reviews WHERE week_start = @week_start), datetime('now')))`,

  // Settings
  GET_SETTINGS: `SELECT * FROM settings WHERE id = 1`,
  UPDATE_SETTINGS: `UPDATE settings SET target_hours_per_week = @target_hours_per_week,
    subjects = @subjects, theme = @theme, updated_at = datetime('now') WHERE id = 1`,

  // Stats
  GET_ENTRY_COUNT: `SELECT COUNT(*) as count FROM entries`,
  GET_ENTRY_COUNT_MONTH: `SELECT COUNT(*) as count FROM entries WHERE date LIKE @prefix || '%'`,
  GET_STREAK: `SELECT DISTINCT date FROM entries ORDER BY date DESC`,
  GET_WEEK_HOURS: `SELECT COALESCE(SUM(hours_studied), 0) as total FROM entries WHERE date >= ? AND date <= ?`,
};
