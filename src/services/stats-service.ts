import { getDb } from '../db';
import { getMonday, getSunday, formatDate } from '../utils/date';
import type { Entry, StudyType } from '../types/entry';

export function getDashboardStats() {
  const db = getDb();
  const now = new Date();
  const today = formatDate(now);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const weekStart = getMonday(now);

  // Recent entries for display (limited)
  const entries = db.listEntries({ limit: 50 });
  // Full dataset for aggregations (unlimited)
  const allEntries = db.listEntries();

  // Today's entry
  const todayEntry = db.getEntryByDate(today);

  // Current week entries
  const weekEntries = db.listEntries({
    from: weekStart,
    to: getSunday(now),
  });

  const totalHoursThisWeek = db.getTotalHoursForWeek(weekStart);
  const settings = db.getSettings();

  // Compute aggregations
  const subjectBreakdown = getSubjectBreakdown(allEntries);
  const dailyTrend = getDailyTrend(14);
  const typeDistribution = getStudyTypeDistribution(allEntries);
  const focusTrend = getFocusTrend(7);
  const weekComparison = getWeekComparison();

  return {
    streak: db.getStreak(),
    todayEntry,
    totalHoursThisWeek,
    targetHoursPerWeek: settings.targetHoursPerWeek,
    weeklyProgressPercent: Math.min(
      100,
      Math.round((totalHoursThisWeek / settings.targetHoursPerWeek) * 100)
    ),
    entriesThisWeek: weekEntries.length,
    totalEntries: db.getEntryCount(),
    entriesThisMonth: db.getEntryCountForMonth(year, month),
    weekStart,
    recentEntries: entries,
    subjects: settings.subjects,
    // New analytics
    subjectBreakdown,
    dailyTrend,
    typeDistribution,
    focusTrend,
    weekComparison,
  };
}

export function getStreak(): number {
  return getDb().getStreak();
}

export function getEntryCount(): number {
  return getDb().getEntryCount();
}

// ── Aggregation Functions ──

export interface SubjectBreakdownItem {
  subject: string;
  hours: number;
  percentage: number;
}

export function getSubjectBreakdown(entries: Entry[]): SubjectBreakdownItem[] {
  const subjectMap = new Map<string, number>();
  for (const entry of entries) {
    for (const subject of entry.subjects) {
      subjectMap.set(subject, (subjectMap.get(subject) || 0) + entry.hoursStudied);
    }
  }
  const totalHours = Array.from(subjectMap.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(subjectMap.entries())
    .map(([subject, hours]) => ({
      subject,
      hours: Math.round(hours * 10) / 10,
      percentage: Math.round((hours / totalHours) * 100),
    }))
    .sort((a, b) => b.hours - a.hours);
}

export interface DailyTrendItem {
  date: string;
  hours: number;
  label: string;
}

export function getDailyTrend(days: number = 14): DailyTrendItem[] {
  const db = getDb();
  const now = new Date();
  const results: DailyTrendItem[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const entry = db.getEntryByDate(dateStr);
    const hours = entry ? entry.hoursStudied : 0;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;

    results.push({
      date: dateStr,
      hours,
      label: i === 0 ? 'Today' : i === 1 ? 'Yest' : dayName === 'Sat' || dayName === 'Sun' || i % 3 === 0 ? shortDate : '',
    });
  }

  return results;
}

export interface TypeDistributionItem {
  type: StudyType;
  hours: number;
  count: number;
  label: string;
}

const TYPE_LABELS: Record<StudyType, string> = {
  theory: 'Theory',
  problem_solving: 'Problem Solving',
  revision: 'Revision',
  test: 'Test',
  other: 'Other',
};

export function getStudyTypeDistribution(entries: Entry[]): TypeDistributionItem[] {
  const typeMap = new Map<StudyType, { hours: number; count: number }>();

  for (const entry of entries) {
    const t = entry.studyType || 'other';
    const current = typeMap.get(t) || { hours: 0, count: 0 };
    current.hours += entry.hoursStudied;
    current.count += 1;
    typeMap.set(t, current);
  }

  return Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      hours: Math.round(data.hours * 10) / 10,
      count: data.count,
      label: TYPE_LABELS[type] || type,
    }))
    .sort((a, b) => b.hours - a.hours);
}

export interface FocusTrendItem {
  date: string;
  average: number;
  label: string;
}

export function getFocusTrend(days: number = 7): FocusTrendItem[] {
  const db = getDb();
  const now = new Date();
  const results: FocusTrendItem[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const entry = db.getEntryByDate(dateStr);
    const average = entry ? entry.focusRating : 0;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    results.push({
      date: dateStr,
      average,
      label: i === 0 ? 'Today' : dayName,
    });
  }

  return results;
}

export interface WeekComparisonData {
  current: { hours: number; days: number };
  previous: { hours: number; days: number };
  change: number;
  changePercent: number;
}

export function getWeekComparison(): WeekComparisonData {
  const db = getDb();
  const now = new Date();
  const currentStart = getMonday(now);
  const currentEnd = getSunday(now);

  // Previous week
  const prevMonday = new Date(currentStart);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevStart = formatDate(prevMonday);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevSunday.getDate() + 6);
  const prevEnd = formatDate(prevSunday);

  const currentEntries = db.listEntries({ from: currentStart, to: currentEnd });
  const prevEntries = db.listEntries({ from: prevStart, to: prevEnd });

  const currentHours = currentEntries.reduce((s, e) => s + e.hoursStudied, 0);
  const prevHours = prevEntries.reduce((s, e) => s + e.hoursStudied, 0);

  const currentDays = new Set(currentEntries.map((e) => e.date)).size;
  const prevDays = new Set(prevEntries.map((e) => e.date)).size;

  const change = Math.round((currentHours - prevHours) * 10) / 10;
  const changePercent = prevHours > 0
    ? Math.round(((currentHours - prevHours) / prevHours) * 100)
    : currentHours > 0 ? 100 : 0;

  return {
    current: { hours: Math.round(currentHours * 10) / 10, days: currentDays },
    previous: { hours: Math.round(prevHours * 10) / 10, days: prevDays },
    change,
    changePercent,
  };
}
