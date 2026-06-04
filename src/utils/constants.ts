export const APP_NAME = 'StudyLog';
export const DEFAULT_TARGET_HOURS = 35;
export const DEFAULT_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];

export const SUBJECT_COLORS: Record<string, string> = {
  physics: 'bg-blue-500',
  chemistry: 'bg-green-500',
  mathematics: 'bg-amber-500',
  biology: 'bg-pink-500',
  english: 'bg-purple-500',
};

export const SUBJECT_TEXT_COLORS: Record<string, string> = {
  physics: 'text-blue-400',
  chemistry: 'text-green-400',
  mathematics: 'text-amber-400',
  biology: 'text-pink-400',
  english: 'text-purple-400',
};

export function getSubjectColor(subject: string): string {
  const key = subject.toLowerCase().trim();
  if (key.includes('physics') || key.includes('phys')) return SUBJECT_COLORS.physics;
  if (key.includes('chemistry') || key.includes('chem')) return SUBJECT_COLORS.chemistry;
  if (key.includes('math') || key.includes('algebra') || key.includes('calculus')) return SUBJECT_COLORS.mathematics;
  if (key.includes('bio')) return SUBJECT_COLORS.biology;
  if (key.includes('english')) return SUBJECT_COLORS.english;
  return 'bg-gray-500';
}

export function getSubjectTextColor(subject: string): string {
  const key = subject.toLowerCase().trim();
  if (key.includes('physics') || key.includes('phys')) return SUBJECT_TEXT_COLORS.physics;
  if (key.includes('chemistry') || key.includes('chem')) return SUBJECT_TEXT_COLORS.chemistry;
  if (key.includes('math') || key.includes('algebra') || key.includes('calculus')) return SUBJECT_TEXT_COLORS.mathematics;
  if (key.includes('bio')) return SUBJECT_TEXT_COLORS.biology;
  if (key.includes('english')) return SUBJECT_TEXT_COLORS.english;
  return 'text-gray-400';
}

export const SUBJECTS_LIST = [
  'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English',
  'Hindi', 'Computer Science', 'History', 'Geography', 'Economics',
  'General Studies',
];

export const EXAM_TYPES_LIST = [
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
];
