import { useState, useEffect, useCallback } from 'react';
import { loadAllProjects, saveProject, deleteProject, duplicateProject, newProject } from '../utils/storage';
import { capexOpexTotals, fmt } from '../utils/calculations';
import { exportToExcel } from '../utils/export';

// Relative time helper
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// CapEx / OpEx split bar
function SplitBar({ capex, opex }) {
  const total = capex + opex;
  if (total === 0) return <div className="h-1.5 bg-gray-100 rounded-full mt-3" />;
  const capexPct = (capex / total) * 100;
  return (
    <div className="mt-3">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
        <div style={{ width: `${capexPct}%` }} className="bg-green-400" />
        <div style={{ width: `${100 - capexPct}%` }} className="bg-orange-300" />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-green-700">CapEx {capexPct.toFixed(0)}%</span>
        <span className="text-[10px] text-orange-600">OpEx {(100 - capexPct).toFixed(0)}%</span>
      </div>
    </div>
  );
}

// Confirm dialog state helper
function useConfirm() {
  const [pending, setPending] = useState(null); // { id, name }
  const ask = (id, name) => setPending({ id, name });
  const resolve = (confirmed, onConfirm) => {
    if (confirmed && pending) onConfirm(pending.id);
    setPending(null);
  };
  return { pending, ask, resolve };
}

export default function Dashboard({ onOpen }) {
  const [projects, setProjects] = useState({});
  const confirm = useConfirm();

  const refresh = useCallback(() => setProjects(loadAllProjects()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleNew = () => {
    const p = newProject();
    saveProject(p);
    onOpen(p.id);
  };

  const handleDelete = (id) => {
    deleteProject(id);
    refresh();
  };

  const handleDuplicate = (id) => {
    duplicateProject(id);
    refresh();
  };

  const handleExport = (e, project) => {
    e.stopPropagation();
    exportToExcel(project);
  };

  const list = Object.values(projects).sort(
    (a, b) => new Date(b.lastEdited) - new Date(a.lastEdited)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resource Allocator</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {list.length === 0
                ? 'No projects yet — create one to get started'
                : `${list.length} project${list.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* New project card (inline) */}
          <button
            onClick={handleNew}
            className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[220px] group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center mb-2 text-xl group-hover:scale-110 transition-transform">
              +
            </div>
            <span className="text-sm font-medium">New Project</span>
          </button>

          {list.map(p => {
            const totals = capexOpexTotals(p.resources || [], p.phases || [], p.settings?.startDate);
            const resourceCount = (p.resources || []).length;
            const phaseCount   = (p.phases   || []).length;
            const currency     = p.settings?.currency || 'USD';

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                onClick={() => onOpen(p.id)}
              >
                {/* Card body */}
                <div className="p-5 flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-gray-900 text-base leading-snug truncate">{p.name}</h2>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                      {timeAgo(p.lastEdited)}
                    </span>
                  </div>

                  {/* Meta pills */}
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {resourceCount} resource{resourceCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {phaseCount} phases
                    </span>
                  </div>

                  {/* Cost */}
                  <div className="mt-4">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Total Budget</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{fmt(totals.total, currency)}</p>
                  </div>

                  {/* CapEx / OpEx breakdown */}
                  <div className="mt-3 flex justify-between text-xs">
                    <span className="text-green-700 font-medium">{fmt(totals.capex, currency)} CapEx</span>
                    <span className="text-orange-600 font-medium">{fmt(totals.opex, currency)} OpEx</span>
                  </div>
                  <SplitBar capex={totals.capex} opex={totals.opex} />
                </div>

                {/* Card actions */}
                <div
                  className="border-t border-gray-100 px-5 py-3 flex gap-2"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => onOpen(p.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDuplicate(p.id)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => handleExport(e, p)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => confirm.ask(p.id, p.name)}
                    className="ml-auto px-3 py-1.5 text-red-400 text-xs font-medium rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state (no projects) */}
        {list.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700">No projects yet</h3>
            <p className="text-sm text-gray-400 mt-1">Click "+ New Project" to create your first resource plan.</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirm.pending && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => confirm.resolve(false, null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900">Delete project?</h3>
            <p className="text-sm text-gray-500 mt-1">
              "<span className="font-medium text-gray-700">{confirm.pending.name}</span>" will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => confirm.resolve(false, null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => confirm.resolve(true, handleDelete)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
