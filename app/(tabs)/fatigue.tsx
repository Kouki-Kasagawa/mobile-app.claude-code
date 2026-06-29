import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlurOverlay } from '@/components/BlurOverlay';
import { FatigueBattery } from '@/components/FatigueBattery';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useFatigueContext } from '@/context/FatigueContext';
import { useFatigue } from '@/hooks/use-fatigue';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ScheduleTag } from '@/types/fatigue';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const DURATION_OPTIONS = [30, 60, 90, 120, 180];

const REST_MESSAGES = [
  'お疲れ様。今日は思いっきり休んでいい。',
  '休むことも、続けるための戦略だよ。',
  '今日休むのは「サボり」じゃなく、明日への投資。',
  '疲れを抱えたまま続けても積み上がらない。充電しよう。',
];

function getRandMessage() {
  return REST_MESSAGES[Math.floor(Math.random() * REST_MESSAGES.length)];
}

function scoreRing(score: number, threshold: number) {
  const pct = Math.min((score / (threshold * 1.5)) * 100, 100);
  return pct;
}

export default function FatigueScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { fatigueState, todayEntries, isRestDay, threshold, tags } = useFatigue();
  const { addEntry, removeEntry, markRestDay, unmarkRestDay, baseline, setBaseline } =
    useFatigueContext();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ScheduleTag | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [restMessage] = useState(getRandMessage);

  const cardBg = isDark ? '#1A251C' : '#FFFFFF';
  const mutedColor = isDark ? '#9E9E9E' : '#AAAAAA';
  const borderColor = isDark ? '#2A3B2D' : '#EEEEEE';

  const { level, scores, isOverThreshold, wasYesterdayHigh } = fatigueState;

  const handleAddEntry = () => {
    if (!selectedTag) return;
    addEntry({
      tagId: selectedTag.id,
      date: todayStr(),
      durationMinutes: selectedDuration,
      source: 'manual',
    });
    setShowAddModal(false);
    setSelectedTag(null);
    setSelectedDuration(60);
  };

  const handleMarkRest = () => {
    markRestDay(todayStr());
  };

  const handleUnmarkRest = () => {
    unmarkRestDay(todayStr());
  };

  const handleRemoveEntry = (id: string) => {
    Alert.alert('削除しますか？', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* ── ヘッダー ── */}
          <View style={styles.headerRow}>
            <ThemedText type="title">疲労チェック</ThemedText>
            <FatigueBattery level={level} score={scores.total} />
          </View>

          {/* ── お休みモード ── */}
          {isRestDay ? (
            <ThemedView
              lightColor={cardBg}
              darkColor={cardBg}
              style={[styles.card, styles.restCard]}
            >
              <Text style={styles.restEmoji}>🌿</Text>
              <ThemedText style={styles.restTitle}>今日はお休み中</ThemedText>
              <ThemedText style={[styles.restSub, { color: mutedColor }]}>
                ゆっくり充電しよう。明日また始めればいい。
              </ThemedText>
              <TouchableOpacity
                style={[styles.smallBtn, { borderColor: AppColors.accent }]}
                onPress={handleUnmarkRest}
                activeOpacity={0.7}
              >
                <Text style={[styles.smallBtnText, { color: AppColors.accent }]}>
                  やっぱり勉強する
                </Text>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <>
              {/* ── 疲労バーカード ── */}
              <ThemedView lightColor={cardBg} darkColor={cardBg} style={styles.card}>
                <View style={styles.scoreBars}>
                  <AxisBar
                    label="身体"
                    emoji="🏃"
                    value={scores.physical}
                    max={threshold}
                    color="#F5A623"
                    mutedColor={mutedColor}
                    borderColor={borderColor}
                  />
                  <AxisBar
                    label="認知"
                    emoji="🧠"
                    value={scores.cognitive}
                    max={threshold}
                    color="#5B8DEF"
                    mutedColor={mutedColor}
                    borderColor={borderColor}
                  />
                </View>

                {wasYesterdayHigh && !isOverThreshold && (
                  <View style={[styles.hintBox, { backgroundColor: isDark ? '#2A3B2D' : '#FFF8EC' }]}>
                    <ThemedText style={[styles.hintText, { color: AppColors.warning }]}>
                      昨日も疲れが溜まってたみたい。今日は無理せず軽めでOK。
                    </ThemedText>
                  </View>
                )}

                {isOverThreshold && (
                  <View style={[styles.hintBox, { backgroundColor: isDark ? '#3A1C1C' : '#FFF0F0' }]}>
                    <ThemedText style={[styles.hintText, { color: '#EF5B5B' }]}>
                      今日の疲労が限界に近いよ。無理しなくていい。
                    </ThemedText>
                  </View>
                )}
              </ThemedView>

              {/* ── 今日の予定・やることリスト ── */}
              <BlurOverlay level={level} enabled={isOverThreshold}>
                <ThemedView lightColor={cardBg} darkColor={cardBg} style={styles.card}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionTitle}>今日の予定・やること</ThemedText>
                    {!isOverThreshold && (
                      <TouchableOpacity
                        style={[styles.addChip, { backgroundColor: AppColors.accentLight }]}
                        onPress={() => setShowAddModal(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.addChipText, { color: AppColors.accentDark }]}>
                          ＋ 追加
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {todayEntries.length === 0 ? (
                    <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
                      まだ予定・やることを登録していません
                    </ThemedText>
                  ) : (
                    <View style={styles.entryList}>
                      {todayEntries.map(entry => {
                        const tag = tags.find(t => t.id === entry.tagId);
                        if (!tag) return null;
                        const hrs = entry.durationMinutes / 60;
                        const entryScore = tag.weight * hrs;
                        return (
                          <View
                            key={entry.id}
                            style={[styles.entryRow, { borderBottomColor: borderColor }]}
                          >
                            <Text style={styles.entryEmoji}>{tag.emoji}</Text>
                            <View style={styles.entryInfo}>
                              <ThemedText style={styles.entryName}>{tag.name}</ThemedText>
                              <ThemedText style={[styles.entrySub, { color: mutedColor }]}>
                                {entry.durationMinutes}分
                              </ThemedText>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleRemoveEntry(entry.id)}
                              hitSlop={12}
                            >
                              <Text style={[styles.deleteBtn, { color: mutedColor }]}>×</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </ThemedView>
              </BlurOverlay>

              {/* ── 疲労過多時: 休息を促す ── */}
              {isOverThreshold && (
                <View style={[styles.restPromptCard, { backgroundColor: isDark ? '#3A1C1C' : '#FFF5F5' }]}>
                  <Text style={styles.restPromptEmoji}>🪫</Text>
                  <ThemedText style={[styles.restPromptMessage, { color: isDark ? '#FFB3B3' : '#CC4444' }]}>
                    {restMessage}
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.restBtn, { backgroundColor: '#EF5B5B' }]}
                    onPress={handleMarkRest}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.restBtnText}>今日は休む ＆ 明日へ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addSmall}
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addSmallText, { color: mutedColor }]}>
                      予定を追加する
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── 通常時: ＋追加ボタン（エントリゼロ時） ── */}
              {!isOverThreshold && todayEntries.length === 0 && (
                <TouchableOpacity
                  style={[styles.addFullBtn, { backgroundColor: cardBg }]}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.addFullBtnText, { color: AppColors.accent }]}>
                    ＋ 今日の予定・やることを追加する
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── ベースライン設定 ── */}
          <ThemedView lightColor={cardBg} darkColor={cardBg} style={styles.card}>
            <TouchableOpacity
              style={styles.baselineHeader}
              onPress={() => setBaseline({ enabled: !baseline.enabled })}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.sectionTitle}>ベースライン設定</ThemedText>
              <Text style={[styles.baselineToggle, { color: baseline.enabled ? AppColors.accent : mutedColor }]}>
                {baseline.enabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
            {baseline.enabled && (
              <ThemedText style={[styles.baselineDesc, { color: mutedColor }]}>
                {baseline.weekdaysOnly ? '平日' : '毎日'} {baseline.startHour}:00〜{baseline.endHour}:00 の学校/仕事時間を自動加算中
              </ThemedText>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>

      {/* ── 追加モーダル ── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        />
        <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1E2E22' : '#F7F7F7' }]}>
          <View style={styles.modalHandle} />
          <ThemedText style={styles.modalTitle}>予定・やることを追加</ThemedText>

          {/* タグ選択 */}
          <ThemedText style={[styles.modalLabel, { color: mutedColor }]}>種類を選ぶ</ThemedText>
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

          {/* 時間選択 */}
          <ThemedText style={[styles.modalLabel, { color: mutedColor }]}>時間</ThemedText>
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

          {/* 追加ボタン */}
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
        </View>
      </Modal>
    </ThemedView>
  );
}

function AxisBar({
  label,
  emoji,
  value,
  max,
  color,
  mutedColor,
  borderColor,
}: {
  label: string;
  emoji: string;
  value: number;
  max: number;
  color: string;
  mutedColor: string;
  borderColor: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={axisStyles.row}>
      <Text style={axisStyles.emoji}>{emoji}</Text>
      <Text style={[axisStyles.label, { color: mutedColor }]}>{label}</Text>
      <View style={[axisStyles.track, { backgroundColor: borderColor }]}>
        <View style={[axisStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const axisStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 14 },
  label: { fontSize: 11, width: 28 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  scoreBars: {
    gap: 10,
  },
  hintBox: {
    borderRadius: 10,
    padding: 10,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
  },
  // エントリリスト
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  addChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  entryList: {
    gap: 0,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryEmoji: { fontSize: 22 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '500' },
  entrySub: { fontSize: 12 },
  deleteBtn: { fontSize: 20, lineHeight: 24 },
  // 休息促進カード
  restPromptCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  restPromptEmoji: { fontSize: 40 },
  restPromptMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  restBtn: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 28,
    marginTop: 4,
  },
  restBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addSmall: { paddingVertical: 4 },
  addSmallText: { fontSize: 13 },
  // 追加ボタン（エントリゼロ時）
  addFullBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addFullBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // お休みカード
  restCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  restEmoji: { fontSize: 48 },
  restTitle: { fontSize: 20, fontWeight: '700' },
  restSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  smallBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  smallBtnText: { fontSize: 14, fontWeight: '600' },
  // ベースライン
  baselineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  baselineToggle: { fontSize: 14, fontWeight: '700' },
  baselineDesc: { fontSize: 13, lineHeight: 18 },
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
