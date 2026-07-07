import { COLORS, monthlyCosts, allMonthKeys, fmt } from '../utils/calculations';

export default function MonthlyCostTab({ project }) {
  const { resources, phases, settings } = project;
  const startDate = settings.startDate;
  const currency = settings.currency || 'USD';

  if (!startDate) {
    return <div className="p-8 text-gray-400 text-sm">Set a project start date in the Inputs tab to see monthly costs.</div>;
  }
  if (resources.length === 0) {
    return <div className="p-8 text-gray-400 text-sm">No resources defined. Add them in the Inputs tab.</div>;
  }

  const months = allMonthKeys(resources, phases, startDate);

  const fmtMonth = (key) => {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // grand total, capex, opex per month
  const grandTotals = {};
  const capexTotals = {};
  const opexTotals  = {};
  months.forEach(m => { grandTotals[m] = 0; capexTotals[m] = 0; opexTotals[m] = 0; });

  const resourceCostMaps = resources.map(r => {
    const costs = monthlyCosts(r, phases, startDate);
    months.forEach(m => {
      const v = costs[m] || 0;
      grandTotals[m] += v;
      if (r.capexOpex === 'CapEx') capexTotals[m] += v;
      else opexTotals[m] += v;
    });
    return costs;
  });

  const rowTotal = (costMap) => Object.values(costMap).reduce((s, v) => s + v, 0);

  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="text-xs border-collapse" style={{ minWidth: `${Math.max(400, 200 + months.length * 90)}px` }}>
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left sticky left-0 bg-gray-100 z-10 min-w-[160px]">Resource</th>
              <th className="border border-gray-300 px-2 py-2 whitespace-nowrap">CapEx/OpEx</th>
              {months.map(m => (
                <th key={m} className="border border-gray-300 px-2 py-2 text-center min-w-[80px] whitespace-nowrap">{fmtMonth(m)}</th>
              ))}
              <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r, i) => {
              const costs = resourceCostMaps[i];
              const rowBg = r.capexOpex === 'CapEx' ? COLORS.capex : COLORS.opex;
              return (
                <tr key={r.id} style={{ background: rowBg }}>
                  <td className="border border-gray-300 px-3 py-1 sticky left-0 z-10 font-medium" style={{ background: rowBg }}>
                    {r.resource}{r.activity ? ` – ${r.activity}` : ''}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{r.capexOpex}</td>
                  {months.map(m => {
                    const v = costs[m] || 0;
                    return (
                      <td key={m} className="border border-gray-300 px-2 py-1 text-right"
                        style={{ background: v === 0 ? '#f3f4f6' : COLORS.calc, color: v === 0 ? '#9ca3af' : undefined }}>
                        {v === 0 ? '$0' : fmt(v, currency)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-2 py-1 text-right font-semibold">{fmt(rowTotal(costs), currency)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {[
              { label: 'Grand Total', map: grandTotals, bg: '#e5e7eb' },
              { label: 'CapEx Total', map: capexTotals, bg: COLORS.capex },
              { label: 'OpEx Total',  map: opexTotals,  bg: COLORS.opex  },
            ].map(({ label, map, bg }) => (
              <tr key={label} style={{ background: bg }} className="font-semibold">
                <td className="border border-gray-300 px-3 py-1 sticky left-0 z-10" style={{ background: bg }}>{label}</td>
                <td className="border border-gray-300 px-2 py-1" />
                {months.map(m => (
                  <td key={m} className="border border-gray-300 px-2 py-1 text-right">{fmt(map[m] || 0, currency)}</td>
                ))}
                <td className="border border-gray-300 px-2 py-1 text-right">{fmt(rowTotal(map), currency)}</td>
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
