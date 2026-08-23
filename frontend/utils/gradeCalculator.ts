export interface GradeResult {
  percentage: number;
  grade: string;
  color: string;
  desc: string;
  passed: boolean;
}

export interface SubjectGradeResult {
  grade: string;
  color: string;
  desc: string;
  passed: boolean;
}

const GRADE_SCALE = [
  { min: 90, grade: 'A+', color: 'text-emerald-500', desc: 'Outstanding' },
  { min: 80, grade: 'A', color: 'text-green-500', desc: 'Excellent' },
  { min: 70, grade: 'B', color: 'text-blue-500', desc: 'Very Good' },
  { min: 60, grade: 'C', color: 'text-indigo-500', desc: 'Good' },
  { min: 50, grade: 'D', color: 'text-amber-500', desc: 'Satisfactory' },
  { min: 0, grade: 'F', color: 'text-rose-500', desc: 'Needs Improvement' },
];

const PASSING_PERCENTAGE = 40;

export function calculateGrade(marks: number, maxMarks: number): GradeResult {
  if (maxMarks <= 0) {
    return { percentage: 0, grade: 'F', color: 'text-rose-500', desc: 'Invalid', passed: false };
  }

  const percentage = parseFloat(((marks / maxMarks) * 100).toFixed(2));
  const entry = GRADE_SCALE.find(g => percentage >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1]!;

  return {
    percentage,
    grade: entry.grade,
    color: entry.color,
    desc: entry.desc,
    passed: percentage >= PASSING_PERCENTAGE,
  };
}

export function calculateOverallGrade(subjects: Record<string, { marks: number | 'AB' | 'ML'; maxMarks: number }>): GradeResult {
  let totalObtained = 0;
  let totalMax = 0;

  for (const data of Object.values(subjects)) {
    const m = typeof data.marks === 'number' ? data.marks : 0;
    totalObtained += m;
    totalMax += data.maxMarks;
  }

  return calculateGrade(totalObtained, totalMax);
}

export function getGradeColor(grade: string): string {
  if (!grade) return 'text-slate-400 bg-slate-50 border-slate-100';
  if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-100';
  if (grade.startsWith('C')) return 'text-amber-600 bg-amber-50 border-amber-100';
  return 'text-rose-600 bg-rose-50 border-rose-100';
}

export function getGradeColorBg(grade: string): string {
  if (!grade) return 'bg-slate-100 text-slate-400';
  if (grade.startsWith('A')) return 'bg-green-100 text-green-700';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700';
  if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}
