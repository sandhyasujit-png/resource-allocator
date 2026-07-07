/**
 * Core calculation utilities for Resource Allocator.
 *
 * Color coding constants (used across tabs):
 *   INPUT_BG   = '#FFF2CC'  yellow  – user-entered cells
 *   CALC_BG    = '#DEEAF1'  teal    – calculated cells
 *   CAPEX_BG   = '#E2EFDA'  green   – CapEx rows
 *   OPEX_BG    = '#FCE4D6'  orange  – OpEx rows
 *   OVER_COLOR = 'red'              – allocation > 100%
 */

export const COLORS = {
  input:     '#FFF2CC',
  inputText: '#111827',
  calc:      '#D0E8F2',
  calcText:  '#0c4a6e',
  capex:     '#D6EDD0',
  capexText: '#111827',
  opex:      '#FAD9C8',
  opexText:  '#111827',
  over:      '#dc2626',
};

/** Returns inline style object for an input cell */
export const inputStyle  = () => ({ background: COLORS.input,  color: COLORS.inputText });
/** Returns inline style object for a calculated cell */
export const calcStyle   = () => ({ background: COLORS.calc,   color: COLORS.calcText  });
/** Returns inline style object for a row based on CapEx/OpEx */
export const rowStyle    = (capexOpex) => capexOpex === 'CapEx'
  ? { background: COLORS.capex, color: COLORS.capexText }
  : { background: COLORS.opex,  color: COLORS.opexText  };

/** Total project duration in weeks */
export function totalWeeks(phases) {
  return phases.reduce((s, p) => s + (Number(p.weeks) || 0), 0);
}

/** Total hours for a resource-activity row */
export function totalHours(hrsPerWeek, phaseWeeks) {
  return (Number(hrsPerWeek) || 0) * (Number(phaseWeeks) || 0);
}

/** Weekly allocation % */
export function weeklyAllocPct(hrsPerWeek, stdHrsPerWeek) {
  const std = Number(stdHrsPerWeek) || 40;
  return std > 0 ? ((Number(hrsPerWeek) || 0) / std) * 100 : 0;
}

/**
 * Monthly cost for a resource-activity row.
 * Returns an object keyed by "YYYY-MM" → cost (0 if outside phase).
 */
export function monthlyCosts(resource, phases, projectStartDate) {
  if (!projectStartDate) return {};
  const hrsPerWeek = Number(resource.hrsPerWeek) || 0;
  const rate = Number(resource.hourlyRate) || 0;
  const result = {};

  let weekOffset = 0;
  for (const phase of phases) {
    if (phase.name !== resource.phase) {
      weekOffset += Number(phase.weeks) || 0;
      continue;
    }
    const phaseWeeks = Number(phase.weeks) || 0;
    const phaseStart = addWeeks(new Date(projectStartDate), weekOffset);
    const phaseEnd   = addWeeks(phaseStart, phaseWeeks);

    // iterate months covered by this phase
    let cursor = new Date(phaseStart.getFullYear(), phaseStart.getMonth(), 1);
    while (cursor < phaseEnd) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = new Date(cursor);
      const monthEnd   = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const effectiveStart = phaseStart > monthStart ? phaseStart : monthStart;
      const effectiveEnd   = phaseEnd   < monthEnd   ? phaseEnd   : monthEnd;
      const days = Math.max(0, (effectiveEnd - effectiveStart) / 86400000);
      result[key] = (result[key] || 0) + (days / 7) * hrsPerWeek * rate;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    weekOffset += phaseWeeks;
  }
  return result;
}

function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** CapEx/OpEx totals via filter */
export function capexOpexTotals(resources, phases, startDate) {
  let capex = 0, opex = 0;
  for (const r of resources) {
    const costs = monthlyCosts(r, pha