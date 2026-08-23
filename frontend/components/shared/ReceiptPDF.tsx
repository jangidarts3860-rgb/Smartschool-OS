import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Share2, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

/**
 * Props for the receipt component.
 */
interface Props {
    receiptNo: string;
    studentName: string;
    studentId: string;
    classId: string;
    amount: number;
    feeType: string;
    schoolId: string;
    onClose: () => void;
}

/**
 * Minimal school profile used for the receipt header.
 */
interface SchoolProfile {
    schoolName: string;
    address: string;
    contactEmail: string;
    logoUrl?: string;
    phone?: string;
}

/**
 * ReceiptPDF – renders a modal with receipt details and allows the user to
 * download a PDF, print, or share the receipt via WhatsApp.
 */
const ReceiptPDF: React.FC<Props> = ({
    receiptNo,
    studentName,
    studentId,
    classId,
    amount,
    feeType,
    schoolId,
    onClose,
}) => {
    const [school, setSchool] = useState<SchoolProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Fetch school profile for header information
    useEffect(() => {
        const fetchSchool = async () => {
            try {
                const snap = await getDoc(doc(db, 'schools', schoolId, 'settings', 'profile'));
                if (snap.exists()) {
                    setSchool(snap.data() as SchoolProfile);
                } else {
                    // Fallback profile if none exists
                    setSchool({
                        schoolName: 'SmartSchool Academy',
                        address: '',
                        contactEmail: '',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch school profile', error);
                toast.error('Unable to load school information');
            } finally {
                setLoading(false);
            }
        };
        fetchSchool();
    }, [schoolId]);

    const generatePDF = async () => {
        setGenerating(true);
        try {
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();

            // --- Header Background ---
            pdf.setFillColor(245, 247, 250);
            pdf.rect(0, 0, pageWidth, 50, 'F');

            // --- School Branding ---
            pdf.setFontSize(22);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(30, 41, 59);
            pdf.text(school?.schoolName ?? 'SMARTSCHOOL ACADEMY', pageWidth / 2, 25, { align: 'center' });

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(100);
            pdf.text(school?.address || 'Institutional Area, Education Hub', pageWidth / 2, 32, { align: 'center' });
            pdf.text(`Contact: ${school?.contactEmail || 'support@smartschool.io'} | Ph: ${school?.phone || '+91 9876543210'}`, pageWidth / 2, 38, { align: 'center' });

            // --- Receipt Metadata ---
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(15, 55, pageWidth - 15, 55);

            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(79, 70, 229);
            pdf.text('OFFICIAL PAYMENT RECEIPT', 20, 65);

            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`Receipt No: ${receiptNo}`, pageWidth - 20, 65, { align: 'right' });
            pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 71, { align: 'right' });

            // --- Student Details Card ---
            pdf.setFillColor(248, 250, 252);
            pdf.roundedRect(15, 80, pageWidth - 30, 40, 3, 3, 'F');
            
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(30, 41, 59);
            pdf.text('Billed To:', 25, 90);
            pdf.setFont("helvetica", "normal");
            pdf.text(`${studentName} (ID: ${studentId})`, 25, 100);
            pdf.text(`Class & Section: ${classId}`, 25, 108);

            // --- Fee Breakdown Table ---
            const startY = 135;
            pdf.setFillColor(79, 70, 229);
            pdf.rect(15, startY, pageWidth - 30, 10, 'F');
            
            pdf.setTextColor(255);
            pdf.setFont("helvetica", "bold");
            pdf.text('Description', 20, startY + 7);
            pdf.text('Amount (INR)', pageWidth - 20, startY + 7, { align: 'right' });

            pdf.setTextColor(30, 41, 59);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Academic Fee Collection - ${feeType}`, 20, startY + 22);
            pdf.text(`₹${amount.toLocaleString('en-IN')}.00`, pageWidth - 20, startY + 22, { align: 'right' });

            pdf.line(15, startY + 30, pageWidth - 15, startY + 30);

            // --- Total ---
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text('Total Amount Paid:', 110, startY + 45);
            pdf.setTextColor(16, 185, 129);
            pdf.text(`₹${amount.toLocaleString('en-IN')}.00`, pageWidth - 20, startY + 45, { align: 'right' });

            // --- Signature & Footer ---
            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184);
            pdf.text('This is a computer-generated receipt. No signature is required.', pageWidth / 2, 270, { align: 'center' });
            
            pdf.setFontSize(10);
            pdf.setTextColor(30, 41, 59);
            pdf.text('Principal / Accounts Dept.', pageWidth - 20, 250, { align: 'right' });
            pdf.line(pageWidth - 60, 245, pageWidth - 20, 245);

            pdf.save(`Receipt_${receiptNo}.pdf`);
            toast.success('Professional Receipt Generated');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate PDF');
        } finally {
            setGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        const message = `Receipt ${receiptNo}\nStudent: ${studentName}\nAmount: ₹${amount}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="animate-spin text-white w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold mb-4">Payment Receipt</h2>
                <div className="space-y-2 text-sm">
                    <p><strong>Receipt #:</strong> {receiptNo}</p>
                    <p><strong>Student:</strong> {studentName} ({studentId})</p>
                    <p><strong>Class:</strong> {classId}</p>
                    <p><strong>Fee Type:</strong> {feeType}</p>
                    <p><strong>Amount Paid:</strong> ₹{amount.toFixed(2)}</p>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button
                        onClick={generatePDF}
                        disabled={generating}
                        className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {generating ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptPDF;
