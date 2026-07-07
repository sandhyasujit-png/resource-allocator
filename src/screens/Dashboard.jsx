import { useState, useEffect } from 'react';
import { loadAllProjects, saveProject, deleteProject, duplicateProject, newProject } from '../utils/storage';
import { capexOpexTotals, fmt } from '../utils/calculations';

export default function Dashboard({ onOpen }) {
  const [projects, setProjects] = useState({});

  useEffect(() => { setProjects(loadAllProjects()); }, []);

  const refresh = () => setProjects(loadAllProjects());

  const handleNew = () => {
    const p = newProject();
    saveProject(p);
    onOpen(p.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this project?')) { deleteProject(id); refresh(); }
  };

  const handleDuplicate = (id) => { duplicateProject(id); refresh(); };

  const list = Object.values(projects).sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resource Allocator</h1>
        <p className="text-gray-500 mb-8">Manage your project resource plans</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New project card */}
          <button
            onClick={handleNew}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[180px]"
          >
            <span className="text-5xl mb-2">+</span>
            <span className="text-sm font-medium">New Project</span>
          </button>

          {list.map(p => {
            const totals = capexOpexTotals(p.resources || [], p.phases || [], p.settings?.startDate);
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800 text-lg truncate">{p.name}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Last edited {new Date(p.lastEdited).toLocaleDateString()}
                  </p>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Cost</span>
                      <span className="font-medium text-gray-800">{fmt(totals.total, p.settings?.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CapEx</span>
                      <span className="text-green-700">{fmt(totals.capex, p.settings?.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">OpEx</span>
                      <span className="text-orange-600">{fmt(totals.opex, p.settings?.currency)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-2 flex-wrap">
                  <button onClick={() => onOpen(p.id)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">Open</button>
                  <button onClick={() => handleDuplicate(p.id)} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200">Duplicate</button>
                  <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-md hover:bg-red-100">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
