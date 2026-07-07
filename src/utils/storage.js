// localStorage helpers
const PROJECTS_KEY = 'resource_allocator_projects';

export function loadAllProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveProject(project) {
  const all = loadAllProjects();
  all[project.id] = { ...project, lastEdited: new Date().toISOString() };
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
  return all[project.id];
}

export function deleteProject(id) {
  const all = loadAllProjects();
  delete all[id];
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
}

export function duplicateProject(id) {
  const all = loadAllProjects();
  const src = all[id];
  if (!src) return null;
  const newId = crypto.randomUUID();
  const copy = { ...src, id: newId, name: src.name + ' (Copy)', lastEdited: new Date().toISOString() };
  all[newId] = copy;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
  return copy;
}

export function newProject() {
  return {
    id: crypto.randomUUID(),
    name: 'New Project',
    lastEdited: new Date().toISOString(),
    settings: {
      startDate: '',
      standardHoursPerWeek: 40,
      currency: 'USD',
      contingencyPct: 0,
    },
    phases: [
      { name: 'Initiation',       weeks: 2 },
      { name: 'Planning',         weeks: 4 },
      { name: 'Analysis',         weeks: 4 },
      { name: 'Design',           weeks: 4 },
      { name: 'Build',            weeks: 8 },
      { name: 'Testing',          weeks: 4 },
      { name: 'Deployment',       weeks: 2 },
    ],
    resources: [],
  };
}
