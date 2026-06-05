/**
 * Single source of truth for all exam and subject metadata.
 * Every file that needs exam → subjects mapping imports from here.
 * Do NOT duplicate these definitions anywhere else.
 */

export interface ExamDefinition {
  /** Unique machine key e.g. 'JEE', 'CBSE_12_COMMERCE' */
  key: string;
  /** Human-readable label e.g. 'JEE Main', 'CBSE Class 12 (Commerce)' */
  label: string;
  /** Stream group for onboarding filtering */
  group: 'science' | 'commerce';
  /** Default subjects this exam covers */
  subjects: string[];
  /** Key into syllabus-data.ts EXAM_SYLLABI array */
  syllabusKey: string;
}

export const EXAM_DEFINITIONS: ExamDefinition[] = [
  // ── Science stream ──
  {
    key: 'JEE',
    label: 'JEE Main',
    group: 'science',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    syllabusKey: 'JEE',
  },
  {
    key: 'JEE_ADVANCED',
    label: 'JEE Advanced',
    group: 'science',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    syllabusKey: 'JEE',
  },
  {
    key: 'NEET',
    label: 'NEET UG',
    group: 'science',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    syllabusKey: 'NEET',
  },
  {
    key: 'CBSE_12_SCIENCE',
    label: 'CBSE Class 12 (Science)',
    group: 'science',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'],
    syllabusKey: 'CBSE_12',
  },
  {
    key: 'MHT_CET_SCIENCE',
    label: 'MHT CET (Science)',
    group: 'science',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    syllabusKey: 'MHT_CET',
  },
  {
    key: 'GATE',
    label: 'GATE',
    group: 'science',
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Computer Science'],
    syllabusKey: 'GATE',
  },

  // ── Commerce stream ──
  {
    key: 'CBSE_12_COMMERCE',
    label: 'CBSE Class 12 (Commerce)',
    group: 'commerce',
    subjects: ['Accountancy', 'Business Studies', 'Economics', 'Applied Mathematics', 'English'],
    syllabusKey: 'CBSE_12',
  },
  {
    key: 'CUET',
    label: 'CUET UG',
    group: 'commerce',
    subjects: ['English Language', 'General Knowledge', 'Logical Reasoning', 'Numerical Ability', 'Current Affairs'],
    syllabusKey: 'CUET',
  },
  {
    key: 'CAT',
    label: 'CAT',
    group: 'commerce',
    subjects: ['VARC', 'DILR', 'Quantitative Ability'],
    syllabusKey: 'CAT',
  },
  {
    key: 'UPSC',
    label: 'UPSC CSE',
    group: 'science',
    subjects: ['History', 'Geography', 'Polity', 'Economy', 'Science and Tech', 'Ethics and CSAT'],
    syllabusKey: 'UPSC',
  },
];

/** Get syllabus key (for filtering syllabus-data.ts) from an exam definition key */
export function getSyllabusKeyForExam(examKey: string): string {
  return EXAM_DEFINITIONS.find((e) => e.key === examKey)?.syllabusKey ?? 'JEE';
}

/** Get a human-readable label for an exam definition key */
export function getExamLabel(examKey: string): string {
  return EXAM_DEFINITIONS.find((e) => e.key === examKey)?.label ?? examKey;
}

/** Get default subjects for one or more exam keys */
export function getSubjectsForExamKeys(examKeys: string[]): string[] {
  const subjects = new Set<string>();
  for (const key of examKeys) {
    const def = EXAM_DEFINITIONS.find((e) => e.key === key);
    if (def) {
      for (const s of def.subjects) subjects.add(s);
    }
  }
  return [...subjects];
}

/** Resolve a legacy single examType value to selectedExams array */
export function legacyExamToSelected(examType: string): string[] {
  const map: Record<string, string> = {
    'JEE Main': 'JEE',
    'JEE Advanced': 'JEE_ADVANCED',
    'NEET': 'NEET',
    'CET': 'MHT_CET_SCIENCE',
    'Boards (PCM)': 'CBSE_12_SCIENCE',
    'Boards (PCB)': 'CBSE_12_SCIENCE',
    'Boards (Commerce)': 'CBSE_12_COMMERCE',
    'CUET': 'CUET',
    'GATE': 'GATE',
    'CAT': 'CAT',
    'UPSC': 'UPSC',
  };
  return [map[examType] ?? 'JEE'];
}
