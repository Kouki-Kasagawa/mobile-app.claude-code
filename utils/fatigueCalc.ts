import type {
  BaselineConfig,
  FatigueLevel,
  FatigueScores,
  FatigueState,
  ScheduleEntry,
  ScheduleTag,
} from '@/types/fatigue';

/**
 * 疲労スコアを計算する純粋関数。
 *
 * スコアの意味:
 *   身体的: タグ重み × 時間（例: 部活5点×2h = 10点）
 *   認知的: タグ重み × 時間 ＋ ベースライン（学校/仕事時間 ÷ workHoursPerStudy）
 *
 * v4 拡張: ScheduleEntry.source が 'calendar' でも同じロジックで動く。
 */
export function calcFatigueScore(
  entries: ScheduleEntry[],
  tags: Record<string, ScheduleTag>,
  dateStr: string,
  baseline: BaselineConfig,
  workHoursPerStudy: number,
): FatigueScores {
  let physical = 0;
  let cognitive = 0;

  // ベースライン: 学校/職場にいる時間帯を内部的に認知負荷として加算
  if (baseline.enabled) {
    const date = new Date(dateStr + 'T00:00:00');
    const dow = date.getDay(); // 0=Sun, 6=Sat
    const isTarget = !baseline.weekdaysOnly || (dow >= 1 && dow <= 5);
    if (isTarget) {
      const baseHours = Math.max(0, baseline.endHour - baseline.startHour);
      // v1 の 7:1 換算ロジック流用: workHoursPerStudy 時間 = 1単位の認知負荷
      cognitive += baseHours / workHoursPerStudy;
    }
  }

  // 個別予定エントリのスコア加算
  for (const entry of entries) {
    if (entry.date !== dateStr) continue;
    const tag = tags[entry.tagId];
    if (!tag) continue;
    const hours = entry.durationMinutes / 60;
    const score = tag.weight * hours;
    if (tag.axis === 'physical') {
      physical += score;
    } else {
      cognitive += score;
    }
  }

  return { physical, cognitive, total: physical + cognitive };
}

export function getFatigueLevel(total: number, threshold: number): FatigueLevel {
  if (total >= threshold) return 'danger';
  if (total >= threshold * 0.57) return 'caution'; // 閾値の57%で注意（デフォルト7点なら4点）
  return 'ok';
}

/**
 * 優先順位付き閾値判定を適用して FatigueState を構築する。
 *
 * 判定優先順位（仕様 §2-1）:
 *   ① その日のスコア合計が閾値超過
 *   ② 前日スコアが高かった → 今日は軽めに促す
 *   （③ 勉強記録が少ない日は責めない → UI側で wasYesterdayHigh を参照して文言調整）
 */
export function buildFatigueState(
  scores: FatigueScores,
  threshold: number,
  yesterdayScore: number,
): FatigueState {
  const baseLevel = getFatigueLevel(scores.total, threshold);
  const wasYesterdayHigh = yesterdayScore >= threshold;

  // ② 前日が高疲労なら今日のレベルを1段階上げて早めに警告
  let level = baseLevel;
  if (wasYesterdayHigh && baseLevel === 'ok' && scores.total > 0) {
    level = 'caution';
  }

  return {
    level,
    scores,
    isOverThreshold: scores.total >= threshold,
    wasYesterdayHigh,
  };
}

/** バッテリー残量（0〜1）に変換。疲労が高いほど残量が減る。 */
export function scoreToBatteryFill(total: number): number {
  return Math.max(0, 1 - total / 10);
}
