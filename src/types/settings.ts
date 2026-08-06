export interface Settings {
  /** '1' for the sqlite adapter; the uid for the Firestore adapter (doc id = uid). */
  id: string;
  targetHoursPerWeek: number;
  studyDaysPerWeek: number;
  subjects: string[];            // Derived from selectedExams, stored as cache
  selectedExams: string[];       // Primary: exam definition keys e.g. ['JEE', 'CBSE_12_COMMERCE']
  examType: string;              // Legacy single exam — kept for backward compat
  examDate: string | null;
  theme: 'dark' | 'light';
  accentColor: string;           // 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'teal'
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  targetHoursPerWeek?: number;
  studyDaysPerWeek?: number;
  subjects?: string[];
  selectedExams?: string[];
  examType?: string;
  examDate?: string | null;
  theme?: 'dark' | 'light';
  accentColor?: string;
}
