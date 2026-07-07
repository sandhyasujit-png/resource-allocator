export default function TopBar({ projectName, onBack, onSave, hasUnsaved, onNameChange }) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center gap-4 px-6 py-3 shadow-sm">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-800 text-xl font-bold">←</button>
      <input
        className="text-lg font-semibold text-gray-800 bg-transparent border-none outline-none flex-1 min-w-0"
        value={projectName}
        onChange={e => onNameChange(e.target.value)}
      />
      <button
        onClick={onSave}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          hasUnsaved
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        Save{hasUnsaved ? ' •' : ''}
      </button>
    </div>
  );
}
