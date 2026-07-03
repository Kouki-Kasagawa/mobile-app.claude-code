import type { ReactionTimeResult, StudySession, SubjectiveEntry, SubjectiveTiming } from '@/types/studyLog';

/** 主観スコア(1-5)の閾値。この値以上を「疲労High」とみなす。 */
export const SUBJECTIVE_THRESHOLD = 3;

/** 客観スコア(平均反応時間ms)の閾値。この値以上を「疲労High」とみなす。 */
export const OBJECTIVE_THRESHOLD_MS = 450;

/** 反応時間の正規化に使う想定レンジ。個人差があるため将来パーソナライズ可能。 */
export const OBJECTIVE_MS_MIN = 250;
export const OBJECTIVE_MS_MAX = 700;

export type QuadrantLabel = 'stable' | 'tension' | 'distress' | 'eustress';

export interface QuadrantPoint {
  id: string;
  timestamp: string;
  subjectiveScore: number; // 1-5
  objectiveMs: number; // 平均反応時間(ms)
  subjectiveHigh: boolean;
  objectiveHigh: boolean;
  quadrant: QuadrantLabel;
}

export function isSubjectiveHigh(score: number, threshold = SUBJECTIVE_THRESHOLD): boolean {
  return score >= threshold;
}

export function isObjectiveHigh(avgReactionMs: number, threshold = OBJECTIVE_THRESHOLD_MS): boolean {
  return avgReactionMs >= threshold;
}

/**
 * 主観High×客観High=Distress(苦悩)、主観Low×客観High=Eustress(気づかぬ頑張り)とする。
 * 「気づかない疲労」を最も危険な状態として際立たせる配置。ラベルの好みが違えば
 * この関数を直すだけで良い。
 */
export function classifyQuadrant(subjectiveHigh: boolean, objectiveHigh: boolean): QuadrantLabel {
  if (!subjectiveHigh && !objectiveHigh) return 'stable';
  if (subjectiveHigh && objectiveHigh) return 'distress';
  if (subjectiveHigh && !objectiveHigh) return 'tension';
  return 'eustress';
}

export const QUADRANT_META: Record<QuadrantLabel, { label: string; description: string; color: string }> = {
  stable: {
    label: 'Stable（安定）',
    description: '心身ともに落ち着いている状態',
    color: '#6BAE75',
  },
  tension: {
    label: 'Tension（緊張）',
    description: '気持ちは疲れているが、実際はまだ動ける状態',
    color: '#F5A623',
  },
  distress: {
    label: 'Distress（苦悩）',
    description: '心身ともに疲れている状態。休息を優先しよう',
    color: '#EF5B5B',
  },
  eustress: {
    label: 'Eustress（気づかぬ頑張り）',
    description: '自覚がないまま実際には疲れが溜まっている状態。要注意',
    color: '#5B8DEF',
  },
};

export function normalizeObjective(avgReactionMs: number): number {
  const clamped = Math.min(Math.max(avgReactionMs, OBJECTIVE_MS_MIN), OBJECTIVE_MS_MAX);
  return ((clamped - OBJECTIVE_MS_MIN) / (OBJECTIVE_MS_MAX - OBJECTIVE_MS_MIN)) * 100;
}

export function normalizeSubjective(score: number): number {
  const clamped = Math.min(Math.max(score, 1), 5);
  return ((clamped - 1) / 4) * 100;
}

export function buildQuadrantPoint(input: {
  id: string;
  timestamp: string;
  subjectiveScore: number;
  objectiveMs: number;
  subjectiveThreshold?: number;
  objectiveThreshold?: number;
}): QuadrantPoint {
  const subjectiveHigh = isSubjectiveHigh(input.subjectiveScore, input.subjectiveThreshold);
  const objectiveHigh = isObjectiveHigh(input.objectiveMs, input.objectiveThreshold);
  return {
    id: input.id,
    timestamp: input.timestamp,
    subjectiveScore: input.subjectiveScore,
    objectiveMs: input.objectiveMs,
    subjectiveHigh,
    objectiveHigh,
    quadrant: classifyQuadrant(subjectiveHigh, objectiveHigh),
  };
}

/**
 * セッション・主観スコア・反応時間テストを突き合わせ、同一セッション×同一timing(pre/post)で
 * 両方が揃っているものだけを4象限プロット用データに変換する。
 */
export function buildQuadrantPoints(
  sessions: StudySession[],
  subjectiveEntries: SubjectiveEntry[],
  reactionResults: ReactionTimeResult[]
): QuadrantPoint[] {
  const points: QuadrantPoint[] = [];
  const timings: SubjectiveTiming[] = ['pre', 'post'];

  for (const session of sessions) {
    for (const timing of timings) {
      const subjId = timing === 'pre' ? session.subjectivePreId : session.subjectivePostId;
      const reactId = timing === 'pre' ? session.reactionPreId : session.reactionPostId;
      if (!subjId || !reactId) continue;

      const subj = subjectiveEntries.find(e => e.id === subjId);
      const react = reactionResults.find(r => r.id === reactId);
      if (!subj || !react) continue;

      points.push(
        buildQuadrantPoint({
          id: `${session.id}_${timing}`,
          timestamp: react.timestamp,
          subjectiveScore: subj.score,
          objectiveMs: react.avgReactionMs,
        })
      );
    }
  }

  return points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
