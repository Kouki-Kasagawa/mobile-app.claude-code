import { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useFatigueContext } from '@/context/FatigueContext';
import { useSettings } from '@/context/SettingsContext';
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { FatigueLevel, ScheduleTag } from '@/types/fatigue';
import { confirmAction } from '@/utils/dialog';
import { calcFatigueScore, getFatigueLevel } from '@/utils/fatigueCalc';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
const DURATION_OPTIONS = [30, 60, 90, 120, 180];

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateTitle(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const padding = (firstDow + 6) % 7; // 月曜始まりに変換
  const days: (number | null)[] = Array(padding).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function studyColor(minutes: number, isDark: boolean): string {
  if (minutes === 0) return isDark ? '#243028' : '#EEEEEE';
  if (minutes < 30)  return isDark ? '#2E5C35' : '#C8EBCB';
  if (minutes < 60)  return AppColors.accent;
  return AppColors.accentDark;
}

function textColor(minutes: number, isDark: boolean): string {
  if (minutes === 0) return isDark ? '#4A6650' : '#BBBBBB';
  return '#FFFFFF';
}

/**
 * 予定・やることの疲労負荷レベルに応じたセルの色。
 * 'ok' は特に目立たせず、通常の学習時間の色をそのまま使う。
 */
function scheduleCellColor(level: FatigueLevel, isDark: boolean): { bg: string; fg: string } | null {
  if (level === 'danger') {
    return { bg: isDark ? '#4A1F1F' : '#FFD6D6', fg: isDark ? '#FF8A8A' : '#B23B3B' };
  }
  if (level === 'caution') {
    return { bg: isDark ? '#3D3320' : '#FFE9C2', fg: isDark ? '#F5C36B' : '#8A6414' };
  }
  return null;
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { history } = useTime();
  const { entries, tags, baseline, threshold, addEntry, removeEntry } = useFatigueContext();
  const { workHoursPerStudy } = useSettings();
  const { width: screenWidth } = useWindowDimensions();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // ── 日別の予定・やること（ゲストも含め誰でも閲覧・追加できる） ──
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ScheduleTag | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);

  const tagsMap = useMemo(
    () => Object.fromEntries(tags.map(t => [t.id, t])),
    [tags]
  );

  // 日付ごとの予定・やること情報（アイコンと疲労負荷レベル）。
  // 疲労チェックタブと同じ calcFatigueScore を使い、その日の予定だけで
  // どれくらいの疲労値になるかを見て、色の出しわけに使う。
  const dayScheduleInfo = useMemo(() => {
    const map = new Map<string, { level: FatigueLevel; emojis: string[]; moreCount: number }>();
    const dates = new Set(entries.map(e => e.date));
    dates.forEach(dateStr => {
      const dayEntries = entries.filter(e => e.date === dateStr);
      if (dayEntries.length === 0) return;
      const score = calcFatigueScore(entries, tagsMap, dateStr, baseline, workHoursPerStudy);
      const level = getFatigueLevel(score.total, threshold);
      const uniqueTagIds = Array.from(new Set(dayEntries.map(e => e.tagId)));
      const emojis = uniqueTagIds.slice(0, 3).map(id => tagsMap[id]?.emoji ?? '').filter(Boolean);
      map.set(dateStr, { level, emojis, moreCount: Math.max(0, uniqueTagIds.length - 3) });
    });
    return map;
  }, [entries, tagsMap, baseline, workHoursPerStudy, threshold]);

  const selectedDateEntries = useMemo(
    () => (selectedDateKey ? entries.filter(e => e.date === selectedDateKey) : []),
    [entries, selectedDateKey]
  );

  const closeDayModal = () => {
    setSelectedDateKey(null);
    setShowAddForm(false);
    setSelectedTag(null);
    setSelectedDuration(60);
  };

  const handleAddEntry = () => {
    if (!selectedTag || !selectedDateKey) return;
    addEntry({
      tagId: selectedTag.id,
      date: selectedDateKey,
      durationMinutes: selectedDuration,
      source: 'manual',
    });
    setShowAddForm(false);
    setSelectedTag(null);
    setSelectedDuration(60);
  };

  const handleRemoveEntry = (id: string) => {
    confirmAction({ title: '削除しますか？', confirmText: '削除', onConfirm: () => removeEntry(id) });
  };

  const today = now;
  const isToday = (d: number) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const calendarDays = getCalendarDays(year, month);

  // 画面幅から1セルのサイズを計算（左右padding 16*2 + カード内padding 16*2）
  const cellSize = Math.floor((screenWidth - 64) / 7);

  const goToPrevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // 今月の合計
  const monthlyMinutes = calendarDays.reduce<number>((sum, d) => {
    if (!d) return sum;
    return sum + (history[dateKey(year, month, d)] ?? 0);
  }, 0);
  const monthlyH = Math.floor(monthlyMinutes / 60);
  const monthlyM = monthlyMinutes % 60;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <ThemedText type="title" style={styles.screenTitle}>学習カレンダー</ThemedText>

        {/* カレンダーカード */}
        <ThemedView lightColor="#FFFFFF" darkColor="#1A251C" style={styles.card}>
          {/* 月ナビゲーション */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} hitSlop={12} style={styles.navBtn}>
              <Text style={[styles.navArrow, { color: AppColors.accent }]}>◀</Text>
            </TouchableOpacity>
            <ThemedText style={styles.monthTitle}>{year}年{month + 1}月</ThemedText>
            <TouchableOpacity onPress={goToNextMonth} hitSlop={12} style={styles.navBtn}>
              <Text style={[styles.navArrow, { color: AppColors.accent }]}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* 曜日ヘッダー */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map(wd => (
              <Text
                key={wd}
                style={[
                  styles.weekday,
                  { width: cellSize },
                  wd === '土' && { color: '#5B8DEF' },
                  wd === '日' && { color: '#EF5B5B' },
                ]}
              >
                {wd}
              </Text>
            ))}
          </View>

          {/* 日付グリッド */}
          <View style={styles.grid}>
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <View key={`e${idx}`} style={{ width: cellSize, height: cellSize + 8 }} />;
              }
              const key = dateKey(year, month, day);
              const minutes = history[key] ?? 0;
              const schedInfo = dayScheduleInfo.get(key);
              const schedColor = schedInfo ? scheduleCellColor(schedInfo.level, isDark) : null;
              const bg = schedColor?.bg ?? studyColor(minutes, isDark);
              const fg = schedColor?.fg ?? textColor(minutes, isDark);
              const todayBorder = isToday(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    {
                      width: cellSize - 2,
                      height: cellSize + 6,
                      backgroundColor: bg,
                    },
                    todayBorder && { borderWidth: 2, borderColor: AppColors.accent },
                  ]}
                  onPress={() => setSelectedDateKey(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayNumber, { color: fg }]}>{day}</Text>
                  {minutes > 0 && (
                    <Text style={[styles.dayMins, { color: fg }]}>{minutes}分</Text>
                  )}
                  {schedInfo && (
                    <View style={styles.tagIconRow}>
                      {schedInfo.emojis.map((emoji, i) => (
                        <Text key={i} style={styles.tagIcon}>{emoji}</Text>
                      ))}
                      {schedInfo.moreCount > 0 && (
                        <Text style={[styles.tagIconMore, { color: fg }]}>+{schedInfo.moreCount}</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ThemedView>

        {/* 今月の合計 */}
        <ThemedView lightColor="#FFFFFF" darkColor="#1A251C" style={styles.totalCard}>
          <ThemedText style={styles.totalLabel}>{month + 1}月の合計学習時間</ThemedText>
          <View style={styles.totalRow}>
            {monthlyH > 0 && (
              <>
                <ThemedText style={styles.totalBig}>{monthlyH}</ThemedText>
                <ThemedText style={styles.totalUnit}>時間</ThemedText>
              </>
            )}
            <ThemedText style={styles.totalBig}>{monthlyM}</ThemedText>
            <ThemedText style={styles.totalUnit}>分</ThemedText>
          </View>
        </ThemedView>

        {/* 凡例 */}
        <View style={styles.legend}>
          {([
            ['0分', studyColor(0, isDark)],
            ['〜30分', studyColor(1, isDark)],
            ['〜60分', studyColor(30, isDark)],
            ['60分+', studyColor(60, isDark)],
          ] as [string, string][]).map(([label, color]) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendLabel, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>{label}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: scheduleCellColor('caution', isDark)!.bg },
              ]}
            />
            <Text style={[styles.legendLabel, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>予定多め</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: scheduleCellColor('danger', isDark)!.bg },
              ]}
            />
            <Text style={[styles.legendLabel, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>要注意</Text>
          </View>
        </View>

        <Text style={[styles.tapHint, { color: isDark ? '#6E8870' : '#AAAAAA' }]}>
          日付のアイコンはその日の予定・やること。タップすると見たり追加できます
        </Text>
      </SafeAreaView>

      {/* ── 日別 予定・やること モーダル ── */}
      <Modal
        visible={!!selectedDateKey}
        animationType="slide"
        transparent
        onRequestClose={closeDayModal}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeDayModal} />
        <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1E2E22' : '#F7F7F7' }]}>
          <View style={styles.modalHandle} />
          <ThemedText style={styles.modalTitle}>
            {selectedDateKey && formatDateTitle(selectedDateKey)} の予定・やること
          </ThemedText>

          <ScrollView contentContainerStyle={styles.dayEntryScroll}>
            {selectedDateEntries.length === 0 ? (
              <ThemedText style={[styles.emptyDayText, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>
                まだ予定・やることを登録していません
              </ThemedText>
            ) : (
              selectedDateEntries.map(entry => {
                const tag = tags.find(t => t.id === entry.tagId);
                if (!tag) return null;
                return (
                  <View
                    key={entry.id}
                    style={[styles.dayEntryRow, { borderBottomColor: isDark ? '#2A3B2D' : '#EEEEEE' }]}
                  >
                    <Text style={styles.dayEntryEmoji}>{tag.emoji}</Text>
                    <View style={styles.dayEntryInfo}>
                      <ThemedText style={styles.dayEntryName}>{tag.name}</ThemedText>
                      <ThemedText style={[styles.dayEntrySub, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>
                        {entry.durationMinutes}分
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveEntry(entry.id)} hitSlop={12}>
                      <Text style={[styles.dayEntryDelete, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          {!showAddForm ? (
            <TouchableOpacity
              style={[styles.addFullBtn, { backgroundColor: isDark ? '#243028' : '#EEEEEE' }]}
              onPress={() => setShowAddForm(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.addFullBtnText, { color: AppColors.accent }]}>
                ＋ 予定・やることを追加する
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <ThemedText style={[styles.modalLabel, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>
                種類を選ぶ
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagScroll}
              >
                {tags.map(tag => {
                  const isSelected = selectedTag?.id === tag.id;
                  const axisColor = tag.axis === 'physical' ? '#F5A623' : '#5B8DEF';
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: isSelected ? axisColor : (isDark ? '#243028' : '#EEEEEE'),
                          borderColor: isSelected ? axisColor : 'transparent',
                        },
                      ]}
                      onPress={() => setSelectedTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tagChipEmoji}>{tag.emoji}</Text>
                      <Text
                        style={[
                          styles.tagChipLabel,
                          { color: isSelected ? '#FFFFFF' : (isDark ? '#CCCCCC' : '#333333') },
                        ]}
                      >
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <ThemedText style={[styles.modalLabel, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>
                時間
              </ThemedText>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationChip,
                      {
                        backgroundColor:
                          selectedDuration === d
                            ? AppColors.accent
                            : (isDark ? '#243028' : '#EEEEEE'),
                      },
                    ]}
                    onPress={() => setSelectedDuration(d)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        { color: selectedDuration === d ? '#FFFFFF' : (isDark ? '#CCCCCC' : '#333333') },
                      ]}
                    >
                      {d}分
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.addConfirmBtn,
                  { backgroundColor: selectedTag ? AppColors.accent : (isDark ? '#333' : '#CCC') },
                ]}
                onPress={handleAddEntry}
                disabled={!selectedTag}
                activeOpacity={0.8}
              >
                <Text style={styles.addConfirmBtnText}>追加する</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  screenTitle: { marginBottom: 0 },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 15 },
  monthTitle: { fontSize: 17, fontWeight: '600' },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: '#9E9E9E',
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    borderRadius: 8,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  dayMins: {
    fontSize: 8,
    fontWeight: '500',
  },
  tagIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  tagIcon: {
    fontSize: 9,
    lineHeight: 11,
  },
  tagIconMore: {
    fontSize: 7,
    fontWeight: '700',
    marginLeft: 1,
  },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  totalLabel: { fontSize: 13, color: '#9E9E9E' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalBig: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
  totalUnit: { fontSize: 14, color: '#9E9E9E', marginRight: 4 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    rowGap: 6,
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: { fontSize: 10 },
  tapHint: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: -4,
  },
  // モーダル
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 12,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  dayEntryScroll: {
    gap: 0,
  },
  emptyDayText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  dayEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayEntryEmoji: { fontSize: 22 },
  dayEntryInfo: { flex: 1 },
  dayEntryName: { fontSize: 14, fontWeight: '500' },
  dayEntrySub: { fontSize: 12 },
  dayEntryDelete: { fontSize: 20, lineHeight: 24 },
  addFullBtn: {
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  addFullBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  tagChipEmoji: { fontSize: 16 },
  tagChipLabel: { fontSize: 13, fontWeight: '500' },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  durationChipText: { fontSize: 13, fontWeight: '500' },
  addConfirmBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  addConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
