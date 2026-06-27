import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TimerStatus = 'idle' | 'running' | 'paused';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function TimerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { addMinutes } = useTime();
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status]);

  const handleStop = () => {
    const elapsedMinutes = Math.round(seconds / 60);
    addMinutes(elapsedMinutes);
    setStatus('idle');
    setSeconds(0);
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

        <ThemedText style={styles.statusText}>
          {status === 'idle' && '記録を開始しましょう'}
          {status === 'running' && '記録中...'}
          {status === 'paused' && '一時停止中'}
        </ThemedText>

        <View style={styles.buttonArea}>
          {status === 'idle' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => setStatus('running')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnTextLight}>開始</Text>
            </TouchableOpacity>
          )}

          {status === 'running' && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnWarning]}
                onPress={() => setStatus('paused')}
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
                onPress={() => setStatus('running')}
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
      </SafeAreaView>
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
