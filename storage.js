// Локальное сохранение и безопасное чтение данных браузера.
import { STORAGE_KEY, parseSavedState, blankTask, cleanTask } from './domain.js';
import { seedState } from './data.js';

export function loadState(storage) {
  const initial = seedState();
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved) return { state: parseSavedState(saved), warning: '', blocked: false };
    const oldTasks = storage.getItem('taskforge-tasks');
    if (oldTasks) {
      const parsed = JSON.parse(oldTasks);
      if (!Array.isArray(parsed) || parsed.some((task) => !task || !['string','number'].includes(typeof task.id))) throw new Error();
      initial.tasks = parsed.map((task) => cleanTask({ ...blankTask(), ...task, id: String(task.id), published: Boolean(task.published), confirmedAt: task.published ? new Date().toISOString() : null }));
      for (const demo of seedState().tasks) if (!initial.tasks.some((task) => task.id === demo.id)) initial.tasks.push(demo);
      const oldProposals = JSON.parse(storage.getItem('taskforge-proposals') || '[]');
      if (!Array.isArray(oldProposals)) throw new Error();
      for (const proposal of oldProposals) {
        if (!proposal || !initial.tasks.some((task) => task.id === String(proposal.taskId))) continue;
        const mapped = { ...proposal, id: `p${proposal.id}`, taskId: String(proposal.taskId), teamId: initial.teams.find((team) => team.name === proposal.team)?.id || '', status: ['new','selected','declined'].includes(proposal.status) ? proposal.status : 'new' };
        for (const key of ['team','idea','plan','deadline','link']) mapped[key] = typeof mapped[key] === 'string' ? mapped[key] : '';
        initial.proposals = [mapped, ...initial.proposals.filter((item) => item.id !== mapped.id)];
      }
    }
    return { state: initial, warning: '', blocked: false };
  } catch {
    return { state: initial, warning: 'Сохранённые данные недоступны или повреждены. Открыты демонстрационные данные; изменения в этой сессии не сохраняются. Исходные записи не перезаписаны.', blocked: true };
  }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return ''; }
  catch { return 'Браузер не разрешил сохранение. Изменения доступны только до перезагрузки страницы.'; }
}
