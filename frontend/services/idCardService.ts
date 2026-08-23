import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { User } from '@/types';

export interface IDCardData {
  schoolName: string;
  schoolLogo?: string;
  schoolAddress: string;
  schoolPhone: string;
  academicYear: string;
  validUntil?: string; // Made optional
}

export const idCardService = {
  /**
   * Generates a single Student ID Card PDF
   */
  generateIDCard: async (student: User, school: IDCardData) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [54, 86]
    });

    await drawCard(doc, student, school, 0, 0);
    doc.save(`ID_Card_${student.name.replace(/\s+/g, '_')}.pdf`);
  },

  /**
   * Generates a bulk PDF with multiple ID cards
   */
  generateBulkIDCards: async (students: User[], school: IDCardData) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [54, 86]
    });

    for (let i = 0; i < students.length; i++) {
      if (i > 0) doc.addPage([54, 86], 'portrait');
      await drawCard(doc, students[i]!, school, 0, 0);
    }

    doc.save(`Bulk_ID_Cards_${new Date().getTime()}.pdf`);
  },

  /**
   * Generates a QR Code Data URL
   */
  generateQRCode: async (studentId: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(studentId, {
        margin: 1,
        width: 100,
        color: { dark: '#1e293b', light: '#ffffff' }
      });
    } catch (err) { return ''; }
  }
};

async function drawCard(doc: jsPDF, student: User, school: IDCardData, x: number, y: number) {
  const width = 54;
  const height = 86;

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, width, height, 'F');
  doc.setFillColor(79, 70, 229); // Premium Indigo
  doc.rect(x, y, width, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(school.schoolName.toUpperCase(), width - 10);
  doc.text(nameLines, x + width / 2, y + 8, { align: 'center' });

  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text(school.academicYear, x + width / 2, y + 18, { align: 'center' });

  const photoSize = 22;
  const photoY = y + 25;
  const photoX = x + (width - photoSize) / 2;
  
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text((student.name || 'Unknown Student').toUpperCase(), x + width / 2, y + 52, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('STUDENT ID', x + width / 2, y + 56, { align: 'center' });
  doc.setTextColor(30, 41, 59);
  doc.text(student.uniqueId || student.id?.substring(0, 8).toUpperCase() || 'N/A', x + width / 2, y + 59, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const leftCol = x + 6;
  const rightCol = x + 30;
  let dY = y + 65;

  doc.text('CLASS:', leftCol, dY);
  doc.text('BLOOD GP:', rightCol, dY);
  
  doc.setTextColor(30, 41, 59);
  doc.text(student.classId || student.class || 'N/A', leftCol + 8, dY);
  doc.text(student.bloodGroup || 'O+', rightCol + 11, dY);

  dY += 4;
  doc.setTextColor(100, 116, 139);
  doc.text('PARENT:', leftCol, dY);
  doc.setTextColor(30, 41, 59);
  doc.text(student.phone || 'N/A', leftCol + 10, dY);

  const qr = await idCardService.generateQRCode(student.id);
  if (qr) doc.addImage(qr, 'PNG', x + 35, y + 70, 12, 12);

  doc.setFontSize(4);
  doc.setTextColor(148, 163, 184);
  doc.text('NFC SECURED', x + 35, y + 83);

  doc.setFillColor(248, 250, 252);
  doc.rect(x, y + 84, width, 2, 'F');
  doc.setFontSize(4);
  doc.setTextColor(100, 116, 139);
  doc.text(school.schoolAddress, x + width / 2, y + 85.5, { align: 'center' });
}
