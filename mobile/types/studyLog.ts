export const LOCAL_USER_ID = 'local-user-001';

export interface RewardAppraisal {
  interest: number | null; // 1-5 面白さ。null は未回答
  importance: number | null; // 1-5 重要度。null は未回答
  hasDeadline: boolean;
  deadlineUrgency?: number; // 1-5、hasDeadline=trueの時のみ
}

export interface StudySession {
  id: string;
  userId: string;
  subject?: string;
  startedAt: string; // ISO
  endedAt?: string; // ISO
  durationMinutes: number;
  reward: RewardAppraisal | null;
  subjectivePreId?: string;
  subjectivePostId?: string;
  reactionPreId?: string;
  reactionPostId?: string;
  /** 将来の「予定」欄用。現時点ではUIなし、欠損許容。 */
  plannedFor?: string; // YYYY-MM-DD
}

export type SubjectiveTiming = 'pre' | 'post';

export interface SubjectiveEntry {
  id: string;
  userId: string;
  sessionId?: string;
  timing: SubjectiveTiming;
  score: number; // 1-5（疲労感・高いほど疲れている）
  note?: string;
  timestamp: string; // ISO
}

export interface ReactionTrial {
  delayMs: number;
  reactionMs: number | null; // null = 反応なし/フライング
}

export interface ReactionTimeResult {
  id: string;
  userId: string;
  sessionId?: string;
  timing: SubjectiveTiming;
  trials: ReactionTrial[];
  avgReactionMs: number;
  accuracy: number; // 0-1
  timestamp: string; // ISO
}
