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
    ['Resource', 'Activity', 'Phase', 'Location', 'Type', 'CapEx/OpEx', 'Hrs/Week', 'Hourly Rate', 'Total Hours', 'Total Cost'],
    ...project.resources.map(r => [
      r.resource, r.activity, r.phase, r.location, r.type, r.capexOpex,
      r.hrsPerWeek, r.hourlyRate,
      (r.hrsPerWeek || 0) * (project.phases.find(p => p.name === r.phase)?.weeks || 0),
      (r.hrsPerWeek || 0) * (project.phases.find(p => p.name === r.phase)?.weeks || 0) * (r.hourlyRate || 0),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(inputRows), 'Inputs');

  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_ResourceAllocator.xlsx`);
}

export function exportTabToCSV(rows, filename) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
