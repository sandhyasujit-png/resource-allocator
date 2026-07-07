import { COLORS, inputStyle, calcStyle, rowStyle, totalHours, weeklyAllocPct, totalWeeks, capexOpexTotals, fmt } from '../utils/calculations';
import { exportToExcel, exportTabToCSV } from '../utils/export';

const PHASES    = ['Initiation','Planning','Analysis','Design','Build','Testing','Deployment'];
const LOCATIONS = ['Onshore','Offshore','Nearshore'];
const TYPES     = ['FTE','Contractor','Vendor'];
const CAPEX_OPEX = ['CapEx','OpEx'];

const PHASE_COLORS = ['#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6'];

const DEFAULT_ROW = () => ({
  id: crypto.randomUUID(),
  resource: '', activity: '', phase: PHASES[0],
  location: LOCATIONS[0], type: TYPES[0], capexOpex: CAPEX_OPEX[0],
  count: 1, hrsPerWeek: '', hourlyRate: '',
});

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h2>
      {action}
    </div>
  );
}

export default function InputsTab({ project, onChange, onTabSwitch }) {
  const { settings, phases, resources } = project;
  const stdHrs    = Number(settings.standardHoursPerWeek) || 40;
  const totalWks  = totalWeeks(phases);
  const totals    = capexOpexTotals(resources, phases, settings.startDate);
  const contingencyAmt = totals.total * (Number(settings.contingencyPct) || 0) / 100;

  // --- Updaters ---
  const updateSettings = (k, v) =>
    onChange({ ...project, settings: { ...settings, [k]: v } });

  const updatePhase = (i, v) => {
    const p = [...phases]; p[i] = { ...p[i], weeks: v };
    onChange({ ...project, phases: p });
  };

  const updateResource = (i, k, v) => {
    const r = [...resources]; r[i] = { ...r[i], [k]: v };
    onChange({ ...project, resources: r });
  };

  const addRow    = () => onChange({ ...project, resources: [...resources, DEFAULT_ROW()] });
  const removeRow = (i) => {
    const r = [...resources]; r.splice(i, 1);
    onChange({ ...project, resources: r });
  };

  // --- Totals row ---
  const totalHrs  = resources.reduce((s, r) => {
    const pw = phases.find(p => p.name === r.phase)?.weeks || 0;
    return s + totalHours(r.hrsPerWeek, pw, r.count);
  }, 0);

  // --- Alloc warnings ---
  const overAllocResources = [...new Set(
    resources
      .filter(r => weeklyAllocPct(r.hrsPerWeek, stdHrs) > 100)
      .map(r => r.resource)
  )].filter(Boolean);

  // --- Export CSV for Inputs ---
  const handleExportCSV = () => {
    const rows = [
      ['Resource','Activity','Phase','Location','Type','CapEx/OpEx','# Resources','Hrs/Wk','Rate ($/hr)','Total Hrs','Total Cost'],
      ...resources.map(r => {
        const pw   = phases.find(p => p.name === r.phase)?.weeks || 0;
        const hrs  = totalHours(r.hrsPerWeek, pw, r.count);
        const cost = hrs * (Number(r.hourlyRate) || 0);
        return [r.resource, r.activity, r.phase, r.location, r.type, r.capexOpex,
                r.count ?? 1, r.hrsPerWeek, r.hourlyRate, hrs.toFixed(0), cost.toFixed(0)];
      }),
      [],
      ['','','','','','','Total Hours','',totalHrs.toFixed(0),''],
    ];
    exportTabToCSV(rows, `${project.name}_Inputs.csv`);
  };

  // --- Audit summary text ---
  const auditText = `Project "${project.name}" has ${resources.length} resource-activity entries across ${phases.length} phases (${totalWks} weeks total). Total effort: ${Math.round(totalHrs).toLocaleString()} hours. Total cost: ${fmt(totals.total, settings.currency || 'USD')} (CapEx: ${fmt(totals.capex, settings.currency || 'USD')}, OpEx: ${fmt(totals.opex, settings.currency || 'USD')}).`;

  const handleAudit = () => {
    window.alert(auditText);
  };

  return (
    <div className="p-6 space-y-8 max-w-screen-xl mx-auto">

      {/* ── Project Settings ─────────────────────────────── */}
      <section>
        <SectionHeader title="Project Settings" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Start Date',       key: 'startDate',             type: 'date'   },
            { label: 'Std Hrs / Week',   key: 'standardHoursPerWeek', type: 'number' },
            { label: 'Currency',         key: 'currency',              type: 'text'   },
            { label: 'Contingency %',    key: 'contingencyPct',        type: 'number' },
          ].map(f => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">{f.label}</span>
              <input
                type={f.type}
                value={settings[f.key] ?? ''}
                onChange={e => updateSettings(f.key, e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={inputStyle()}
              />
            </label>
          ))}
        </div>

        {/* Auto-calculated row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {[
            { label: 'Total Weeks',       value: totalWks },
            { label: 'Total Phases',      value: phases.length },
            { label: 'Total Resources',   value: resources.length },
            { label: 'Contingency Amt',   value: fmt(contingencyAmt, settings.currency || 'USD') },
          ].map(f => (
            <div key={f.label} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">{f.label}</span>
              <div
                className="border border-gray-300 rounded px-2 py-1.5 text-sm font-medium text-gray-700"
                style={calcStyle()}
              >
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Phase Durations ───────────────────────────────── */}
      <section>
        <SectionHeader title="Phase Durations" />
        <div className="space-y-2">
          {phases.map((ph, i) => {
            const pct = totalWks > 0 ? (ph.weeks / totalWks) * 100 : 0;
            return (
              <div key={ph.name} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-700 shrink-0">{ph.name}</span>
                <input
                  type="number" min="0"
                  value={ph.weeks}
                  onChange={e => updatePhase(i, Number(e.target.value))}
                  className="w-14 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={inputStyle()}
                />
                <span className="text-xs text-gray-400 w-6 shrink-0">wk</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-200"
                    style={{ width: `${pct}%`, background: PHASE_COLORS[i % PHASE_COLORS.length] }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-9 text-right shrink-0">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Total: <span className="font-medium text-gray-600">{totalWks} weeks</span>
        </p>
      </section>

      {/* ── Resource-Activity Table ───────────────────────── */}
      <section>
        <SectionHeader
          title="Resource-Activity Table"
          action={
            <button
              onClick={addRow}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Row
            </button>
          }
        />

        {/* Over-alloc warning banner */}
        {overAllocResources.length > 0 && (
          <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="text-red-500 text-sm mt-0.5">⚠</span>
            <p className="text-xs text-red-700">
              <span className="font-semibold">Allocation &gt;100%:</span>{' '}
              {overAllocResources.join(', ')}. Check hrs/week vs standard {stdHrs} hrs/week.
            </p>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                {[
                  ['Resource',    'min-w-[120px]'],
                  ['Activity',    'min-w-[120px]'],
                  ['Phase',       'min-w-[110px]'],
                  ['Location',    'min-w-[100px]'],
                  ['Type',        'min-w-[90px]'],
                  ['CapEx/OpEx',  'min-w-[90px]'],
                  ['# Resources', 'min-w-[80px]'],
                  ['Hrs/Wk',      'min-w-[70px]'],
                  ['Rate ($/hr)', 'min-w-[80px]'],
                  ['Total Hrs',   'min-w-[80px]'],
                  ['Total Cost',  'min-w-[90px]'],
                  ['',            'w-8'],
                ].map(([h, cls]) => (
                  <th key={h} className={`border border-gray-200 px-2 py-2 text-left font-semibold ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((r, i) => {
                const phaseWeeks = phases.find(p => p.name === r.phase)?.weeks || 0;
                const hrs        = totalHours(r.hrsPerWeek, phaseWeeks, r.count);
                const cost       = hrs * (Number(r.hourlyRate) || 0);
                const allocPct   = weeklyAllocPct(r.hrsPerWeek, stdHrs);
                const over       = allocPct > 100;
                const rStyle = rowStyle(r.capexOpex);

                return (
                  <tr key={r.id} style={rStyle}>
                    {/* Free-text inputs */}
                    {['resource', 'activity'].map(k => (
                      <td key={k} className="border border-gray-200 p-0">
                        <input
                          value={r[k]}
                          onChange={e => updateResource(i, k, e.target.value)}
                          placeholder={k === 'resource' ? 'e.g. BA Lead' : 'e.g. Requirements'}
                          className="w-full px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder-gray-400"
                          style={{ ...inputStyle(), minWidth: '110px' }}
                        />
                      </td>
                    ))}
                    {/* Dropdowns */}
                    {[
                      ['phase',     PHASES],
                      ['location',  LOCATIONS],
                      ['type',      TYPES],
                      ['capexOpex', CAPEX_OPEX],
                    ].map(([k, opts]) => (
                      <td key={k} className="border border-gray-200 p-0">
                        <select
                          value={r[k]}
                          onChange={e => updateResource(i, k, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs focus:outline-none"
                          style={inputStyle()}
                        >
                          {opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </td>
                    ))}
                    {/* # Resources */}
                    <td className="border border-gray-200 p-0">
                      <input
                        type="number" min="1"
                        value={r.count ?? 1}
                        onChange={e => updateResource(i, 'count', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
                        style={inputStyle()}
                      />
                    </td>
                    {/* Hrs/Wk */}
                    <td className="border border-gray-200 p-0">
                      <div className="relative">
                        <input
                          type="number" min="0"
                          value={r.hrsPerWeek}
                          onChange={e => updateResource(i, 'hrsPerWeek', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          style={{ ...inputStyle(), color: over ? COLORS.over : COLORS.inputText, fontWeight: over ? 700 : undefined }}
                        />
                        {over && (
                          <span
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold"
                            style={{ color: COLORS.over }}
                            title={`${allocPct.toFixed(0)}% allocation`}
                          >!</span>
                        )}
                      </div>
                    </td>
                    {/* Rate */}
                    <td className="border border-gray-200 p-0">
                      <input
                        type="number" min="0"
                        value={r.hourlyRate}
                        onChange={e => updateResource(i, 'hourlyRate', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                        style={inputStyle()}
                      />
                    </td>
                    {/* Calculated: Total Hrs */}
                    <td className="border border-gray-200 px-2 py-1.5 text-right font-medium" style={calcStyle()}>
                      {hrs > 0 ? Math.round(hrs).toLocaleString() : '—'}
                    </td>
                    {/* Calculated: Total Cost */}
                    <td className="border border-gray-200 px-2 py-1.5 text-right font-medium" style={calcStyle()}>
                      {cost > 0 ? fmt(cost, settings.currency || 'USD') : '—'}
                    </td>
                    {/* Delete */}
                    <td className="border border-gray-200 px-1 py-1 text-center">
                      <button
                        onClick={() => removeRow(i)}
                        className="text-gray-300 hover:text-red-500 text-lg leading-none transition-colors px-1"
                        title="Remove row"
                      >×</button>
                    </td>
                  </tr>
                );
              })}

              {/* Totals row */}
              {resources.length > 0 && (
                <tr className="bg-gray-100 font-semibold text-gray-700 border-t-2 border-gray-300">
                  <td className="border border-gray-200 px-2 py-2" colSpan={8}>
                    Totals
                  </td>
                  <td className="border border-gray-200 px-2 py-2 text-right" style={calcStyle()}>
                    {Math.round(totalHrs).toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-2 py-2 text-right" style={calcStyle()}>
                    {fmt(totals.total, settings.currency || 'USD')}
                  </td>
                  <td className="border border-gray-200" />
                </tr>
              )}
            </tbody>
          </table>

          {resources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No resources yet.</p>
              <button onClick={addRow} className="mt-2 text-blue-500 text-sm hover:underline">+ Add your first row</button>
            </div>
          )}
        </div>

        {/* Color legend */}
        <div className="flex gap-4 mt-2">
          {[
            { bg: COLORS.input, label: 'User input' },
            { bg: COLORS.calc,  label: 'Calculated' },
            { bg: COLORS.capex, label: 'CapEx row' },
            { bg: COLORS.opex,  label: 'OpEx row' },
          ].map(({ bg, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-gray-300" style={{ background: bg }} />
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Action Buttons ────────────────────────────────── */}
      <section className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
        <button
          onClick={() => onTabSwitch && onTabSwitch(1)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate Outputs →
        </button>
        <button
          onClick={() => exportToExcel(project)}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Export Excel
        </button>
   