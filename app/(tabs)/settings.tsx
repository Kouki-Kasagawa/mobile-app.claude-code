import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuadrantChart } from '@/components/QuadrantChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFatigueContext } from '@/context/FatigueContext';
import { ThemeMode, useSettings } from '@/context/SettingsContext';
import { useStudyLogContext } from '@/context/StudyLogContext';
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { buildActivityCsv, buildExportJson, buildSessionsCsv, ExportBundle } from '@/utils/exportLog';
import { todayKey } from '@/utils/date';
import { saveAndShare } from '@/utils/fileExport';
import { buildQuadrantPoints } from '@/utils/quadrant';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'ライト' },
  { mode: 'system', label: 'システム' },
  { mode: 'dark', label: 'ダーク' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themeMode, setThemeMode, workHoursPerStudy, setWorkHoursPerStudy, conversionRatio } = useSettings();
  const { resetAll } = useTime();
  const { user, isGuest, signOut, exitGuest } = useAuth();
  const router = useRouter();
  const { sessions, subjectiveEntries, reactionResults } = useStudyLogContext();
  const { entries: activityEntries, tags: activityTags } = useFatigueContext();

  // ── 換算ツール ──
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const minutesRef = useRef<TextInput>(null);
  const totalInputMinutes = (parseInt(inputHours || '0') * 60) + parseInt(inputMinutes || '0');
  const convertedMinutes = Math.round(totalInputMinutes * conversionRatio);
  const convertedH = Math.floor(convertedMinutes / 60);
  const convertedM = convertedMinutes % 60;
  const hasInput = totalInputMinutes > 0;
  const convertedResult = convertedH > 0 ? `${convertedH}時間${convertedM}分` : `${convertedM}分`;

  const handleClearConversion = () => {
    Keyboard.dismiss();
    setInputHours('');
    setInputMinutes('');
  };

  // ── 分析 ──
  const [exporting, setExporting] = useState(false);
  const points = useMemo(
    () => buildQuadrantPoints(sessions, subjectiveEntries, reactionResults),
    [sessions, subjectiveEntries, reactionResults]
  );
  const hasExportData = sessions.length > 0 || activityEntries.length > 0;

  const buildBundle = (): ExportBundle => ({
    sessions,
    subjectiveEntries,
    reactionResults,
    activityEntries,
    activityTags,
  });

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const bundle = buildBundle();
      const sessionsCsv = buildSessionsCsv(bundle);
      const activityCsv = buildActivityCsv(bundle);
      const combined = `# sessions\n${sessionsCsv}\n\n# activities\n${activityCsv}\n`;
      await saveAndShare(`study_log_${todayKey()}.csv`, combined, 'text/csv');
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
      await saveAndShare(`study_log_${todayKey()}.json`, json, 'application/json');
    } catch {
      Alert.alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('ログアウトしますか？', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleGoToLogin = async () => {
    await exitGuest();
    router.replace('/login');
  };

  const handleDeleteData = () => {
    Alert.alert(
      'データを削除しますか？',
      '学習記録がすべて消えます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: resetAll },
      ]
    );
  };

  const cardStyle = [styles.card, { backgroundColor: isDark ? '#1A251C' : '#FFFFFF' }];
  const dividerColor = isDark ? '#2A3B2D' : '#F0F0F0';
  const mutedColor = isDark ? '#9E9E9E' : '#AAAAAA';

  const inputStyle = [
    styles.numberInput,
    {
      color: isDark ? '#ECEDEE' : '#2D2D2D',
      backgroundColor: isDark ? '#243028' : '#F4F6F4',
    },
  ];

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.screenTitle}>設定</ThemedText>

          {/* ── アカウント ── */}
          <SectionHeader title="アカウント" color={mutedColor} />
          {isGuest ? (
            <View style={cardStyle}>
              <ThemedText style={[styles.rowLabel, { marginBottom: 8 }]}>
                ゲストモードで利用中です。ログイン・アカウント作成をすると、記録を他の端末とも同期できます。
              </ThemedText>
              <TouchableOpacity style={styles.listRow} onPress={handleGoToLogin} activeOpacity={0.7}>
                <Text style={[styles.listLabel, { color: AppColors.accent, fontWeight: '600' }]}>
                  ログイン / アカウント作成
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={cardStyle}>
              <View style={styles.listRow}>
                <ThemedText style={styles.listLabel}>メールアドレス</ThemedText>
                <Text style={[styles.listValue, { color: mutedColor }]}>{user?.email ?? '-'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: dividerColor }]} />
              <TouchableOpacity style={styles.listRow} onPress={handleSignOut} activeOpacity={0.7}>
                <Text style={styles.destructiveText}>ログアウト</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 外観 ── */}
          <SectionHeader title="外観" color={mutedColor} />
          <View style={cardStyle}>
            <ThemedText style={styles.rowLabel}>テーマ</ThemedText>
            <View style={[styles.themeToggle, { backgroundColor: isDark ? '#243028' : '#F0F0F0' }]}>
              {THEME_OPTIONS.map(({ mode, label }) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeBtn,
                    themeMode === mode && { backgroundColor: AppColors.accent },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.themeBtnText,
                    { color: themeMode === mode ? '#FFFFFF' : mutedColor },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── 換算比率 ── */}
          <SectionHeader title="換算比率" color={mutedColor} />
          <View style={cardStyle}>
            <View style={styles.ratioRow}>
              <TouchableOpacity
                style={[styles.ratioBtn, { borderColor: workHoursPerStudy <= 1 ? '#D0D0D0' : AppColors.accent }]}
                onPress={() => setWorkHoursPerStudy(Math.max(1, workHoursPerStudy - 1))}
                disabled={workHoursPerStudy <= 1}
                activeOpacity={0.7}
              >
                <Text style={[styles.ratioBtnText, { color: workHoursPerStudy <= 1 ? '#D0D0D0' : AppColors.accent }]}>−</Text>
              </TouchableOpacity>

              <View style={styles.ratioValueBox}>
                <ThemedText style={styles.ratioValue}>{workHoursPerStudy}</ThemedText>
                <ThemedText style={styles.ratioUnit}>時間</ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.ratioBtn, { borderColor: workHoursPerStudy >= 24 ? '#D0D0D0' : AppColors.accent }]}
                onPress={() => setWorkHoursPerStudy(Math.min(24, workHoursPerStudy + 1))}
                disabled={workHoursPerStudy >= 24}
                activeOpacity={0.7}
              >
                <Text style={[styles.ratioBtnText, { color: workHoursPerStudy >= 24 ? '#D0D0D0' : AppColors.accent }]}>＋</Text>
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.ratioDesc}>
              {workHoursPerStudy}時間の勤務・授業 → 1時間の学習として換算
            </ThemedText>
          </View>

          {/* ── 換算ツール ── */}
          <SectionHeader title="換算ツール" color={mutedColor} />
          <View style={cardStyle}>
            <ThemedText style={[styles.rowLabel, { marginBottom: 8 }]}>
              勤務・授業時間を入力すると学習換算時間の目安を確認できます
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                style={inputStyle}
                value={inputHours}
                onChangeText={setInputHours}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor="#9E9E9E"
                returnKeyType="next"
                onSubmitEditing={() => minutesRef.current?.focus()}
                blurOnSubmit={false}
              />
              <ThemedText style={styles.inputUnit}>時間</ThemedText>
              <TextInput
                ref={minutesRef}
                style={inputStyle}
                value={inputMinutes}
                onChangeText={setInputMinutes}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor="#9E9E9E"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <ThemedText style={styles.inputUnit}>分</ThemedText>
            </View>

            {hasInput && (
              <View style={[styles.resultBox, { backgroundColor: isDark ? '#243028' : '#F4F6F4' }]}>
                <ThemedText style={styles.resultLabel}>学習換算</ThemedText>
                <ThemedText style={[styles.resultValue, { color: AppColors.accent }]}>{convertedResult}</ThemedText>
              </View>
            )}

            <TouchableOpacity
              style={[styles.clearBtn, !hasInput && styles.clearBtnDisabled]}
              onPress={handleClearConversion}
              disabled={!hasInput}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearBtnText, { color: !hasInput ? '#D0D0D0' : AppColors.accent }]}>クリア</Text>
            </TouchableOpacity>
          </View>

          {/* ── 分析 ── */}
          <SectionHeader title="分析" color={mutedColor} />
          {points.length === 0 ? (
            <View style={cardStyle}>
              <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
                学習前後に主観スコアと反応速度テストの両方を記録すると、ここに分析結果が表示されます。
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={[cardStyle, styles.analysisCard]}>
                <ThemedText style={styles.cardTitle}>4象限マトリクス</ThemedText>
                <QuadrantChart points={points} />
              </View>

              <View style={[cardStyle, styles.analysisCard]}>
                <ThemedText style={styles.cardTitle}>時系列推移</ThemedText>
                <TimeSeriesChart points={points} />
              </View>
            </>
          )}

          <View style={[cardStyle, styles.analysisCard]}>
            <ThemedText style={styles.cardTitle}>データエクスポート</ThemedText>
            <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
              学習ログ・活動ログ・主観スコア・反応時間の記録をまとめて書き出します。
            </ThemedText>
            <View style={styles.exportRow}>
              <TouchableOpacity
                style={[styles.exportBtn, { borderColor: AppColors.accent }, (!hasExportData || exporting) && styles.exportBtnDisabled]}
                onPress={handleExportCsv}
                disabled={!hasExportData || exporting}
                activeOpacity={0.7}
              >
                <Text style={[styles.exportBtnText, { color: AppColors.accent }]}>CSVエクスポート</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportBtn, { borderColor: AppColors.accent }, (!hasExportData || exporting) && styles.exportBtnDisabled]}
                onPress={handleExportJson}
                disabled={!hasExportData || exporting}
                activeOpacity={0.7}
              >
                <Text style={[styles.exportBtnText, { color: AppColors.accent }]}>JSONエクスポート</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── データ管理 ── */}
          <SectionHeader title="データ管理" color={mutedColor} />
          <View style={cardStyle}>
            <TouchableOpacity style={styles.listRow} onPress={handleDeleteData} activeOpacity={0.7}>
              <Text style={styles.destructiveText}>全データを削除する</Text>
            </TouchableOpacity>
          </View>

          {/* ── アプリについて ── */}
          <SectionHeader title="アプリについて" color={mutedColor} />
          <View style={cardStyle}>
            <View style={styles.listRow}>
              <ThemedText style={styles.listLabel}>バージョン</ThemedText>
              <Text style={[styles.listValue, { color: mutedColor }]}>{APP_VERSION}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <LinkRow label="SNS（Twitter / X）" url="https://x.com/" isDark={isDark} />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <LinkRow label="利用規約" url="https://example.com/terms" isDark={isDark} />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <LinkRow label="プライバシーポリシー" url="https://example.com/privacy" isDark={isDark} />
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return <Text style={[styles.sectionHeader, { color }]}>{title}</Text>;
}

function LinkRow({ label, url, isDark }: { label: string; url: string; isDark: boolean }) {
  return (
    <TouchableOpacity style={styles.listRow} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
      <ThemedText style={styles.listLabel}>{label}</ThemedText>
      <Text style={{ fontSize: 20, color: isDark ? '#6E8870' : '#CCCCCC' }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  screenTitle: { marginBottom: 4 },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 6,
    textTransform: 'uppercase',
  },
  // テーマ
  rowLabel: { fontSize: 15, marginBottom: 12 },
  themeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  themeBtnText: { fontSize: 13, fontWeight: '500' },
  // 換算比率
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  ratioBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  ratioBtnText: { fontSize: 24, lineHeight: 28 },
  ratioValueBox: { alignItems: 'center', minWidth: 72 },
  ratioValue: { fontSize: 40, fontWeight: '700', lineHeight: 48 },
  ratioUnit: { fontSize: 13, color: '#9E9E9E' },
  ratioDesc: { textAlign: 'center', fontSize: 13, color: '#9E9E9E', marginTop: 8, paddingBottom: 4 },
  // 換算ツール
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    width: 64,
    height: 48,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
  },
  inputUnit: {
    fontSize: 16,
    marginRight: 8,
  },
  resultBox: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    gap: 2,
  },
  resultLabel: { fontSize: 12, color: '#9E9E9E' },
  resultValue: { fontSize: 22, fontWeight: '700' },
  clearBtn: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearBtnDisabled: { opacity: 0.5 },
  clearBtnText: { fontSize: 13, fontWeight: '600' },
  // 分析
  analysisCard: { gap: 10, alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', alignSelf: 'flex-start' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
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
  // リスト行
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  listLabel: { fontSize: 15 },
  listValue: { fontSize: 15 },
  divider: { height: 1 },
  destructiveText: { fontSize: 15, color: '#EF5B5B' },
  bottomPad: { height: 32 },
});
