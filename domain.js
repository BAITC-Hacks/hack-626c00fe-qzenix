// Правила рейтинга, локального AI-анализа и проверки введённых данных.
export const fields = [
  ['title', 'Название', 'Например: анализ повторных покупок'],
  ['topic', 'Тема', 'Например: Retail'],
  ['context', 'Контекст', 'Что происходит сейчас?'],
  ['need', 'Потребность', 'Что вы хотите изменить?'],
  ['users', 'Пользователи', 'Кому будет полезно решение?'],
  ['data', 'Данные и материалы', 'Какие данные или примеры вы можете предоставить?'],
  ['constraints', 'Ограничения', 'Сроки, технологии и условия доступа'],
  ['expectedResult', 'Ожидаемый результат', 'Что должна передать команда?'],
  ['successCriteria', 'Критерии успеха', 'Как измерить результат?'],
  ['contact', 'Контакт', 'Имя и способ связи'],
  ['interactionFormat', 'Формат взаимодействия', 'Как часто вы готовы давать обратную связь?'],
];

export const groups = [
  { label: 'Контекст и потребность', keys: ['context', 'need'], weight: 20 },
  { label: 'Данные и материалы', keys: ['data'], weight: 20 },
  { label: 'Ожидаемый результат', keys: ['expectedResult'], weight: 15 },
  { label: 'Критерии успеха', keys: ['successCriteria'], weight: 15 },
  { label: 'Ограничения', keys: ['constraints'], weight: 10 },
  { label: 'Пользователи', keys: ['users'], weight: 10 },
  { label: 'Контакт и взаимодействие', keys: ['contact', 'interactionFormat'], weight: 10 },
];

export const levels = [
  { key: 'draft', label: 'Черновик', min: 0, max: 39 },
  { key: 'working', label: 'Рабочая', min: 40, max: 69 },
  { key: 'ready', label: 'Готовая', min: 70, max: 89 },
  { key: 'priority', label: 'Приоритетная', min: 90, max: 100 },
];
export const filled = (value) => typeof value === 'string' && value.trim().length > 0;
export const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const blankTask = () => ({ id: newId(), ...Object.fromEntries(fields.map(([key]) => [key, ''])), topic: 'Другое', rawDescription: '', published: false, confirmedAt: null });
export const cleanTask = (task) => ({ ...task, ...Object.fromEntries(fields.map(([key]) => [key, typeof task[key] === 'string' ? task[key].trim() : ''])) });
export function rating(task) {
  const breakdown = groups.map((group) => {
    const missing = group.keys.filter((key) => !filled(task[key]));
    return { ...group, points: missing.length ? 0 : group.weight, missing };
  });
  const score = breakdown.reduce((total, group) => total + group.points, 0);
  return { score, breakdown, level: levels.find((level) => score >= level.min && score <= level.max), missing: breakdown.flatMap((group) => group.missing) };
}
export function validateTask(task) {
  return Object.fromEntries(['title', 'topic', 'need'].filter((key) => !filled(task[key])).map((key) => [key, 'Заполните это поле.']));
}
export function safeUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function validateProposal(proposal) {
  const errors = Object.fromEntries(['team', 'idea', 'plan', 'deadline', 'link'].filter((key) => !filled(proposal[key])).map((key) => [key, 'Заполните это поле.']));
  if (filled(proposal.link) && !safeUrl(proposal.link.trim())) errors.link = 'Укажите полную ссылку, начиная с https:// или http://.';
  return errors;
}

const questionText = {
  users: 'Кто будет пользоваться решением и какую задачу эти люди решают?',
  constraints: 'Какие есть сроки, ограничения по технологиям или доступам?',
  expectedResult: 'Какой конкретный результат вы хотите получить от команды?',
  successCriteria: 'По каким измеримым признакам вы примете результат?',
  data: 'Какие данные, примеры или материалы вы можете предоставить?',
  contact: 'Кто будет контактным лицом и как с ним связаться?',
  context: 'Что происходит сейчас и в чём проявляется проблема?',
  interactionFormat: 'Как часто и в каком формате вы сможете давать обратную связь?',
  need: 'Что именно вы хотите изменить или улучшить?',
};
export const AI_PROMPT = 'Проверь полноту бизнес-задачи. Задай не менее трёх вопросов о недостающих сведениях. В карточку переноси только явно введённые данные; неизвестные поля оставляй пустыми. Не назначай команду. Верни JSON: { fields: { ... }, questions: [{ key, text }] }.';

// Local deterministic adapter: only labeled lines are mapped to structured fields.
// Unstructured text stays in the need field. No facts are inferred.
export function analyzeDescription(rawDescription, existing = blankTask()) {
  if (!filled(rawDescription)) throw new Error('Опишите задачу хотя бы одной фразой.');
  const task = cleanTask({ ...existing, rawDescription: rawDescription.trim() });
  const aliases = new Map(fields.map(([key, label]) => [label.toLowerCase(), key]));
  let foundLabel = false;
  for (const line of rawDescription.split('\n')) {
    const match = line.match(/^\s*([^:]+):\s*(.+)$/);
    const key = match && aliases.get(match[1].trim().toLowerCase());
    if (key) { task[key] = match[2].trim(); foundLabel = true; }
  }
  if (!foundLabel) task.need = rawDescription.trim();
  if (!filled(task.title)) task.title = (task.need || rawDescription).split('\n')[0].trim().slice(0, 100);
  const keys = Object.keys(questionText);
  const missing = keys.filter((key) => !filled(task[key]));
  const selected = [...missing, ...keys.filter((key) => filled(task[key]))].slice(0, Math.max(3, missing.length));
  return { fields: task, questions: selected.map((key) => ({ key, text: filled(task[key]) ? `Уточните или подтвердите: ${questionText[key]}` : questionText[key] })) };
}
export function validateAnalysis(result) {
  if (!result || typeof result.fields !== 'object' || !Array.isArray(result.questions) || result.questions.length < 3 || result.questions.some((question) => !questionText[question.key] || !filled(question.text)) || fields.some(([key]) => typeof result.fields[key] !== 'string')) {
    throw new Error('Не удалось прочитать результат анализа. Попробуйте ещё раз или заполните карточку вручную.');
  }
  return result;
}

export const STORAGE_KEY = 'taskforge.v2';
export function parseSavedState(raw) {
  const state = JSON.parse(raw);
  if (state?.version !== 2 || !Array.isArray(state.tasks) || !Array.isArray(state.proposals) || !Array.isArray(state.teams)) throw new Error('Неверный формат сохранённых данных.');
  if (state.tasks.some((task) => !task || typeof task.id !== 'string' || fields.some(([key]) => typeof task[key] !== 'string') || typeof task.published !== 'boolean')) throw new Error('Повреждены карточки задач.');
  if (state.proposals.some((p) => !p || typeof p.id !== 'string' || !state.tasks.some((task) => task.id === p.taskId) || !['new', 'selected', 'declined'].includes(p.status) || ['team','idea','plan','deadline','link'].some((key) => typeof p[key] !== 'string'))) throw new Error('Повреждены отклики.');
  if (state.teams.some((team) => !team || typeof team.name !== 'string' || typeof team.id !== 'string' || !['interests','skills','technologies'].every((key) => Array.isArray(team[key]) && team[key].every((value) => typeof value === 'string')))) throw new Error('Повреждены профили команд.');
  return state;
}
