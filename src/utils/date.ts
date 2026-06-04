export function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDate(d);
}

export function getSunday(date: Date = new Date()): string {
  const monday = new Date(getMonday(date));
  monday.setDate(monday.getDate() + 6);
  return formatDate(monday);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

export function getWeekRange(dateStr?: string): { weekStart: string; weekEnd: string } {
  const date = dateStr ? new Date(dateStr) : new Date();
  return {
    weekStart: getMonday(date),
    weekEnd: getSunday(date),
  };
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
