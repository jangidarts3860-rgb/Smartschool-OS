import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import { examService, UnifiedResult } from '@/services/examService';
import { getDeterministicAvatar } from '@/constants';

export interface StudentMarks {
  studentId: string;
  name: string;
  rollNo: string;
  classId: string;
  section: string;
  photoUrl?: string;
  subjects: {
    name: string;
    maxMarks: number;
    obtainedMarks: number;
    grade: string;
  }[];
  totalMax: number;
  totalObtained: number;
  percentage: number;
  rank?: number;
  remarks: string;
}

import { calculateGrade, getGradeColor, getGradeColorBg } from '@/utils/gradeCalculator';

function unifiedResultToStudentMarks(r: UnifiedResult): StudentMarks {
  const subjectList = Object.entries(r.subjects).map(([name, data]) => ({
    name,
    maxMarks: data.maxMarks,
    obtainedMarks: typeof data.marks === 'number' ? data.marks : 0,
    grade: data.grade,
  }));

  return {
    studentId: r.studentId,
    name: r.studentName,
    rollNo: r.rollNo || r.studentId.substring(0, 6),
    classId: r.classId,
    section: r.section || '',
    subjects: subjectList,
    totalMax: r.maxTotalMarks,
    totalObtained: r.totalMarks,
    percentage: r.percentage,
    rank: r.rank,
    remarks: r.teacherRemarks || r.remarks || 'No remarks provided.',
  };
}

export const reportCardService = {
  fetchReportData: async (schoolId: string, examId: string, classId: string): Promise<StudentMarks[]> => {
    // Mock data is dev-only and requires an explicit opt-in to avoid
    // accidentally shipping fake students in production builds.
    const useMock =
      import.meta.env.DEV &&
      import.meta.env.VITE_USE_MOCK === 'true';

    if (useMock) {
      console.log("Using Mock Report Data");
      return [
        {
          studentId: 's1',
          name: 'Rahul Sharma',
          rollNo: '101',
          classId,
          section: 'A',
          photoUrl: getDeterministicAvatar('Rahul Sharma'),
          subjects: [
            { name: 'Mathematics', maxMarks: 100, obtainedMarks: 95, grade: 'A+' },
            { name: 'Science', maxMarks: 100, obtainedMarks: 88, grade: 'A' },
            { name: 'English', maxMarks: 100, obtainedMarks: 92, grade: 'A+' }
          ],
          totalMax: 300,
          totalObtained: 275,
          percentage: 91.6,
          remarks: 'Excellent performance!'
        },
        {
          studentId: 's2',
          name: 'Priya Verma',
          rollNo: '102',
          classId,
          section: 'A',
          photoUrl: getDeterministicAvatar('Priya Verma'),
          subjects: [
            { name: 'Mathematics', maxMarks: 100, obtainedMarks: 82, grade: 'A' },
            { name: 'Science', maxMarks: 100, obtainedMarks: 75, grade: 'B' },
            { name: 'English', maxMarks: 100, obtainedMarks: 80, grade: 'A' }
          ],
          totalMax: 300,
          totalObtained: 237,
          percentage: 79,
          remarks: 'Good effort, keep it up.'
        }
      ];
    }

    try {
      const resultsRef = collection(db, 'schools', schoolId, 'results');
      // Cap at 200 to avoid runaway memory on schools with 500+ students
      // per class. Use a paged query if a class can be larger than this.
      const q = query(
        resultsRef,
        where('examId', '==', examId),
        where('classId', '==', classId),
        limit(200)
      );
      const snap = await getDocs(q);

      const results: StudentMarks[] = [];

      for (const d of snap.docs) {
        const data = d.data() as UnifiedResult;
        results.push(unifiedResultToStudentMarks(data));
      }

      return reportCardService.calculateRanks(results);
    } catch (error) {
      console.error("Fetch Report Data Error:", error);
      throw error;
    }
  },

  calculateRanks: (students: StudentMarks[]): StudentMarks[] => {
    const sorted = [...students].sort((a, b) => b.percentage - a.percentage);
    return sorted.map((s, index) => ({
      ...s,
      rank: index + 1
    }));
  },

  generatePDF: async (schoolName: string, student: StudentMarks): Promise<jsPDF> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL ACADEMIC REPORT CARD', pageWidth / 2, 30, { align: 'center' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Student Name: ${student.name}`, 15, 55);
    doc.text(`Roll No: ${student.rollNo}`, 15, 62);
    doc.text(`Class: ${student.classId} - ${student.section}`, 15, 69);
    
    doc.text(`Rank: #${student.rank}`, pageWidth - 45, 55);
    doc.text(`Percentage: ${student.percentage}%`, pageWidth - 45, 62);

    (doc as any).autoTable({
      startY: 80,
      head: [['Subject', 'Max Marks', 'Obtained', 'Grade']],
      body: student.subjects.map(s => [s.name, s.maxMarks, s.obtainedMarks, s.grade]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 15, finalY + 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Marks: ${student.totalObtained} / ${student.totalMax}`, 15, finalY + 30);
    doc.text(`Result Status: ${student.percentage >= 40 ? 'PASSED' : 'FAILED'}`, 15, finalY + 37);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Teacher Remarks:', 15, finalY + 50);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text(student.remarks, 15, finalY + 58, { maxWidth: 180 });

    const footerY = 270;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, footerY, 65, footerY);
    doc.line(pageWidth - 65, footerY, pageWidth - 15, footerY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Class Teacher', 30, footerY + 7);
    doc.text('Parent Signature', pageWidth - 50, footerY + 7);

    return doc;
  },

  downloadZip: async (schoolName: string, students: StudentMarks[]) => {
    const zip = new JSZip();
    
    for (const student of students) {
      const doc = await reportCardService.generatePDF(schoolName, student);
      const pdfBlob = doc.output('blob');
      zip.file(`${student.rollNo}_${student.name.replace(/\s+/g, '_')}.pdf`, pdfBlob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `ReportCards_${new Date().toLocaleDateString()}.zip`;
    link.click();
  }
};
