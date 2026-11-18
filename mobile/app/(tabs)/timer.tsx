import AsyncStorage from '@react-native-async-storage/async-storage';
import { ComponentProps, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostSessionModal } from '@/components/PostSessionModal';
import { PreSessionModal } from '@/components/PreSessionModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useStudyLogContext } from '@/context/StudyLogContext';
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TimerStatus = 'idle' | 'running' | 'paused';

/**
 * 計測中のタイマーを端末に保存するときの形。
 * 「1秒ずつ数える」のではなく「動き出した時刻」を持つので、リロード・タブを閉じる・
 * アプリを裏に回す、のどれがあっても経過時間を計算し直せる（#2）。
 */
type ActiveTimer = {
  sessionId: string;
  status: 'running' | 'paused';
  /** 一時停止までにたまった時間（ミリ秒） */
  accumulatedMs: number;
  /** 今回動き出した時刻（Date.now()）。一時停止中は null */
  runStartedAt: number | null;
};

const ACTIVE_TIMER_KEY = 'activeTimer';
/** 計測中のまま開き直したとき、経過がこれを超えていたら「続けますか？」と聞く */
const STALE_TIMER_MS = 6 * 60 * 60 * 1000;

function elapsedMsOf(t: { accumulatedMs: number; runStartedAt: number | null }, now: number): number {
  return t.accumulatedMs + (t.runStartedAt != null ? now - t.runStartedAt : 0);
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  return `${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`;
}

export default function TimerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { addMinutes } = useTime();
  const { startSession, finishSession, addSubjectiveEntry, addReactionResult } = useStudyLogContext();
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);
  /** 長時間たってから開き直したときの経過時間。null 以外なら「続けますか？」を出す */
  const [staleMs, setStaleMs] = useState<number | null>(null);
  const [preModalVisible, setPreModalVisible] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);

  const elapsedMs = elapsedMsOf({ accumulatedMs, runStartedAt }, now);
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));

  // 起動時：保存されている計測があれば、その状態に戻す
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ACTIVE_TIMER_KEY);
        if (raw) {
          const saved: ActiveTimer = JSON.parse(raw);
          const t = Date.now();
          setSessionId(saved.sessionId);
          setStatus(saved.status);
          setAccumulatedMs(saved.accumulatedMs);
          setRunStartedAt(saved.runStartedAt);
          setNow(t);
          const total = elapsedMsOf(saved, t);
          if (saved.status === 'running' && total > STALE_TIMER_MS) setStaleMs(total);
        }
      } catch {
        // 読み込みに失敗したら、計測なしの状態から始める
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // 計測の状態が変わるたびに保存する。終わったら消す（読み込みが終わる前は何もしない）
  useEffect(() => {
    if (!loaded) return;
    if (status === 'idle' || !sessionId) {
      AsyncStorage.removeItem(ACTIVE_TIMER_KEY).catch(() => {});
      return;
    }
    const data: ActiveTimer = { sessionId, status, accumulatedMs, runStartedAt };
    AsyncStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(data)).catch(() => {});
  }, [loaded, status, sessionId, accumulatedMs, runStartedAt]);

  // 計測中は1秒ごとに「今の時刻」を更新して、経過時間を計算し直す
  useEffect(() => {
    if (status !== 'running') return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  // 動いている分の時間を accumulatedMs に移して止める
  const freeze = () => {
    const t = Date.now();
    setAccumulatedMs(prev => prev + (runStartedAt != null ? t - runStartedAt : 0));
    setRunStartedAt(null);
    setNow(t);
  };

  const resetTimer = () => {
    setStatus('idle');
    setSessionId(null);
    setAccumulatedMs(0);
    setRunStartedAt(null);
    setPostModalVisible(false);
  };

  const handlePause = () => {
    freeze();
    setStatus('paused');
  };

  const handleResume = () => {
    const t = Date.now();
    setRunStartedAt(t);
    setNow(t);
    setStatus('running');
  };

  // 停止は「止めて学習後チェックを開く」だけ。チェックが終わるまでは一時停止の扱いにしておくので、
  // チェック中にリロードしても計測は残る
  const handleStop = () => {
    freeze();
    setStatus('paused');
    setPostModalVisible(true);
  };

  const handleStaleContinue = () => {
    setStaleMs(null);
  };

  // 長時間放置されていた計測を、時間を記録せずに終わらせる
  const handleStaleDiscard = () => {
    if (sessionId) finishSession(sessionId, 0);
    setStaleMs(null);
    resetTimer();
  };

  const handlePreSessionDone: ComponentProps<typeof PreSessionModal>['onDone'] = input => {
    const newSessionId = startSession({ subject: input.subject, reward: input.reward });
    if (input.subjectiveScore != null) {
      addSubjectiveEntry({
        sessionId: newSessionId,
        timing: 'pre',
        score: input.subjectiveScore,
        note: input.subjectiveNote,
      });
    }
    if (input.reaction) {
      addReactionResult({
        sessionId: newSessionId,
        timing: 'pre',
        trials: input.reaction.trials,
        avgReactionMs: input.reaction.avgReactionMs,
        accuracy: input.reaction.accuracy,
      });
    }
    const t = Date.now();
    setSessionId(newSessionId);
    setAccumulatedMs(0);
    setRunStartedAt(t);
    setNow(t);
    setPreModalVisible(false);
    setStatus('running');
  };

  const handlePostSessionDone: ComponentProps<typeof PostSessionModal>['onDone'] = input => {
    // 停止の時点で freeze しているので、elapsedMs は止めたときの時間
    const elapsedMinutes = Math.round(elapsedMs / 60000);
    addMinutes(elapsedMinutes);

    if (sessionId) {
      finishSession(sessionId, elapsedMinutes);
      if (input.subjectiveScore != null) {
        addSubjectiveEntry({
          sessionId,
          timing: 'post',
          score: input.subjectiveScore,
          note: input.subjectiveNote,
        });
      }
      if (input.reaction) {
        addReactionResult({
          sessionId,
          timing: 'post',
          trials: input.reaction.trials,
          avgReactionMs: input.reaction.avgReactionMs,
          accuracy: input.reaction.accuracy,
        });
      }
    }
    resetTimer();
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <ThemedText type="subtitle" style={styles.screenTitle}>今日の学習時間</ThemedText>

        <ThemedView lightColor="#FFFFFF" darkColor="#1A251C" style={styles.timeCard}>
          <Text style={[styles.timeDisplay, { color: isDark ? '#ECEDEE' : '#2D2D2D' }]}>
            {formatTime(seconds)}
          </Text>
        </ThemedView>

        {staleMs != null ? (
          <View style={styles.staleCard}>
            <ThemedText style={styles.staleText}>
              前回の計測が {formatDuration(staleMs)} 続いたままです。{'\n'}計測を続けますか？
            </ThemedText>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleStaleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.btnTextLight}>続ける</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnMuted]}
              onPress={handleStaleDiscard}
              activeOpacity={0.8}
            >
              <Text style={styles.btnTextDark}>記録せずに終了</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>
        <ThemedText style={styles.statusText}>
          {status === 'idle' && '記録を開始しましょう'}
          {status === 'running' && '記録中...'}
          {status === 'paused' && '一時停止中'}
        </ThemedText>

        <View style={styles.buttonArea}>
          {status === 'idle' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => setPreModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnTextLight}>開始</Text>
            </TouchableOpacity>
          )}

          {status === 'running' && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnWarning]}
                onPress={handlePause}
                activeOpacity={0.8}
              >
                <Text style={styles.btnTextLight}>一時停止</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnMuted]}
                onPress={handleStop}
                activeOpacity={0.8}
              >
                <Text style={styles.btnTextDark}>停止</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'paused' && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleResume}
                activeOpacity={0.8}
              >
                <Text style={styles.btnTextLight}>再開</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnMuted]}
                onPress={handleStop}
                activeOpacity={0.8}
              >
                <Text style={styles.btnTextDark}>停止</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        </>
        )}
      </SafeAreaView>

      <PreSessionModal
        visible={preModalVisible}
        onDone={handlePreSessionDone}
        onCancel={() => setPreModalVisible(false)}
      />
      <PostSessionModal visible={postModalVisible} onDone={handlePostSessionDone} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  screenTitle: {
    marginBottom: 8,
  },
  timeCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  staleCard: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  staleText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonArea: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  btn: {
    height: 56,
    minWidth: 140,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  btnPrimary: {
    backgroundColor: AppColors.accent,
  },
  btnWarning: {
    backgroundColor: AppColors.warning,
  },
  btnMuted: {
    backgroundColor: '#E0E0E0',
  },
  btnTextLight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnTextDark: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555555',
  },
});
