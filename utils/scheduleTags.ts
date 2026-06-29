import type { ScheduleTag } from '@/types/fatigue';

export const DEFAULT_TAGS: ScheduleTag[] = [
  // 身体的疲労
  { id: 'sport',      name: '運動・部活',   axis: 'physical',  weight: 5, emoji: '🏃' },
  { id: 'labor',      name: '動くバイト',   axis: 'physical',  weight: 2, emoji: '🏋️' },
  { id: 'outing',     name: 'お出かけ',    axis: 'physical',  weight: 1, emoji: '🚶' },
  { id: 'shopping',   name: '買い物',      axis: 'physical',  weight: 1, emoji: '🛒' },
  // 認知的負荷
  { id: 'exam',       name: '試験・テスト', axis: 'cognitive', weight: 5, emoji: '🧠' },
  { id: 'homework',   name: '課題・宿題',   axis: 'cognitive', weight: 2, emoji: '📝' },
  { id: 'cert_study', name: '資格勉強',    axis: 'cognitive', weight: 2, emoji: '📚' },
  { id: 'task_heavy', name: 'タスク過多',   axis: 'cognitive', weight: 2, emoji: '🧠' },
  { id: 'desk_job',   name: '座り仕事',    axis: 'cognitive', weight: 1, emoji: '💼' },
];
