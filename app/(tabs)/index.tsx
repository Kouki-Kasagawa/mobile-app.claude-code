import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CharacterStage = {
  emoji: string;
  message: string;
};

function getCharacterStage(totalMinutes: number): CharacterStage {
  if (totalMinutes >= 1500) return { emoji: '⭐', message: '立派に育ったね' };
  if (totalMinutes >= 600)  return { emoji: '🌳', message: '大きくなってきた' };
  if (totalMinutes >= 300)  return { emoji: '🌻', message: 'すくすく成長中' };
  if (totalMinutes >= 60)   return { emoji: '🌿', message: '芽が出てきた' };
  return { emoji: '🌱', message: 'はじめの一歩' };
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { totalMinutes, todayMinutes } = useTime();

  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const character = getCharacterStage(totalMinutes);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <ThemedText type="title" style={styles.appTitle}>学習記録</ThemedText>

        <View style={[
          styles.characterCard,
          { backgroundColor: isDark ? AppColors.accentDeep : AppColors.accentLight },
        ]}>
          <ThemedText style={styles.characterEmoji}>{character.emoji}</ThemedText>
          <ThemedText style={[styles.characterMessage, { color: AppColors.accentDark }]}>
            {character.message}
          </ThemedText>
        </View>

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
  },
  appTitle: {
    marginBottom: 32,
  },
  characterCard: {
    width: 180,
    height: 180,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    gap: 8,
  },
  characterEmoji: {
    fontSize: 72,
    lineHeight: 80,
  },
  characterMessage: {
    fontSize: 13,
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
