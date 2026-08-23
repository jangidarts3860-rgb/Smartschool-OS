import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { FeeRecord, AttendanceRecord, ResultRecord } from '@/types';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// FIXED: Type-safe monthly data interface
export interface MonthlyFeeData {
  month: string;
  collected: number;
  pending: number;
}

// FIXED: Type-safe chart data interface
export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

// FIXED: Type-safe fee stats result interface
export interface FeeStatsResult {
  totalRevenue: number;
  collected: number;
  pending: number;
  monthlyData: Record<string, MonthlyFeeData>;
  chartData: MonthlyFeeData[];
}

// FIXED: Type-safe CSV data (generic)
export type CSVExportData = Record<string, string | number | boolean | null | undefined>;

// FIXED: Type-safe PDF row data
export type PDFExportRow = (string | number)[];

const IS_DEMO_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * CSV Injection Prevention
 * Prevents formula injection attacks via CSV cells starting with =, +, -, @, tab, or CRLF
 */
const sanitizeForCSV = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r\n]/.test(str)) {
    return `'${str}`;
  }
  return str;
};

const MOCK_MONTHLY_FEES: MonthlyFeeData[] = [
  { month: 'Jan', collected: 820000, pending: 120000 },
  { month: 'Feb', collected: 910000, pending: 98000 },
  { month: 'Mar', collected: 880000, pending: 135000 },
  { month: 'Apr', collected: 1220000, pending: 200000 },
  { month: 'May', collected: 1480000, pending: 150000 },
  { month: 'Jun', collected: 1150000, pending: 175000 }
];

export const reportService = {
  // Aggregate Fee Collection Stats
  getFeeStats: async (schoolId: string, startDate: Date, endDate: Date): Promise<FeeStatsResult> => {
    if (IS_DEMO_MODE) {
      const totalRevenue = MOCK_MONTHLY_FEES.reduce((a, m) => a + m.collected + m.pending, 0);
      return {
        totalRevenue,
        collected: MOCK_MONTHLY_FEES.reduce((a, m) => a + m.collected, 0),
        pending: MOCK_MONTHLY_FEES.reduce((a, m) => a + m.pending, 0),
        monthlyData: MOCK_MONTHLY_FEES.reduce((acc, m) => { acc[m.month] = m; return acc; }, {} as Record<string, MonthlyFeeData>),
        chartData: MOCK_MONTHLY_FEES
      };
    }
    try {
      const feeRef = collection(db, 'schools', schoolId, 'fees');
      const q = query(
        feeRef,
        where('dueDate', '>=', startDate.toISOString()),
        where('dueDate', '<=', endDate.toISOString())
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map((d: any) => d.data() as FeeRecord);
      
      // FIXED: Proper typing for monthly data accumulator
      const stats: FeeStatsResult = {
        totalRevenue: data.reduce((acc: any, curr: any) => acc + (curr.totalAmount || 0), 0),
        collected: data.reduce((acc: any, curr: any) => acc + (curr.amountPaid || 0), 0),
        pending: data.reduce((acc: any, curr: any) => acc + ((curr.totalAmount || 0) - (curr.amountPaid || 0)), 0),
        monthlyData: data.reduce((acc: Record<string, MonthlyFeeData>, curr: any) => {
          const month = curr.month || 'Unknown';
          if (!acc[month]) {
            acc[month] = { month, collected: 0, pending: 0 };
          }
          acc[month].collected += curr.amountPaid || 0;
          acc[month].pending += (curr.totalAmount || 0) - (curr.amountPaid || 0);
          return acc;
        }, {}),
        chartData: []
      };

      stats.chartData = Object.values(stats.monthlyData);

      return stats;
    } catch (error) {
      console.error("Fee Stats Error:", error);
      throw error;
    }
  },

  // Aggregate Attendance Stats
  getAttendanceStats: async (schoolId: string, date: string): Promise<ChartDataPoint[]> => {
    if (IS_DEMO_MODE) {
      return [
        { name: 'Present', value: 418, color: '#10b981' },
        { name: 'Absent', value: 23, color: '#f43f5e' },
        { name: 'Late', value: 14, color: '#f59e0b' }
      ];
    }
    try {
      const attRef = collection(db, 'schools', schoolId, 'attendance');
      const q = query(attRef, where('date', '==', date));
      const snap = await getDocs(q);
      const data = snap.docs.map((d: any) => d.data() as AttendanceRecord);

      return [
        { name: 'Present', value: data.filter((d: any) => d.status === 'PRESENT').length, color: '#10b981' },
        { name: 'Absent', value: data.filter((d: any) => d.status === 'ABSENT').length, color: '#f43f5e' },
        { name: 'Late', value: data.filter((d: any) => d.status === 'LATE').length, color: '#f59e0b' }
      ];
    } catch (error) {
      return [];
    }
  },

  // Export to CSV with CSV injection prevention
  exportCSV: <T extends CSVExportData>(data: T[], filename: string): void => {
    const sanitized = data.map(row => {
      const sanitizedRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        sanitizedRow[key] = sanitizeForCSV(value);
      }
      return sanitizedRow;
    });
    const csv = Papa.unparse(sanitized);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  },

  // Export to PDF - FIXED: Proper typed parameters
  exportPDF: (title: string, columns: string[], rows: PDFExportRow[], filename: string): void => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title.toUpperCase(), 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
     autoTable(doc, {
       startY: 35,
       head: [columns],
       body: rows,
       theme: 'grid',
       headStyles: { fillColor: [79, 70, 229] },
     });

    doc.save(`${filename}.pdf`);
  }
};
