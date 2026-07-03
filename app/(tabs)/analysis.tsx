import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuadrantChart } from '@/components/QuadrantChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { AppColors } from '@/constants/theme';
import { useFatigueContext } from '@/context/FatigueContext';
import { useStudyLogContext } from '@/context/StudyLogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { buildActivityCsv, buildExportJson, buildSessionsCsv, ExportBundle } from '@/utils/exportLog';
import { saveAndShare } from '@/utils/fileExport';
import { buildQuadrantPoints } from '@/utils/quadrant';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AnalysisScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { sessions, subjectiveEntries, reactionResults } = useStudyLogContext();
  const { entries: activityEntries, tags: activityTags } = useFatigueContext();
  const [exporting, setExporting] = useState(false);

  const points = useMemo(
    () => buildQuadrantPoints(sessions, subjectiveEntries, reactionResults),
    [sessions, subjectiveEntries, reactionResults]
  );

  const cardBg = isDark ? '#1A251C' : '#FFFFFF';
  const mutedColor = isDark ? '#9E9E9E' : '#AAAAAA';

  const buildBundle = (): ExportBundle => ({
    sessions,
    subjectiveEntries,
    reactionResults,
    activityEntries,
    activityTags,
  });

  const hasData = sessions.length > 0 || activityEntries.length > 0;

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const bundle = buildBundle();
      const sessionsCsv = buildSessionsCsv(bundle);
      const activityCsv = buildActivityCsv(bundle);
      const combined = `# sessions\n${sessionsCsv}\n\n# activities\n${activityCsv}\n`;
      await saveAndShare(`study_log_${todayStr()}.csv`, combined, 'text/csv');
    } catch {
      Alert.alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const bundle = buildBundle();
      const json = buildExportJson(bundle);
      await saveAndShare(`study_log_${todayStr()}.json`, json, 'application/json');
    } catch {
      Alert.alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <ThemedText type="title">分析</ThemedText>

          {points.length === 0 ? (
            <ThemedView lightColor={cardBg} darkColor={cardBg} style={styles.card}>
              <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
                学習前後に主観スコアと反応速度テストの両方を記録すると、ここに分析結果が表示されます。
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedView lightColor={cardBg} darkColor={cardBg} style={styles.card}>
                <ThemedText style={styles.cardTitle}>4象限マトリクス</ThemedText>
                <QuadrantChart points={points} />
              </ThemedView>

              <ThemedView lightColor={cardBg} darkColor={cardBg} style={styles.card}>
                <ThemedText style={styles.cardTitle}>時系列推移</ThemedText>
                <TimeSeriesChart points={points} />
              </ThemedView>
            </>
          )}

          <ThemedView lightColor={cardBg} darkColor={cardBg} style={styles.card}>
            <ThemedText style={styles.cardTitle}>データエクスポート</ThemedText>
            <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
              学習ログ・活動ログ・主観スコア・反応時間の記録をまとめて書き出します。
            </ThemedText>
            <View style={styles.exportRow}>
              <TouchableOpacity
                style={[styles.exportBtn, { borderColor: AppColors.accent }, (!hasData || exporting) && styles.exportBtnDisabled]}
                onPress={handleExportCsv}
                disabled={!hasData || exporting}
                activeOpacity={0.7}
              >
                <Text style={[styles.exportBtnText, { color: AppColors.accent }]}>CSVエクスポート</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportBtn, { borderColor: AppColors.accent }, (!hasData || exporting) && styles.exportBtnDisabled]}
                onPress={handleExportJson}
                disabled={!hasData || exporting}
                activeOpacity={0.7}
              >
                <Text style={[styles.exportBtnText, { color: AppColors.accent }]}>JSONエクスポート</Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', alignSelf: 'flex-start' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  exportBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exportBtnDisabled: {
    opacity: 0.4,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
