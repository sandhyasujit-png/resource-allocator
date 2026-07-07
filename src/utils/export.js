import * as XLSX from 'xlsx';

export function exportToExcel(project) {
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Inputs summary ---
  const inputRows = [
    ['Project Name', project.name],
    ['Start Date', project.settings.startDate],
    ['Standard Hrs/Week', project.settings.standardHoursPerWeek],
    ['Currency', project.settings.currency],
    [],
    ['Phase', 'Weeks'],
    ...project.phases.map(p => [p.name, p.weeks]),
    [],
    ['Resource', 'Activity', 'Phase', 'Location', 'Type', 'CapEx/OpEx', '# Resources', 'Hrs/Week', 'Hourly Rate', 'Total Hours', 'Total Cost'],
    ...project.resources.map(r => {
      const pw    = project.phases.find(p => p.name === r.phase)?.weeks || 0;
      const count = Number(r.count) || 1;
      const hrs   = (Number(r.hrsPerWeek) || 0) * pw * count;
      const cost  = hrs * (Number(r.hourlyRate) || 0);
      return [r.resource, r.activity, r.phase, r.location, r.type, r.capexOpex,
              count, r.hrsPerWeek, r.hourlyRate, hrs, cost];
    }),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(inputRows), 'Inputs');

  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_ResourceAllocator.xlsx`);
}

export function exportTabToCSV(rows, filename) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createEle