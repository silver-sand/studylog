export interface Settings {
  id: number;
  targetHoursPerWeek: number;
  subjects: string[];
  examType: string;
  theme: 'dark' | 'light';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  targetHoursPerWeek?: number;
  subjects?: string[];
  examType?: string;
  theme?: 'dark' | 'light';
}

export const EXAM_TYPES = [
  'JEE Main',
  'JEE Advanced',
  'NEET',
  'CET',
  'Boards (PCM)',
  'Boards (PCB)',
  'Boards (Commerce)',
  'CUET',
  'GATE',
  'CAT',
  'UPSC',
  'Other',
] as const;
