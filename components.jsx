import { Layers3 } from 'lucide-react';
import { fields, rating } from '../logic/domain.js';

export function Badge({ task }) { const { score, level } = rating(task); return <span className={`badge ${level.key}`}><span className="badge-dot" />{level.label}<b>{score}</b></span>; }
export function Progress({ score }) { return <progress max="100" value={score} aria-label={`Готовность: ${score} из 100`} />; }
export function Empty({ title, text, children }) { return <div className="empty"><Layers3 size={30} /><h3>{title}</h3><p>{text}</p>{children}</div>; }
export function Field({ name, label, value = '', onChange, placeholder = '', required = false, error, multiline = true, rows = 3 }) {
  const id = `field-${name}`;
  const props = { id, name, value, onChange: (event) => onChange(event.target.value), placeholder, 'aria-required': required, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, maxLength: name === 'title' ? 100 : name === 'topic' ? 60 : name === 'rawDescription' ? 8000 : 5000 };
  return <label className="field" htmlFor={id}><span>{label}{required && <em> *</em>}</span>{multiline ? <textarea {...props} rows={rows} /> : <input {...props} />}{error && <small className="field-error" id={`${id}-error`}>{error}</small>}</label>;
}
export function ScorePanel({ task, preview = false }) {
  const result = rating(task);
  return <aside className="score-panel"><div className="score-heading"><h2>Готовность задачи</h2><span>{preview ? 'Предпросмотр' : 'Подтверждено'}</span></div><div className="score-value"><strong>{result.score}</strong><span>/100</span></div><Badge task={task}/><Progress score={result.score}/><div className="score-breakdown">{result.breakdown.map((group) => <div className={group.points ? 'complete' : ''} key={group.label}><span>{group.points ? '✓' : '○'} {group.label}</span><b>{group.points}<small>/{group.weight}</small></b></div>)}</div><div className="score-help"><h3>{result.missing.length ? 'Как повысить рейтинг' : 'Всё готово к работе'}</h3>{result.missing.length ? <ul>{result.breakdown.filter((group) => group.missing.length).map((group) => <li key={group.label}>{group.missing.map((key) => fields.find(([field]) => field === key)[1]).join(' + ')} <b>+{group.weight}</b></li>)}</ul> : <p>Все сведения указаны. Командам будет проще подготовить предложение.</p>}</div>{preview && <p className="small-note">Баллы пересчитываются при вводе. Каталог обновится после вашего подтверждения.</p>}</aside>;
}
