import { useState } from 'react';
import { COLORS, totalHours, weeklyAllocPct, totalWeeks } from '../utils/calculations';

const PHASES = ['Initiation','Planning','Analysis','Design','Build','Testing','Deployment'];
const LOCATIONS = ['Onshore','Offshore','Nearshore'];
const TYPES = ['FTE','Contractor','Vendor'];
const CAPEX_OPEX = ['CapEx','OpEx'];

const DEFAULT_ROW = () => ({
  id: crypto.randomUUID(),
  resource: '', activity: '', phase: PHASES[0],
  location: LOCATIONS[0], type: TYPES[0], capexOpex: CAPEX_OPEX[0],
  hrsPerWeek: '', hourlyRate: '',
});

const cell = (bg, extra = '') =>
  `border border-gray-300 px-2 py-1 text-sm ${extra}` + (bg ? ` style-cell` : '');

export default function InputsTab({ project, onChange }) {
  const { settings, phases, resources } = project;
  const stdHrs = Number(settings.standardHoursPerWeek) || 40;
  const total = totalWeeks(phases);

  const updateSettings = (k, v) => onChange({ ...project, settings: { ...settings, [k]: v } });
  const updatePhase = (i, v) => {
    const p = [...phases]; p[i] = { ...p[i], weeks: v }; onChange({ ...project, phases: p });
  };
  const updateResource = (i, k, v) => {
    const r = [...resources]; r[i] = { ...r[i], [k]: v }; onChange({ ...project, resources: r });
  };
  const addRow = () => onChange({ ...project, resources: [...resources, DEFAULT_ROW()] });
  const removeRow = (i) => {
    const r = [...resources]; r.splice(i, 1); onChange({ ...project, resources: r });
  };

  return (
    <div className="p-6 space-y-8">

      {/* Project Settings */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Project Settings</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Start Date', key: 'startDate', type: 'date' },
            { label: 'Std Hrs / Week', key: 'standardHoursPerWeek', type: 'number' },
            { label: 'Currency', key: 'currency', type: 'text' },
            { label: 'Contingency %', key: 'contingencyPct', type: 'number' },
          ].map(f => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">{f.label}</span>
              <input
                type={f.type}
                value={settings[f.key] ?? ''}
                onChange={e => updateSettings(f.key, e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                style={{ background: COLORS.input }}
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { label: 'Total Weeks', value: total },
            { label: 'Total Phases', value: phases.length },
            { label: 'Total Resources', value: resources.length },
            { label: 'Contingency Amt', value: '—' },
          ].map(f => (
            <div key={f.label} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">{f.label}</span>
              <div className="border border-gray-300 rounded px-2 py-1 text-sm" style={{ background: COLORS.calc }}>{f.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Phase Durations */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Phase Durations</h2>
        <div className="space-y-2">
          {phases.map((ph, i) => {
            const pct = total > 0 ? (ph.weeks / total) * 100 : 0;
            return (
              <div key={ph.name} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600 shrink-0">{ph.name}</span>
                <input
                  type="number" min="0" value={ph.weeks}
                  onChange={e => updatePhase(i, Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  style={{ background: COLORS.input }}
                />
                <span className="text-xs text-gray-400 w-12 shrink-0">{ph.weeks}w</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resource-Activity Table */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Resource-Activity Table</h2>
          <button onClick={addRow} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">+ Add Row</button>
        </div>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                {['Resource','Activity','Phase','Location','Type','CapEx/OpEx','Hrs/Wk','Rate ($/hr)','Total Hrs','Total Cost',''].map(h => (
                  <th key={h} className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((r, i) => {
                const phaseWeeks = phases.find(p => p.name === r.phase)?.weeks || 0;
                const hrs = totalHours(r.hrsPerWeek, phaseWeeks);
                const cost = hrs * (Number(r.hourlyRate) || 0);
                const allocPct = weeklyAllocPct(r.hrsPerWeek, stdHrs);
                const over = allocPct > 100;
                const rowBg = r.capexOpex === 'CapEx' ? COLORS.capex : COLORS.opex;

                return (
                  <tr key={r.id} style={{ background: rowBg }}>
                    {/* Inputs */}
                    {['resource','activity'].map(k => (
                      <td key={k} className="border border-gray-300 p-0">
                        <input value={r[k]} onChange={e => updateResource(i, k, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400"
                          style={{ background: COLORS.input }} />
                      </td>
                    ))}
                    {/* Dropdowns */}
                    {[['phase',PHASES],['location',LOCATIONS],['type',TYPES],['capexOpex',CAPEX_OPEX]].map(([k, opts]) => (
                      <td key={k} className="border border-gray-300 p-0">
                        <select value={r[k]} onChange={e => updateResource(i, k, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent focus:outline-none text-xs"
                          style={{ background: COLORS.input }}>
                          {opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </td>
                    ))}
                    {/* Hrs/Wk */}
                    <td className="border border-gray-300 p-0">
                      <input type="number" value={r.hrsPerWeek} onChange={e => updateResource(i, 'hrsPerWeek', e.target.value)}
                        className="w-full px-2 py-1 focus:outline-none text-xs"
                        style={{ background: COLORS.input, color: over ? COLORS.over : undefined }} />
                    </td>
                    {/* Rate */}
                    <td className="border border-gray-300 p-0">
                      <input type="number" value={r.hourlyRate} onChange={e => updateResource(i, 'hourlyRate', e.target.value)}
                        className="w-full px-2 py-1 focus:outline-none text-xs"
                        style={{ background: COLORS.input }} />
                    </td>
                    {/* Calculated */}
                    <td className="border border-gray-300 px-2 py-1 text-right" style={{ background: COLORS.calc }}>
                      {over && <span className="text-red-500 mr-1" title="Allocation &gt;100%">⚠</span>}
                      {hrs.toFixed(0)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right" style={{ background: COLORS.calc }}>
                      ${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-base leading-none">×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {resources.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No resources yet. Click "+ Add Row" to start.</p>
          )}
        </div>
      </section>
    </div>
  );
}
