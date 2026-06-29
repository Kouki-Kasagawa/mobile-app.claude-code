import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FatigueBattery } from '@/components/FatigueBattery';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useTime } from '@/context/TimeContext';
import { useFatigue } from '@/hooks/use-fatigue';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CharacterStage = {
  emoji: string;
  message: string;
};

const STAGE_THRESHOLDS = [0, 60, 300, 600, 1500];
const STAGE_NEXT_EMOJIS = ['🌿', '🌻', '🌳', '⭐'];

function getCharacterStage(totalMinutes: number): CharacterStage {
  if (totalMinutes >= 1500) return { emoji: '⭐', message: '立派に育ったね' };
  if (totalMinutes >= 600)  return { emoji: '🌳', message: '大きくなってきた' };
  if (totalMinutes >= 300)  return { emoji: '🌻', message: 'すくすく成長中' };
  if (totalMinutes >= 60)   return { emoji: '🌿', message: '芽が出てきた' };
  return { emoji: '🌱', message: 'はじめの一歩' };
}

type StageProgress = {
  progress: number;
  remaining: number;
  nextEmoji: string | null;
  isMax: boolean;
};

function getStageProgress(totalMinutes: number): StageProgress {
  const idx = STAGE_THRESHOLDS.findIndex(
    (t, i) => i === STAGE_THRESHOLDS.length - 1 || totalMinutes < STAGE_THRESHOLDS[i + 1]
  );
  if (idx === STAGE_THRESHOLDS.length - 1) {
    return { progress: 1, remaining: 0, nextEmoji: null, isMax: true };
  }
  const stageStart = STAGE_THRESHOLDS[idx];
  const stageEnd = STAGE_THRESHOLDS[idx + 1];
  return {
    progress: (totalMinutes - stageStart) / (stageEnd - stageStart),
    remaining: stageEnd - totalMinutes,
    nextEmoji: STAGE_NEXT_EMOJIS[idx],
    isMax: false,
  };
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { totalMinutes, todayMinutes } = useTime();
  const { fatigueState } = useFatigue();

  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const character = getCharacterStage(totalMinutes);
  const stageProgress = getStageProgress(totalMinutes);

  // ふわふわアニメーション（常時）
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // ぴょんアニメーション（時間追加時）
  const bounceScale = useSharedValue(1);
  const prevMinutes = useRef<number>(totalMinutes);
  useEffect(() => {
    if (totalMinutes > prevMinutes.current) {
      bounceScale.value = withSequence(
        withTiming(1.25, { duration: 120 }),
        withTiming(0.88, { duration: 100 }),
        withTiming(1.08, { duration: 100 }),
        withTiming(1, { duration: 80 })
      );
    }
    prevMinutes.current = totalMinutes;
  }, [totalMinutes]);

  const characterAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: bounceScale.value },
    ],
  }));

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.titleRow}>
          <ThemedText type="title">学習記録</ThemedText>
          <FatigueBattery
            level={fatigueState.level}
            score={fatigueState.scores.total}
            size="small"
          />
        </View>

        {/* キャラクターカード */}
        <View style={[
          styles.characterCard,
          { backgroundColor: isDark ? AppColors.accentDeep : AppColors.accentLight },
        ]}>
          <Animated.View style={characterAnimStyle}>
            <ThemedText style={styles.characterEmoji}>{character.emoji}</ThemedText>
          </Animated.View>
          <ThemedText style={[styles.characterMessage, { color: AppColors.accentDark }]}>
            {character.message}
          </ThemedText>
        </View>

        {/* 進捗バー */}
        <ThemedView lightColor="#FFFFFF" darkColor="#1A251C" style={styles.progressCard}>
          <View style={styles.progressLabelRow}>
            <ThemedText style={styles.progressLabel}>
              {stageProgress.isMax
                ? '最高ステージ達成！'
                : `次のステージまで あと ${stageProgress.remaining} 分`}
            </ThemedText>
            {!stageProgress.isMax && (
              <ThemedText style={styles.progressNextEmoji}>
                {stageProgress.nextEmoji}
              </ThemedText>
            )}
          </View>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2A3B2D' : '#E8F0E9' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(stageProgress.progress * 100, 100)}%` },
              ]}
            />
          </View>
        </ThemedView>

        {/* 統計カード */}
        <ThemedView lightColor="#FFFFFF" darkColor="#1A251C" style={styles.statsCard}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>累計学習時間</ThemedText>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValueBig}>{totalHours}</ThemedText>
              <ThemedText style={styles.statUnit}>時間</ThemedText>
              <ThemedText style={styles.statValueBig}>{totalMins}</ThemedText>
              <ThemedText style={styles.statUnit}>分</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>今日の学習時間</ThemedText>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValueBig}>{todayMinutes}</ThemedText>
              <ThemedText style={styles.statUnit}>分</ThemedText>
            </View>
          </View>
        </ThemedView>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  characterCard: {
    width: 180,
    height: 180,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  characterEmoji: {
    fontSize: 72,
    lineHeight: 80,
    textAlign: 'center',
  },
  characterMessage: {
    fontSize: 13,
  },
  progressCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  progressNextEmoji: {
    fontSize: 18,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: AppColors.accent,
  },
  statsCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValueBig: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
  statUnit: {
    fontSize: 16,
    color: '#9E9E9E',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
  },
});
