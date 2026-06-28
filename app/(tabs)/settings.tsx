import Constants from 'expo-constants';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { ThemeMode, useSettings } from '@/context/SettingsContext';
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'ライト' },
  { mode: 'system', label: 'システム' },
  { mode: 'dark', label: 'ダーク' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themeMode, setThemeMode, workHoursPerStudy, setWorkHoursPerStudy } = useSettings();
  const { resetAll } = useTime();

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

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.screenTitle}>設定</ThemedText>

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
