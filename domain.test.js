import test from 'node:test';
import assert from 'node:assert/strict';
import { blankTask, rating, levels, analyzeDescription, validateAnalysis, validateTask, validateProposal, safeUrl, parseSavedState } from '../src/logic/domain.js';
import { seedState } from '../src/logic/data.js';
import { loadState, saveState } from '../src/logic/storage.js';

test('score requires both fields in combined groups and ignores whitespace', () => {
  const task = { ...blankTask(), context: 'Контекст', contact: 'Контакт', data: '   ' };
  assert.equal(rating(task).score, 0);
  task.need = 'Потребность'; assert.equal(rating(task).score, 20);
  task.interactionFormat = 'Раз в неделю'; assert.equal(rating(task).score, 30);
  task.context = '\n '; assert.equal(rating(task).score, 10);
  assert.ok(rating(task).missing.includes('context'));
});
test('five demo tasks span the levels and never exceed 100', () => {
  const state = seedState();
  assert.deepEqual(state.tasks.map((task) => rating(task).score), [100,80,55,30,0]);
  assert.equal(state.teams.length, 5); assert.equal(state.proposals.length,5);
  for (const score of [0,39,40,69,70,89,90,100]) {
    const expected = score < 40 ? 'draft' : score < 70 ? 'working' : score < 90 ? 'ready' : 'priority';
    assert.equal(levels.find((level) => score >= level.min && score <= level.max).key, expected);
  }
});
test('analysis does not invent facts, returns stable questions and preserves replies', () => {
  const result = validateAnalysis(analyzeDescription('Нужно улучшить продажи'));
  assert.equal(result.fields.need,'Нужно улучшить продажи'); assert.equal(result.fields.context,'');
  assert.ok(result.questions.length >= 3);
  const count = result.questions.length;
  result.fields.users = 'Менеджеры';
  assert.equal(result.questions.length,count);
  assert.ok(result.questions.some((question) => question.key === 'users'));
  assert.equal(result.fields.successCriteria,'');
  assert.equal(analyzeDescription('Нужно ускорить обработку заявок', result.fields).fields.need, 'Нужно ускорить обработку заявок');
});
test('explicit fields are copied and a complete task still gets 3 review questions', () => {
  const result = analyzeDescription('Контекст: Очереди утром\nПользователи: Студенты\nПотребность: Уменьшить ожидание');
  assert.equal(result.fields.users,'Студенты'); assert.equal(result.fields.context,'Очереди утром');
  assert.equal(result.fields.expectedResult,'');
  assert.equal(analyzeDescription('Уточнение',seedState().tasks[0]).questions.length,3);
  assert.throws(() => analyzeDescription('  '));
  assert.throws(() => validateAnalysis({ fields: {}, questions: [] }));
});
test('publishing allows a low-score task but rejects required whitespace fields', () => {
  const task = { ...blankTask(), title:'Новая задача', need:'Помочь с продажами',topic:'Retail' };
  assert.equal(rating(task).score,0); assert.deepEqual(validateTask(task),{});
  assert.ok(validateTask({...task,title:'   '}).title);
});
test('proposals require all content and a safe http(s) prototype URL', () => {
  const proposal = {...seedState().proposals[0]};
  assert.deepEqual(validateProposal(proposal),{});
  assert.ok(validateProposal({...proposal,idea:'   '}).idea);
  assert.ok(validateProposal({...proposal,link:'javascript:alert(1)'}).link);
  assert.ok(validateProposal({...proposal,link:''}).link);
  assert.equal(safeUrl('https://example.com'), 'https://example.com/');
  assert.equal(safeUrl('file:///secret'),null);
});
test('saved tasks and manual decisions round-trip without resetting', () => {
  const state = seedState(); state.proposals[0].status='selected';
  const memory = new Map(); const storage = {getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
  assert.equal(saveState(storage,state),'');
  const loaded = loadState(storage);
  assert.equal(loaded.state.proposals[0].status,'selected'); assert.equal(loaded.blocked,false);
  assert.deepEqual(parseSavedState(JSON.stringify(state)),state);
});
test('bad storage cannot crash or silently overwrite original records', () => {
  const loaded = loadState({ getItem:()=>'{broken' });
  assert.equal(loaded.blocked,true); assert.ok(loaded.warning); assert.equal(loaded.state.tasks.length,5);
  assert.ok(saveState({setItem:()=>{throw new Error('Quota exceeded');}},seedState()));
  assert.throws(()=>parseSavedState(JSON.stringify({version:2,tasks:[null],proposals:[],teams:[]})));
});
test('old local data is migrated and IDs retain proposal associations', () => {
  const oldTask = { ...seedState().tasks[4],id:5,title:'Моя задача' };
  const oldProposal = {...seedState().proposals[0],id:100,taskId:5,status:'selected'};
  const map = new Map([['taskforge-tasks',JSON.stringify([oldTask])],['taskforge-proposals',JSON.stringify([oldProposal])]]);
  const result = loadState({getItem:key=>map.get(key)||null});
  assert.equal(result.blocked,false);
  assert.equal(result.state.tasks.find(task=>task.id==='5').title,'Моя задача');
  assert.equal(result.state.proposals.find(p=>p.id==='p100').taskId,'5');
  assert.equal(result.state.proposals.find(p=>p.id==='p100').status,'selected');
});
