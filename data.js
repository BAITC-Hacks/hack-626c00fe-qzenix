// Синтетические данные для демонстрации без сервера.
import { blankTask } from './domain.js';

export const teams = [
  { id: 'team-1', name: 'NeoData', interests: ['Retail', 'Data & AI'], skills: ['Аналитика', 'Прогнозирование'], technologies: ['Python', 'Pandas', 'React'] },
  { id: 'team-2', name: 'Campus Crew', interests: ['EdTech'], skills: ['UX-исследования', 'Веб-разработка'], technologies: ['React', 'Figma'] },
  { id: 'team-3', name: 'Insight Lab', interests: ['Customer Experience'], skills: ['NLP', 'Визуализация'], technologies: ['Python', 'JavaScript'] },
  { id: 'team-4', name: 'Flow Makers', interests: ['Smart Campus'], skills: ['Продуктовый дизайн', 'Аналитика'], technologies: ['Figma', 'React'] },
  { id: 'team-5', name: 'ByteBloom', interests: ['Retail', 'Автоматизация'], skills: ['Веб-разработка', 'Прототипирование'], technologies: ['JavaScript', 'CSS'] },
];
const task = (values) => ({ ...blankTask(), confirmedAt: '2026-09-23T08:00:00Z', published: true, ...values });
export const demoTasks = [
  task({ id: '1', title: 'Прогноз спроса на товары', topic: 'Data & AI', rawDescription: 'Нужно точнее планировать закупки в сети магазинов.', context: 'Сеть магазинов сталкивается с дефицитом популярных товаров и избытком других.', need: 'Помочь закупщикам планировать остатки по магазинам.', users: 'Закупщики и управляющие магазинов.', data: 'Обезличенные продажи за 24 месяца, остатки и календарь акций.', constraints: 'Прототип за 3 недели. Работа только с обезличенными данными.', expectedResult: 'Дашборд с прогнозом спроса по категории и магазину.', successCriteria: 'Ошибка прогноза не выше 15% на контрольной выборке.', contact: 'Айжан, product@example.com', interactionFormat: '30-минутная консультация раз в неделю.' }),
  task({ id: '2', title: 'Навигатор первокурсника', topic: 'EdTech', rawDescription: 'Нужен понятный навигатор по сервисам университета.', context: 'Первокурсники не знают, куда обращаться с учебными и бытовыми вопросами.', need: 'Собрать понятный маршрут первого семестра.', users: 'Первокурсники университета.', constraints: 'Веб-прототип без регистрации за 2 недели.', expectedResult: 'Интерактивная карта сервисов и справочник.', successCriteria: 'Нужный сервис находится максимум за 3 клика.', contact: 'Дана, campus@example.com', interactionFormat: 'Две встречи с командой за время проекта.' }),
  task({ id: '3', title: 'Отзывы, которые помогают сервису', topic: 'Customer Experience', rawDescription: 'Хотим объединить обратную связь клиентов в одном месте.', context: 'Отзывы приходят по разным каналам и не попадают в общий отчёт.', need: 'Собирать отзывы и группировать повторяющиеся проблемы.', data: '100 синтетических отзывов и перечень услуг.', expectedResult: 'Форма обратной связи и сводка по темам.' }),
  task({ id: '4', title: 'Меньше очередей в столовой', topic: 'Smart Campus', rawDescription: 'В обед в столовой большие очереди.', context: 'Во время обеденного перерыва очередь занимает до 20 минут.', need: 'Понять пики нагрузки и предложить способ сократить ожидание.', users: 'Студенты и сотрудники столовой.' }),
  task({ id: '5', title: 'Нужно улучшить продажи', topic: 'Retail', rawDescription: 'Нужно улучшить продажи', need: 'Нужно улучшить продажи' }),
];
export const demoProposals = [
  { id: 'p1', taskId: '1', teamId: 'team-1', team: 'NeoData', idea: 'Прогнозировать спрос на основе сезонности и истории продаж.', plan: 'Проверить данные → сравнить модели → собрать дашборд.', deadline: '3 недели', link: 'https://example.com/prototypes/neodata', status: 'new' },
  { id: 'p2', taskId: '2', teamId: 'team-2', team: 'Campus Crew', idea: 'Сделать каталог сервисов с понятными маршрутами.', plan: 'Провести интервью → нарисовать карту → собрать прототип.', deadline: '2 недели', link: 'https://example.com/prototypes/campus', status: 'new' },
  { id: 'p3', taskId: '3', teamId: 'team-3', team: 'Insight Lab', idea: 'Группировать отзывы по темам и показывать частые проблемы.', plan: 'Разметить примеры → сделать форму → собрать отчёт.', deadline: '10 дней', link: 'https://example.com/prototypes/insight', status: 'new' },
  { id: 'p4', taskId: '4', teamId: 'team-4', team: 'Flow Makers', idea: 'Составить карту нагрузки столовой по времени.', plan: 'Измерить очереди → проверить гипотезы → показать макет.', deadline: '2 недели', link: 'https://example.com/prototypes/flow', status: 'new' },
  { id: 'p5', taskId: '1', teamId: 'team-5', team: 'ByteBloom', idea: 'Собрать интерфейс сравнения сценариев закупок.', plan: 'Уточнить сценарии → разработать интерфейс → обсудить с закупщиком.', deadline: '3 недели', link: 'https://example.com/prototypes/bytebloom', status: 'new' },
];
export const seedState = () => ({ version: 2, tasks: structuredClone(demoTasks), proposals: structuredClone(demoProposals), teams: structuredClone(teams) });
