/**
 * Stream → Exams mapping.
 * Defines which exams belong to Science vs Commerce streams for onboarding.
 */
import { EXAM_DEFINITIONS, type ExamDefinition } from './exam-map';

export interface StreamDef {
  label: string;
  icon: string;
  description: string;
  examKeys: string[];
}

export const STREAMS: Record<'science' | 'commerce', StreamDef> = {
  science: {
    label: 'Science',
    icon: '🔬',
    description: 'Physics, Chemistry, Mathematics, Biology',
    examKeys: ['JEE', 'JEE_ADVANCED', 'NEET', 'CBSE_12_SCIENCE', 'MHT_CET_SCIENCE', 'GATE'],
  },
  commerce: {
    label: 'Commerce',
    icon: '📊',
    description: 'Accountancy, Business Studies, Economics, Applied Mathematics',
    examKeys: ['CBSE_12_COMMERCE', 'CUET', 'CAT', 'UPSC'],
  },
};

/** Get the exam definitions available for a given stream */
export function getExamsForStream(stream: 'science' | 'commerce'): ExamDefinition[] {
  return STREAMS[stream].examKeys
    .map((key) => EXAM_DEFINITIONS.find((e) => e.key === key))
    .filter((e): e is ExamDefinition => !!e);
}
