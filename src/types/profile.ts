import type { StreamKey } from '../utils/stream-map';

export type ClassLevel = 'class_9' | 'class_10' | 'class_11' | 'class_12' | 'dropper' | 'college' | 'other';

export interface UserProfile {
  /** The user's current education level */
  classLevel: ClassLevel | null;
  /** Academic stream */
  stream: StreamKey | null;
  /** Selected subjects (free-form — user can add/remove any) */
  subjects: string[];
  /** Selected exam keys for multi-exam tracking */
  selectedExams: string[];
  /** Weekly study target in hours */
  weeklyStudyGoal: number;
  /** How many days per week they study */
  studyDaysPerWeek: number;
  /** Computed: weeklyStudyGoal / studyDaysPerWeek */
  recommendedDailyAverage: number;
}

export function computeDailyAverage(hours: number, days: number): number {
  if (days <= 0) return hours;
  return Math.round((hours / days) * 10) / 10;
}

export function createDefaultProfile(): UserProfile {
  return {
    classLevel: null,
    stream: null,
    subjects: [],
    selectedExams: [],
    weeklyStudyGoal: 35,
    studyDaysPerWeek: 5,
    recommendedDailyAverage: 7,
  };
}
