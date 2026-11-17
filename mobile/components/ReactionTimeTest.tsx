import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactionTrial } from '@/types/studyLog';
import { calcAccuracy, calcAverageReactionMs } from '@/utils/reactionTimeCalc';

const TRIAL_COUNT = 5;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;
const FALSE_START_PAUSE_MS = 1000;

type Phase = 'intro' | 'waiting' | 'active' | 'falseStart' | 'result';

export interface ReactionTestResult {
  trials: ReactionTrial[];
  avgReactionMs: number;
  accuracy: number;
}

export function ReactionTimeTest({
  visible,
  onComplete,
  onCancel,
}: {
  visible: boolean;
  onComplete: (result: ReactionTestResult) => void;
  onCancel: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [phase, setPhase] = useState<Phase>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState<ReactionTrial[]>([]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stimulusShownAtRef = useRef<number>(0);
  const currentDelayRef = useRef<number>(0);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPendingTimeout();
  }, [clearPendingTimeout]);

  useEffect(() => {
    if (!visible) {
      clearPendingTimeout();
      setPhase('intro');
      setTrialIndex(0);
      setTrials([]);
    }
  }, [visible, clearPendingTimeout]);

  const scheduleTrial = useCallback(() => {
    const delayMs = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    currentDelayRef.current = delayMs;
    setPhase('waiting');
    timeoutRef.current = setTimeout(() => {
      stimulusShownAtRef.current = Date.now();
      setPhase('active');
    }, delayMs);
  }, []);

  const finalize = useCallback(
    (finalTrials: ReactionTrial[]) => {
      const result: ReactionTestResult = {
        trials: finalTrials,
        avgReactionMs: calcAverageReactionMs(finalTrials),
        accuracy: calcAccuracy(finalTrials),
      };
      setPhase('result');
      onComplete(result);
    },
    [onComplete]
  );

  const recordTrial = useCallback(
    (trial: ReactionTrial, pauseMs = 0) => {
      setTrials(prev => {
        const next = [...prev, trial];
        const isDone = next.length >= TRIAL_COUNT;
        const proceed = () => (isDone ? finalize(next) : scheduleTrial());
        if (!isDone) setTrialIndex(next.length);
        if (pauseMs > 0) {
          timeoutRef.current = setTimeout(proceed, pauseMs);
        } else {
          proceed();
        }
        return next;
      });
    },
    [finalize, scheduleTrial]
  );

  const handleStart = () => {
    setTrials([]);
    setTrialIndex(0);
    scheduleTrial();
  };

  const handleTapArea = () => {
    if (phase === 'waiting') {
      clearPendingTimeout();
      setPhase('falseStart');
      recordTrial({ delayMs: currentDelayRef.current, reactionMs: null }, FALSE_START_PAUSE_MS);
      return;
    }
    if (phase === 'active') {
      const reactionMs = Date.now() - stimulusShownAtRef.current;
      recordTrial({ delayMs: currentDelayRef.current, reactionMs });
    }
  };

  const cardBg = isDark ? '#1A251C' : '#FFFFFF';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={[styles.root, { backgroundColor: isDark ? '#151718' : '#F7F7F7' }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">反応速度テスト</ThemedText>
          <TouchableOpacity onPress={onCancel} hitSlop={12}>
            <Text style={[styles.closeBtn, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {phase === 'intro' && (
          <View style={styles.centerArea}>
            <ThemedText style={styles.introText}>
              円が表示されたら、できるだけ早くタップしてください。{'\n'}
              全{TRIAL_COUNT}回計測します。
            </ThemedText>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: AppColors.accent }]}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>テストを始める</Text>
            </TouchableOpacity>
          </View>
        )}

        {(phase === 'waiting' || phase === 'active' || phase === 'falseStart') && (
          <TouchableOpacity
            style={styles.tapArea}
            activeOpacity={1}
            onPress={handleTapArea}
          >
            <ThemedText style={styles.progressText}>
              {trialIndex + 1} / {TRIAL_COUNT}
            </ThemedText>
            {phase === 'waiting' && (
              <ThemedText style={styles.waitingText}>まだです、待って…</ThemedText>
            )}
            {phase === 'active' && (
              <View style={[styles.target, { backgroundColor: AppColors.accent }]} />
            )}
            {phase === 'falseStart' && (
              <ThemedText style={[styles.waitingText, { color: AppColors.warning }]}>
                早すぎました！次にいきます
              </ThemedText>
            )}
          </TouchableOpacity>
        )}

        {phase === 'result' && (
          <View style={styles.centerArea}>
            <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.resultTitle}>お疲れさまでした</ThemedText>
              <ThemedText style={styles.resultLine}>
                平均反応時間: {calcAverageReactionMs(trials)}ms
              </ThemedText>
              <ThemedText style={styles.resultLine}>
                正答率: {Math.round(calcAccuracy(trials) * 100)}%
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: AppColors.accent }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>完了</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeBtn: { fontSize: 14, fontWeight: '600' },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  startBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tapArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  progressText: {
    position: 'absolute',
    top: 16,
    fontSize: 13,
    color: '#9E9E9E',
  },
  waitingText: {
    fontSize: 16,
  },
  target: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  resultCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  resultLine: {
    fontSize: 15,
  },
});
