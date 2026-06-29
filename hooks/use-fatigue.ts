import { useEffect, useMemo } from 'react';

import { useFatigueContext } from '@/context/FatigueContext';
import { useSettings } from '@/context/SettingsContext';
import { useTime } from '@/context/TimeContext';
import type { FatigueState, ScheduleTag } from '@/types/fatigue';
import { buildFatigueState, calcFatigueScore } from '@/utils/fatigueCalc';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface FatigueHookResult {
  fatigueState: FatigueState;
  todayEntries: ReturnType<typeof useFatigueContext>['entries'];
  isRestDay: boolean;
  threshold: number;
  tags: ScheduleTag[];
}

/**
 * 疲労推定の主要ロジックを統合するカスタムフック。
 *
 * 閾値判定の優先順位（仕様 §2-1）:
 *   ① その日の疲労スコア合計が閾値超過
 *   ② 前日スコアが高かった → caution に引き上げ
 *   ③ 勉強記録が少なくても責めない → wasYesterdayHigh を UI が参照
 */
export function useFatigue(): FatigueHookResult {
  const { entries, tags: tagList, baseline, threshold, restDays, scoreHistory, recordTodayScore } =
    useFatigueContext();
  const { workHoursPerStudy } = useSettings();
  const { history } = useTime();

  const today = todayStr();
  const yesterday = yesterdayStr();

  // タグを Record に変換（calcFatigueScore が要求する形式）
  const tagsMap = useMemo(
    () => Object.fromEntries(tagList.map(t => [t.id, t])),
    [tagList]
  );

  const scores = useMemo(
    () => calcFatigueScore(entries, tagsMap, today, baseline, workHoursPerStudy),
    [entries, tagsMap, today, baseline, workHoursPerStudy]
  );

  const yesterdayScore = scoreHistory[yesterday] ?? 0;

  const fatigueState = useMemo(
    () => buildFatigueState(scores, threshold, yesterdayScore),
    [scores, threshold, yesterdayScore]
  );

  // 今日のスコアを履歴に記録（前日比較用）
  useEffect(() => {
    recordTodayScore(scores.total, today);
  }, [scores.total, today, recordTodayScore]);

  const todayEntries = useMemo(
    () => entries.filter(e => e.date === today),
    [entries, today]
  );

  const isRestDay = restDays.includes(today);

  return {
    fatigueState,
    todayEntries,
    isRestDay,
    threshold,
    tags: tagList,
  };
}
