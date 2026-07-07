import { capexOpexTotals, totalWeeks, fmt, monthlyCosts } from '../utils/calculations';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <button onClick={copy} className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-600">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

import { useState } from 'react';

export default function SummaryTab({ project }) {
  const { resources, phases, settings, name } = project;
  const currency = settings.currency || 'USD';
  const totals = capexOpexTotals(resources, phases, settings.startDate);
  const totalHrs = resources.reduce((s, r) => {
    const ph = phases.find(p => p.name === r.phase);
    return s + (Number(r.hrsPerWeek) || 0) * (Number(ph?.weeks) || 0);
  }, 0);

  // By Activity
  const byActivity = {};
  resources.forEach(r => {
    if (!byActivity[r.activity]) byActivity[r.activity] = { cost: 0, hrs: 0 };
    const ph = phases.find(p => p.name === r.phase);
    const hrs = (Number(r.hrsPerWeek) || 0) * (Number(ph?.weeks) || 0);
    const cost = hrs * (Number(r.hourlyRate) || 0);
    byActivity[r.activity].cost += cost;
    byActivity[r.activity].hrs += hrs;
  });

  // By Location
  const byLocation = {};
  resources.forEach(r => {
    if (!byLocation[r.location]) byLocation[r.location] = { cost: 0, hrs: 0 };
    const ph = phases.find(p => p.name === r.phase);
    const hrs = (Number(r.hrsPerWeek) || 0) * (Number(ph?.weeks) || 0);
    const cost = hrs * (Number(r.hourlyRate) || 0);
    byLocation[r.location].cost += cost;
    byLocation[r.location].hrs += hrs;
  });

  const auditText = `Project "${name}" spans ${totalWeeks(phases)} weeks across ${phases.length} phases with ${resources.length} resource-activity entries. Total budget: ${fmt(totals.total, currency)} (CapEx: ${fmt(totals.capex, currency)}, OpEx: ${fmt(totals.opex, currency)}). Total effort: ${totalHrs.toLocaleString()} hours.`;

  const resumeText = `Led resource allocation and cost planning for ${name}: managed ${resources.length} resource streams across ${phases.length} project phases, totalling ${fmt(totals.total, currency)} (${fmt(totals.capex, currency)} CapEx / ${fmt(totals.opex, currency)} OpEx) and ${totalHrs.toLocaleString()} hours of effort.`;

  const MetricCard = ({ label, value, sub }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Budget" value={fmt(totals.total, currency)} />
        <MetricCard label="Total Hours" value={totalHrs.toLocaleString()} />
        <MetricCard label="CapEx" value={fmt(totals.capex, currency)} sub={totals.total > 0 ? `${((totals.capex/totals.total)*100).toFixed(0)}% of total` : ''} />
        <MetricCard label="OpEx" value={fmt(totals.opex, currency)} sub={totals.total > 0 ? `${((totals.opex/totals.total)*100).toFixed(0)}% of total` : ''} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Activity */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">By Activity</h2>
          <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-100"><tr>
              <th className="px-3 py-2 text-left">Activity</th>
              <th className="px-3 py-2 text-right">Hours</th>
              <th className="px-3 py-2 text-right">Cost</th>
            </tr></thead>
            <tbody>
              {Object.entries(byActivity).map(([k, v]) => (
                <tr key={k} className="border-t border-gray-100">
                  <td className="px-3 py-1">{k || '—'}</td>
                  <td className="px-3 py-1 text-right">{v.hrs.toLocaleString()}</td>
                  <td className="px-3 py-1 text-right">{fmt(v.cost, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* By Location */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">By Location</h2>
          <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-100"><tr>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-right">Hours</th>
              <th className="px-3 py-2 text-right">Cost</th>
            </tr></thead>
            <tbody>
              {Object.entries(byLocation).map(([k, v]) => (
                <tr key={k} className="border-t border-gray-100">
                  <td className="px-3 py-1">{k || '—'}</td>
                  <td className="px-3 py-1 text-right">{v.hrs.toLocaleString()}</td>
                  <td className="px-3 py-1 text-right">{fmt(v.cost, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Audit Summary */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          Audit Summary <CopyButton text={auditText} />
        </h2>
        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">{auditText}</p>
      </section>

      {/* Resume Bullet */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          Resume Bullet <CopyButton text={resumeText} />
        </h2>
        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">{resumeText}</p>
      </section>
    </div>
  );
}
