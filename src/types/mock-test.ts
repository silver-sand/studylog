export interface MockTest {
  id: string;
  examType: string;
  subject: string;
  testName: string;
  score: number;
  maxMarks: number;
  percentage: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface CreateMockTestData {
  examType?: string;
  subject: string;
  testName: string;
  score: number;
  maxMarks: number;
  date: string;
  notes?: string;
}

export interface MockTestAnalytics {
  totalTests: number;
  averagePercentage: number;
  bestScore: { testName: string; percentage: number; subject: string; date: string } | null;
  worstScore: { testName: string; percentage: number; subject: string; date: string } | null;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  recentTests: MockTest[];
  subjectBreakdown: { subject: string; tests: number; avgPercentage: number }[];
}
