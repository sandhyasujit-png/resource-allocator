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
  input:  '#FFF2CC',
  calc:   '#DEEAF1',
  capex:  '#E2EFDA',
  opex:   '#FCE4D6',
  over:   '#ef4444',
};

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
    const costs = monthlyCosts(r, phases, startDate);
    const total = Object.values(costs).reduce((s, v) => s + v, 0);
    if (r.capexOpex === 'CapEx') capex += total;
    else opex += total;
  }
  return { capex, opex, total: capex + opex };
}

/** Sorted unique month keys across all resources */
export function allMonthKeys(resources, phases, startDate) {
  const keys = new Set();
  for (const r of resources) {
    Object.keys(monthlyCosts(r, phases, startDate)).forEach(k => keys.add(k));
  }
  return [...keys].sort();
}

export function fmt(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}
