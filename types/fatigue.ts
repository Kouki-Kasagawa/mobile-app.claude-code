export type FatigueAxis = 'cognitive' | 'physical';
export type FatigueWeight = 1 | 2 | 5;
export type FatigueLevel = 'ok' | 'caution' | 'danger';

export interface ScheduleTag {
  id: string;
  name: string;
  axis: FatigueAxis;
  weight: FatigueWeight;
  emoji: string;
}

/**
 * 正規化された予定エントリ。
 * v3: source='manual'（手動入力）のみ。
 * v4: source='calendar'（Googleカレンダー等）を追加予定。
 * calcFatigueScore() はどちらのソースも同一ロジックで処理できる。
 */
export interface ScheduleEntry {
  id: string;
  tagId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  source: 'manual' | 'calendar';
  title?: string; // v4でカレンダーイベント名を上書き
  externalId?: string; // v4でカレンダーイベントID
}

export interface BaselineConfig {
  enabled: boolean;
  startHour: number;
  endHour: number;
  weekdaysOnly: boolean;
}

export interface FatigueScores {
  physical: number;
  cognitive: number;
  total: number;
}

export interface FatigueState {
  level: FatigueLevel;
  scores: FatigueScores;
  isOverThreshold: boolean;
  wasYesterdayHigh: boolean;
}
