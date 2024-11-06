import * as XLSX from 'xlsx';

const formatTimeForExcel = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours + minutes / 60) / 24;
};

const setCellWidths = (ws) => {
  const wscols = [
    { wch: 15 }, // Column A
    { wch: 15 }, // Column B
    { wch: 15 }, // Column C
    { wch: 15 }, // Column D
    { wch: 30 }, // Column E
    { wch: 20 }, // Column F
    { wch: 20 }, // Column G
  ];
  ws['!cols'] = wscols;
};

const applyStyles = (ws) => {
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const headerAddress = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[headerAddress]) continue;
    ws[headerAddress].s = { font: { bold: true } };
  }
};

export const exportScheduleToExcel = (schedule, facultyInfo, totals, totalHours, totalMinusOverload) => {

  // Prepare data for detailed events
  const eventsData = [
    ['Detailed Schedule'],
    ['Day', 'Type', 'Start Time', 'End Time', 'Description', 'Class Name', 'Location', 'Hours', 'Overload', 'Temporary']
  ];

  // Process events for detailed listing
  Object.entries(schedule).forEach(([day, events]) => {
    events.forEach(event => {
      eventsData.push([
        day.charAt(0).toUpperCase() + day.slice(1),
        event.type,
        event.startTime,
        event.endTime,
        event.description || '',
        event.className || '',
        event.classLocation || '',
        event.duration.toFixed(2),
        event.isOverload ? 'Yes' : 'No',
        event.isTemporary ? 'Yes' : 'No'
      ]);
    });
  });

  // Prepare summary data
  const summaryData = [
    ['Hours Summary'],
    ['Category', 'Hours'],
    ['Teaching Hours', totals.teachingHours.toFixed(2)],
    ['Student Hours', totals.studentHours.toFixed(2)],
    ['Campus Hours', totals.campusHours.toFixed(2)],
    ['Overload Hours', totals.overloadHours.toFixed(2)],
    ['Total Hours', totalHours.toFixed(2)],
    ['Total Minus Overload', totalMinusOverload.toFixed(2)]
  ];

  // Create workbook and worksheets
  const wb = XLSX.utils.book_new();


  // Add Detailed Events worksheet
  const wsEvents = XLSX.utils.aoa_to_sheet(eventsData);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Detailed Events');

  // Add Summary worksheet
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Apply formatting to all worksheets
  [wsEvents, wsSummary].forEach(ws => {
    setCellWidths(ws);
    applyStyles(ws);
  });

  // Generate filename
  const filename = `${facultyInfo.name.replace(/\s+/g, '_')}_schedule_${facultyInfo.semester.replace(/\s+/g, '_')}.xlsx`;

  // Save the file
  XLSX.writeFile(wb, filename);
  
  return filename;
};