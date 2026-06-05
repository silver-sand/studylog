/**
 * Single source of truth for Stream → Subjects → Exams mapping.
 * Every file that needs stream/subject/exam metadata imports from here.
 * Do NOT duplicate these definitions anywhere else.
 */

import { EXAM_DEFINITIONS, type ExamDefinition } from './exam-map';

export type StreamKey = 'science' | 'commerce' | 'humanities';

export interface StreamDef {
  label: string;
  icon: string;
  description: string;
  /** Subjects that belong to this stream — users can pick a subset */
  subjects: string[];
  /** Exam keys available for this stream */
  examKeys: string[];
}

export const STREAMS: Record<StreamKey, StreamDef> = {
  science: {
    label: 'Science',
    icon: '🔬',
    description: 'Physics, Chemistry, Mathematics, Biology',
    subjects: [
      'Physics',
      'Chemistry',
      'Mathematics',
      'Biology',
      'Computer Science',
      'Physical Education',
      'English',
      'Electronics',
      'Painting',
    ],
    examKeys: ['JEE', 'JEE_ADVANCED', 'NEET', 'CBSE_12_SCIENCE', 'MHT_CET_SCIENCE', 'GATE'],
  },
  commerce: {
    label: 'Commerce',
    icon: '📊',
    description: 'Accountancy, Business Studies, Economics, Applied Mathematics',
    subjects: [
      'Accountancy',
      'Business Studies',
      'Economics',
      'Applied Mathematics',
      'English',
      'Informatics Practices',
      'Entrepreneurship',
      'Mathematics',
      'Physical Education',
    ],
    examKeys: ['CBSE_12_COMMERCE', 'CUET', 'CAT'],
  },
  humanities: {
    label: 'Humanities',
    icon: '📖',
    description: 'History, Geography, Political Science, Psychology, Sociology',
    subjects: [
      'History',
      'Geography',
      'Political Science',
      'Psychology',
      'Economics',
      'Sociology',
      'English',
      'Mathematics',
      'Physical Education',
      'Informatics Practices',
    ],
    examKeys: ['CUET', 'UPSC'],
  },
};

/** Get the exam definitions available for a given stream */
export function getExamsForStream(stream: StreamKey): ExamDefinition[] {
  return STREAMS[stream].examKeys
    .map((key) => EXAM_DEFINITIONS.find((e) => e.key === key))
    .filter((e): e is ExamDefinition => !!e);
}

/** Get stream-appropriate default subject suggestions for a given stream */
export function getDefaultSubjectsForStream(stream: StreamKey): string[] {
  const defaults: Record<StreamKey, string[]> = {
    science: ['Physics', 'Chemistry', 'Mathematics'],
    commerce: ['Accountancy', 'Business Studies', 'Economics'],
    humanities: ['History', 'Geography', 'Political Science', 'Economics', 'English'],
  };
  return defaults[stream] ?? STREAMS[stream].subjects.slice(0, 3);
}

/** Given stream + selected exams, recommend subjects (merges stream defaults + exam subjects) */
export function recommendSubjects(stream: StreamKey, selectedExamKeys: string[]): string[] {
  const recommended = new Set<string>();

  // Start with stream default subjects
  for (const s of getDefaultSubjectsForStream(stream)) {
    recommended.add(s);
  }

  // Add subjects from selected exams
  for (const key of selectedExamKeys) {
    const def = EXAM_DEFINITIONS.find((e) => e.key === key);
    if (def) {
      for (const s of def.subjects) {
        recommended.add(s);
      }
    }
  }

  return [...recommended];
}
