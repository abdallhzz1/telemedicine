import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Prescription } from './firestore';

export const generatePrescriptionPDF = (prescription: Prescription) => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = [6, 182, 212] as [number, number, number]; // Cyan-500 #06b6d4
    const secondaryColor = [15, 23, 42] as [number, number, number]; // Slate-900 #0f172a

    // Header Background
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical Prescription', 105, 20, { align: 'center' });

    // Doctor Info (Left)
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dr. ${prescription.doctorName || 'Unknown'}`, 14, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('General Practitioner', 14, 60); // Could be dynamic if we had specialization here

    // Date (Right)
    doc.setFontSize(10);
    doc.text(`Date: ${format(prescription.createdAt, 'MMM dd, yyyy')}`, 196, 55, { align: 'right' });
    doc.text(`Prescription ID: #${prescription.id.slice(0, 8)}`, 196, 60, { align: 'right' });

    // Patient Info Section
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 65, 196, 65);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Details:', 14, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${prescription.patientName || 'Patient'}`, 14, 82);
    // doc.text(`Age: 32`, 14, 88); // Placeholder if age isn't available

    // Medicines Table
    const tableColumn = ["Medicine Name", "Dosage", "Duration", "Notes"];
    const tableRows: any[] = [];

    prescription.medicines.forEach(med => {
        const medData = [
            med.name,
            med.dose,
            med.duration,
            med.notes || '-'
        ];
        tableRows.push(medData);
    });

    autoTable(doc, {
        startY: 95,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 10,
            cellPadding: 3,
        },
        alternateRowStyles: {
            fillColor: [240, 250, 255],
        },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 15, 210, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Telemedicine Platform', 105, pageHeight - 9, { align: 'center' });
    doc.text('This is a computer-generated document. No signature is required.', 105, pageHeight - 5, { align: 'center' });

    // Save the PDF
    doc.save(`Prescription_${prescription.patientName}_${format(prescription.createdAt, 'yyyy-MM-dd')}.pdf`);
};
