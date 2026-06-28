import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { history } = useTime();
  const { width: screenWidth } = useWindowDimensions();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

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
              const minutes = history[dateKey(year, month, day)] ?? 0;
              const bg = studyColor(minutes, isDark);
              const fg = textColor(minutes, isDark);
              const todayBorder = isToday(day);
              return (
                <View
                  key={day}
                  style={[
                    styles.dayCell,
                    {
                      width: cellSize,
                      height: cellSize + 8,
                      backgroundColor: bg,
                    },
                    todayBorder && { borderWidth: 2, borderColor: AppColors.accent },
                  ]}
                >
                  <Text style={[styles.dayNumber, { color: fg }]}>{day}</Text>
                  {minutes > 0 && (
                    <Text style={[styles.dayMins, { color: fg }]}>{minutes}分</Text>
                  )}
                </View>
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
        </View>
      </SafeAreaView>
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
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  dayMins: {
    fontSize: 8,
    fontWeight: '500',
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
    justifyContent: 'center',
    gap: 12,
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
});
