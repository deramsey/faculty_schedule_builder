import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportToPDF = async (scheduleElement, summaryElement, facultyInfo) => {
  // Render the schedule to a canvas
  const scheduleCanvas = await html2canvas(scheduleElement, {
    scale: 2, // Increase resolution
    useCORS: true,
    logging: false,
  });

  // Render the summary to a canvas
  const summaryCanvas = await html2canvas(summaryElement, {
    scale: 2, // Increase resolution
    useCORS: true,
    logging: false,
  });

  // Create a new PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'letter'
  });

  // Get page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Calculate scaling factor for schedule
  const scheduleScale = Math.min(
    pageWidth / scheduleCanvas.width,
    (pageHeight * 0.8) / scheduleCanvas.height // Use 80% of page height for schedule
  );

  // Calculate dimensions of scaled schedule
  const scheduleWidth = scheduleCanvas.width * scheduleScale;
  const scheduleHeight = scheduleCanvas.height * scheduleScale;

  // Calculate position to center the schedule
  const scheduleX = (pageWidth - scheduleWidth) / 2;
  const scheduleY = 20; // Leave some space at the top

  // Add the scaled schedule to the PDF
  pdf.addImage(
    scheduleCanvas.toDataURL('image/jpeg', 1.0),
    'JPEG',
    scheduleX,
    scheduleY,
    scheduleWidth,
    scheduleHeight
  );

  // Calculate scaling factor for summary
  const summaryScale = Math.min(
    (pageWidth * 0.9) / summaryCanvas.width, // Use 90% of page width for summary
    (pageHeight * 0.2) / summaryCanvas.height // Use 20% of page height for summary
  );

  // Calculate dimensions of scaled summary
  const summaryWidth = summaryCanvas.width * summaryScale;
  const summaryHeight = summaryCanvas.height * summaryScale;

  // Calculate position for summary (below schedule)
  const summaryX = (pageWidth - summaryWidth) / 2;
  const summaryY = scheduleY + scheduleHeight + 20; // 20px gap between schedule and summary

  // Add the scaled summary to the PDF
  pdf.addImage(
    summaryCanvas.toDataURL('image/jpeg', 1.0),
    'JPEG',
    summaryX,
    summaryY,
    summaryWidth,
    summaryHeight
  );


  // Save the PDF
  pdf.save(`faculty_schedule_${facultyInfo.name}_${facultyInfo.semester}.pdf`);
};