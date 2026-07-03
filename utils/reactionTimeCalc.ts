import type { ReactionTrial } from '@/types/studyLog';

function validReactionTimes(trials: ReactionTrial[]): number[] {
  return trials
    .map(t => t.reactionMs)
    .filter((ms): ms is number => ms != null);
}

export function calcAverageReactionMs(trials: ReactionTrial[]): number {
  const valid = validReactionTimes(trials);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

export function calcMedianReactionMs(trials: ReactionTrial[]): number {
  const valid = validReactionTimes(trials).sort((a, b) => a - b);
  if (valid.length === 0) return 0;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0
    ? Math.round((valid[mid - 1] + valid[mid]) / 2)
    : valid[mid];
}

export function calcAccuracy(trials: ReactionTrial[]): number {
  if (trials.length === 0) return 0;
  const correct = trials.filter(t => t.reactionMs != null).length;
  return correct / trials.length;
}
