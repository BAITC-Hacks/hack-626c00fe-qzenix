import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, CheckCheck, ClipboardList, FilePenLine, Layers3, Plus, Sparkles, Users, X, MessageSquare, SlidersHorizontal, Trophy } from 'lucide-react';
import { rating, levels, blankTask, filled, newId, analyzeDescription, validateAnalysis, cleanTask, validateTask } from './logic/domain.js';
import { loadState, saveState } from './logic/storage.js';
import { Badge, Progress, Empty } from './ui/components.jsx';
import { CreateView, DetailView, BusinessView, TeamsView } from './ui/views.jsx';

export default function App() {
  const [loaded] = useState(() => { try { return loadState(window.localStorage); } catch { return loadState({ getItem() { throw new Error(); } }); } });
  const [state, setState] = useState(loaded.state);
  const [warning, setWarning] = useState(loaded.warning);
  const [view, setView] = useState('catalog');
  const [opened, setOpened] = useState(null);
  const [topic, setTopic] = useState('all');
  const [readiness, setReadiness] = useState('all');
  const [feedback, setFeedback] = useState('');
  const [draft, setDraft] = useState(null);
  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  useEffect(() => { if (!loaded.blocked) { try { setWarning(saveState(window.localStorage, state)); } catch { setWarning('Браузер не разрешил сохранение. Изменения доступны только до перезагрузки страницы.'); } } }, [state, loaded]);
  const go = (next) => { setView(next); setOpened(null); setFeedback(''); setErrors({}); window.scrollTo(0, 0); };
  const start = () => { if (!draft) { setDraft(blankTask()); setStep(0); setQuestions([]); } go('create'); };
  const open = (id) => { setOpened(id); setView('detail'); setFeedback(''); window.scrollTo(0, 0); };
  const published = state.tasks.filter((task) => task.published);
  const visibleTasks = published.filter((task) => (topic === 'all' || task.topic === topic) && (readiness === 'all' || rating(task).level.key === readiness)).sort((a, b) => rating(b).score - rating(a).score);
  const task = state.tasks.find((task) => task.id === opened);
  const updateDraft = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); };
  const analyze = () => {
    try {
      const result = validateAnalysis(analyzeDescription(draft.rawDescription, draft));
      setDraft(result.fields); setQuestions(result.questions); setErrors({}); setStep(1); window.scrollTo(0, 0);
    } catch (error) { setErrors({ analysis: error.message }); }
  };
  const edit = (task) => { setDraft({ ...task }); setStep(2); setQuestions([]); go('create'); };
  const publish = () => {
    const task = cleanTask(draft);
    const nextErrors = validateTask(task);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { document.getElementById(`field-${Object.keys(nextErrors)[0]}`)?.focus(); return; }
    const publishedTask = { ...task, published: true, confirmedAt: new Date().toISOString() };
    setState((current) => ({ ...current, tasks: [publishedTask, ...current.tasks.filter((item) => item.id !== task.id)] }));
    setDraft(null); setStep(0); setQuestions([]); setTopic('all'); setReadiness('all'); go('catalog');
    setFeedback(`Задача «${task.title}» опубликована. Готовность: ${rating(task).score}/100.`);
  };
  const submitProposal = (form) => {
    const proposal = { ...Object.fromEntries(Object.entries(form).map(([key,value]) => [key, value.trim()])), taskId: task.id, id: newId(), status: 'new' };
    setState((current) => ({ ...current, proposals: [...current.proposals, proposal] }));
    setFeedback('Предложение отправлено. Бизнес увидит его в кабинете и примет решение вручную.');
  };
  const decide = (id, status) => {
    if (!['selected','declined'].includes(status)) return;
    setState((current) => ({ ...current, proposals: current.proposals.map((proposal) => proposal.id === id ? { ...proposal, status } : proposal) }));
    setFeedback(status === 'selected' ? 'Команда выбрана. Другие отклики доступны для отдельного решения.' : 'Отклик отклонён.');
  };
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool) => { try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* UI remains available. */ } };
    register({ name: 'list_catalog_tasks', description: 'Read published business tasks in descending readiness order. Does not change app state.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute(input) { if (!input || Object.keys(input).length) throw new Error('Expected an empty object.'); return state.tasks.filter((task) => task.published).map((task) => ({ id: task.id, title: task.title, topic: task.topic, score: rating(task).score })).sort((a,b) => b.score-a.score); } });
    register({ name: 'start_task_creation', description: 'Stage an unpublished task description and open its creation form. Does not analyze, publish, or overwrite an existing draft.', inputSchema: { type: 'object', properties: { description: { type: 'string', minLength: 1, maxLength: 8000 } }, required: ['description'], additionalProperties: false }, annotations: { readOnlyHint: false }, async execute(input) {
      if (!input || Object.keys(input).some((key) => key !== 'description') || !filled(input.description) || input.description.length > 8000) throw new Error('A description between 1 and 8000 characters is required.');
      if (draft) throw new Error('There is already a draft. Continue in the visible form.');
      setDraft({ ...blankTask(), rawDescription: input.description.trim() }); setStep(0); setQuestions([]); setErrors({}); setOpened(null); setView('create');
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return { staged: true, published: false, nextAction: 'Run analysis using the visible form.' };
    } });
    return () => lifecycle.abort();
  }, [state.tasks, draft]);

  return <div className="app-shell">
    <aside className="sidebar"><button className="brand" onClick={() => go('catalog')} aria-label="TaskForge — каталог"><span className="brand-icon"><Layers3 size={25} /></span><span>TaskForge<small>Бизнес × команды</small></span></button><div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div><nav aria-label="Основная навигация">{[['catalog','Каталог задач',ClipboardList],['create','Создать задачу',Plus],['business','Кабинет бизнеса',FilePenLine],['teams','Команды',Users]].map(([key,label,Icon]) => <button key={key} className={(view === key || key === 'catalog' && view === 'detail') ? 'nav-item active' : 'nav-item'} onClick={() => key === 'create' ? start() : go(key)}><Icon size={19} /><span>{label}</span>{key === 'catalog' && <small>{published.length}</small>}</button>)}</nav><div className="sidebar-note"><Sparkles size={20} /><b>Хорошая задача —<br/>половина решения</b><p>Добавляйте детали, чтобы командам было проще начать.</p></div><div className="local-note"><span className="local-dot"/> Демо · данные в этом браузере</div></aside>
    <div className="main-area"><header className="topbar"><span>HACKALEM <b>/</b> Практические задачи</span><span className="edition">MVP <span>2026</span></span></header><main id="main-content">
      {warning && <div className="alert error" role="alert">{warning}</div>}
      {feedback && <div className="alert success" role="status"><CheckCheck size={19}/>{feedback}<button onClick={() => setFeedback('')} aria-label="Закрыть сообщение"><X size={17}/></button></div>}
      {view === 'catalog' && <><div className="page-heading"><div><p className="eyebrow">НАЙДИТЕ СВОЙ СЛЕДУЮЩИЙ ПРОЕКТ</p><h1>Каталог задач<span className="heading-dot">.</span></h1><p>Реальные запросы бизнеса. Открытый выбор команды.</p></div><button className="primary" onClick={start}><Plus size={18}/>Создать задачу</button></div><div className="summary-strip"><div><span>Открытых задач</span><b>{published.length.toString().padStart(2,'0')}</b></div><div><span>Готовы к работе</span><b>{published.filter((task) => rating(task).score >= 70).length.toString().padStart(2,'0')}<small>70+ баллов</small></b></div><div><span>Команд в каталоге</span><b>{state.teams.length.toString().padStart(2,'0')}</b></div><div className="summary-tip"><Trophy size={24}/><p>Больше деталей —<br/><strong>выше позиция задачи</strong></p></div></div><div className="filterbar"><SlidersHorizontal size={18}/><label><span>Тема</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">Все темы</option>{[...new Set(published.map((task) => task.topic))].sort().map((name) => <option key={name}>{name}</option>)}</select></label><label><span>Готовность</span><select value={readiness} onChange={(event) => setReadiness(event.target.value)}><option value="all">Все уровни</option>{levels.map((level) => <option key={level.key} value={level.key}>{level.label}</option>)}</select></label><span className="sort-label">По рейтингу ↓</span></div><div className="results-heading"><h2>Задачи <span>{visibleTasks.length}</span></h2><p>Откликнуться можно при любом рейтинге</p></div><div className="task-grid">{visibleTasks.map((task, index) => <article className="task-card" key={task.id}><div className="card-top"><span className="task-number">/{String(index+1).padStart(2,'0')}</span><span className="topic">{task.topic}</span><ArrowUpRight size={18}/></div><Badge task={task}/><h3><button onClick={() => open(task.id)}>{task.title}</button></h3><p className="card-description">{task.need}</p><div className="card-bottom"><div className="progress-label"><span>Готовность к работе</span><strong>{rating(task).score}<small>/100</small></strong></div><Progress score={rating(task).score}/><div className="card-actions"><span><MessageSquare size={15}/>{state.proposals.filter((proposal) => proposal.taskId === task.id).length} откликов</span><button onClick={() => open(task.id)}>Откликнуться <ArrowRight size={16}/></button></div></div></article>)}</div>{!visibleTasks.length && <Empty title="Таких задач пока нет" text="Попробуйте другую тему или уровень готовности."><button className="secondary" onClick={() => { setTopic('all'); setReadiness('all'); }}>Сбросить фильтры</button></Empty>}</>}
      {view === 'create' && draft && <CreateView draft={draft} step={step} setStep={setStep} questions={questions} errors={errors} update={updateDraft} analyze={analyze} publish={publish} />}
      {view === 'detail' && task && <DetailView key={task.id} task={task} teams={state.teams} onBack={() => go('catalog')} edit={() => edit(task)} submit={submitProposal} />}
      {view === 'business' && <BusinessView state={state} decide={decide} edit={edit} open={open} start={start} />}
      {view === 'teams' && <TeamsView teams={state.teams} />}
    </main><footer><span>TaskForge</span><span>От понятной задачи к общему результату</span><span>Синтетические демо-данные</span></footer></div>
  </div>;
}
