import { COLORS, totalWeeks, weeklyAllocPct } from '../utils/calculations';

export default function WeeklyAllocationTab({ project }) {
  const { phases, resources, settings } = project;
  const stdHrs = Number(settings.standardHoursPerWeek) || 40;
  const numWeeks = totalWeeks(phases);
  const weeks = Array.from({ length: numWeeks }, (_, i) => i + 1);

  // Build a map: week number → phase name
  const weekPhase = {};
  let w = 1;
  for (const ph of phases) {
    for (let i = 0; i < ph.weeks; i++) weekPhase[w++] = ph.name;
  }

  // For each resource, what weeks are they active?
  const resourceWeekMap = (r) => {
    let start = 1;
    for (const ph of phases) {
      if (ph.name === r.phase) {
        return { start, end: start + Number(ph.weeks) - 1 };
      }
      start += Number(ph.weeks) || 0;
    }
    return { start: 0, end: -1 };
  };

  // Column totals per week
  const colTotals = weeks.map(wk => {
    return resources.reduce((sum, r) => {
      const { start, end } = resourceWeekMap(r);
      if (wk >= start && wk <= end) sum += weeklyAllocPct(r.hrsPerWeek, stdHrs);
      return sum;
    }, 0);
  });

  if (resources.length === 0) {
    return <div className="p-8 text-gray-400 text-sm">No resources defined. Add them in the Inputs tab.</div>;
  }

  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="text-xs border-collapse" style={{ minWidth: `${Math.max(600, 200 + numWeeks * 52)}px` }}>
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left sticky left-0 bg-gray-100 z-10 min-w-[120px]">Resource</th>
              <th className="border border-gray-300 px-3 py-2 text-left sticky left-[120px] bg-gray-100 z-10 min-w-[140px]">Activity</th>
              <th className="border border-gray-300 px-2 py-2 whitespace-nowrap">CapEx/OpEx</th>
              <th className="border border-gray-300 px-2 py-2 whitespace-nowrap">Type</th>
              {weeks.map(wk => (
                <th key={wk} className="border border-gray-300 px-1 py-2 text-center min-w-[48px]">W{wk}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((r, i) => {
              const { start, end } = resourceWeekMap(r);
              const rowBg = r.capexOpex === 'CapEx' ? COLORS.capex : COLORS.opex;
              return (
                <tr key={r.id} style={{ background: rowBg }}>
                  <td className="border border-gray-300 px-3 py-1 sticky left-0 z-10 font-medium" style={{ background: rowBg }}>{r.resource}</td>
                  <td className="border border-gray-300 px-3 py-1 sticky left-[120px] z-10" style={{ background: rowBg }}>{r.activity}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{r.capexOpex}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{r.type}</td>
                  {weeks.map(wk => {
                    const active = wk >= start && wk <= end;
                    const pct = active ? weeklyAllocPct(r.hrsPerWeek, stdHrs) : 0;
                    const over = pct > 100;
                    return (
                      <td key={wk} className="border border-gray-300 px-1 py-1 text-center"
                        style={{ background: active ? COLORS.calc : '#f9fafb', color: over ? COLORS.over : undefined }}>
                        {active ? `${pct.toFixed(0)}%` : ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="bg-gray-200 font-semibold">
              <td className="border border-gray-300 px-3 py-1 sticky left-0 bg-gray-200 z-10" colSpan={4}>Total Allocation %</td>
              {colTotals.map((t, i) => (
                <td key={i} className="border border-gray-300 px-1 py-1 text-center"
                  style={{ color: t > 100 ? COLORS.over : undefined }}>
                  {t > 0 ? `${t.toFixed(0)}%` : ''}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
