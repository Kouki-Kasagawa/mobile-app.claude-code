/**
 * 端末のローカル時刻（日本なら日本時間）で 'YYYY-MM-DD' を返す。
 *
 * `toISOString().slice(0, 10)` は UTC の日付になるため、日本時間の 0〜9 時には
 * 前日の日付になってしまう。日付キーは必ずこの関数で作ること。
 */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 今日（ローカル時刻）の 'YYYY-MM-DD' */
export function todayKey(): string {
  return localDateKey();
}

/** 昨日（ローカル時刻）の 'YYYY-MM-DD' */
export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}
