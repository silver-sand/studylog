export const APP_NAME = 'StudyLog';
export const DEFAULT_TARGET_HOURS = 35;
export const DEFAULT_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];

export const SUBJECT_COLORS: Record<string, string> = {
  physics: 'bg-blue-500',
  chemistry: 'bg-green-500',
  mathematics: 'bg-amber-500',
  biology: 'bg-pink-500',
  english: 'bg-purple-500',
  accountancy: 'bg-teal-500',
  business_studies: 'bg-orange-500',
  economics: 'bg-rose-500',
  applied_mathematics: 'bg-indigo-500',
};

export const SUBJECT_TEXT_COLORS: Record<string, string> = {
  physics: 'text-blue-400',
  chemistry: 'text-green-400',
  mathematics: 'text-amber-400',
  biology: 'text-pink-400',
  english: 'text-purple-400',
  accountancy: 'text-teal-400',
  business_studies: 'text-orange-400',
  economics: 'text-rose-400',
  applied_mathematics: 'text-indigo-400',
};

export function getSubjectColor(subject: string): string {
  const key = subject.toLowerCase().trim();
  if (key.includes('physics') || key.includes('phys')) return SUBJECT_COLORS.physics;
  if (key.includes('chemistry') || key.includes('chem')) return SUBJECT_COLORS.chemistry;
  if (key.includes('math') || key.includes('algebra') || key.includes('calculus')) return SUBJECT_COLORS.mathematics;
  if (key.includes('bio')) return SUBJECT_COLORS.biology;
  if (key.includes('english')) return SUBJECT_COLORS.english;
  if (key.includes('account')) return SUBJECT_COLORS.accountancy;
  if (key.includes('business') || key.includes('bst')) return SUBJECT_COLORS.business_studies;
  if (key.includes('economics') || key.includes('econ')) return SUBJECT_COLORS.economics;
  if (key.includes('applied math')) return SUBJECT_COLORS.applied_mathematics;
  return 'bg-gray-500';
}

export function getSubjectTextColor(subject: string): string {
  const key = subject.toLowerCase().trim();
  if (key.includes('physics') || key.includes('phys')) return SUBJECT_TEXT_COLORS.physics;
  if (key.includes('chemistry') || key.includes('chem')) return SUBJECT_TEXT_COLORS.chemistry;
  if (key.includes('math') || key.includes('algebra') || key.includes('calculus')) return SUBJECT_TEXT_COLORS.mathematics;
  if (key.includes('bio')) return SUBJECT_TEXT_COLORS.biology;
  if (key.includes('english')) return SUBJECT_TEXT_COLORS.english;
  if (key.includes('account')) return SUBJECT_TEXT_COLORS.accountancy;
  if (key.includes('business') || key.includes('bst')) return SUBJECT_TEXT_COLORS.business_studies;
  if (key.includes('economics') || key.includes('econ')) return SUBJECT_TEXT_COLORS.economics;
  if (key.includes('applied math')) return SUBJECT_TEXT_COLORS.applied_mathematics;
  return 'text-gray-400';
}
