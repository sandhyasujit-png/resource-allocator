import { useState } from 'react';
import Dashboard from './screens/Dashboard';
import InputsTab from './screens/InputsTab';
import WeeklyAllocationTab from './screens/WeeklyAllocationTab';
import MonthlyCostTab from './screens/MonthlyCostTab';
import SummaryTab from './screens/SummaryTab';
import TopBar from './components/TopBar';
import { loadAllProjects, saveProject } from './utils/storage';
import { exportToExcel } from './utils/export';

const TABS = ['Inputs', 'Weekly Allocation %', 'Monthly Cost Forecast', 'Summary'];

export default function App() {
  const [view, setView] = useState('dashboard');  // 'dashboard' | 'project'
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const openProject = (id) => {
    const all = loadAllProjects();
    setProject(all[id]);
    setActiveTab(0);
    setHasUnsaved(false);
    setView('project');
  };

  const handleChange = (updated) => {
    setProject(updated);
    setHasUnsaved(true);
  };

  const handleSave = () => {
    if (!project) return;
    saveProject(project);
    setHasUnsaved(false);
  };

  const handleBack = () => {
    if (hasUnsaved && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    setView('dashboard');
    setProject(null);
  };

  if (view === 'dashboard') {
    return <Dashboard onOpen={openProject} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar
        projectName={project.name}
        onBack={handleBack}
        onSave={handleSave}
        hasUnsaved={hasUnsaved}
        onNameChange={name => handleChange({ ...project, name })}
      />

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 flex gap-0 px-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === i
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => exportToExcel(project)}
          className="my-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 self-center mr-1"
        >
          Export Excel
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 0 && <InputsTab project={project} onChange={handleChange} />}
        {activeTab === 1 && <WeeklyAllocationTab project={project} />}
        {activeTab === 2 && <MonthlyCostTab project={project} />}
        {activeTab === 3 && <SummaryTab project={project} />}
      </div>
    </div>
  );
}
