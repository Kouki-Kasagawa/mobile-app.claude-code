import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ReactionTestResult, ReactionTimeTest } from '@/components/ReactionTimeTest';
import { ScorePicker } from '@/components/ScorePicker';
import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RewardAppraisal } from '@/types/studyLog';

export interface PreSessionInput {
  subject?: string;
  reward: RewardAppraisal | null;
  subjectiveScore?: number;
  subjectiveNote?: string;
  reaction?: ReactionTestResult;
}

export function PreSessionModal({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: (input: PreSessionInput) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [subject, setSubject] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [interest, setInterest] = useState<number | null>(null);
  const [importance, setImportance] = useState<number | null>(null);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineUrgency, setDeadlineUrgency] = useState<number | null>(null);
  const [reaction, setReaction] = useState<ReactionTestResult | undefined>(undefined);
  const [testVisible, setTestVisible] = useState(false);

  const sheetBg = isDark ? '#1E2E22' : '#F7F7F7';
  const mutedColor = isDark ? '#9E9E9E' : '#AAAAAA';
  const textColor = isDark ? '#ECEDEE' : '#11181C';

  const reset = () => {
    setSubject('');
    setScore(null);
    setNote('');
    setInterest(null);
    setImportance(null);
    setHasDeadline(false);
    setDeadlineUrgency(null);
    setReaction(undefined);
  };

  const buildReward = (): RewardAppraisal | null => {
    if (interest == null && importance == null && !hasDeadline) return null;
    return {
      // 未回答を3（ふつう）で埋めると、本当に3を選んだ回答と区別できなくなるため null のまま保存する
      interest: interest ?? null,
      importance: importance ?? null,
      hasDeadline,
      deadlineUrgency: hasDeadline ? deadlineUrgency ?? undefined : undefined,
    };
  };

  const handleDone = () => {
    onDone({
      subject: subject.trim() || undefined,
      reward: buildReward(),
      subjectiveScore: score ?? undefined,
      subjectiveNote: note.trim() || undefined,
      reaction,
    });
    reset();
  };

  const handleSkipAll = () => {
    onDone({ reward: null });
    reset();
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleSkipAll}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleSkipAll} />
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.title}>学習前チェック</ThemedText>
              <TouchableOpacity onPress={handleSkipAll} hitSlop={12}>
                <Text style={[styles.skipAllText, { color: mutedColor }]}>スキップして開始</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: textColor, borderColor: mutedColor }]}
              placeholder="科目・学習内容（任意）"
              placeholderTextColor={mutedColor}
              value={subject}
              onChangeText={setSubject}
            />

            <ThemedText style={[styles.sectionLabel, { color: mutedColor }]}>疲労度・やる気（任意）</ThemedText>
            <ScorePicker value={score} onChange={setScore} lowLabel="元気" highLabel="疲れた" />

            <TextInput
              style={[styles.noteInput, { color: textColor, borderColor: mutedColor }]}
              placeholder="自由記述（任意）"
              placeholderTextColor={mutedColor}
              value={note}
              onChangeText={setNote}
              multiline
            />

            <ThemedText style={[styles.sectionLabel, { color: mutedColor }]}>面白さ（任意）</ThemedText>
            <ScorePicker value={interest} onChange={setInterest} lowLabel="低い" highLabel="高い" />

            <ThemedText style={[styles.sectionLabel, { color: mutedColor }]}>重要度（任意）</ThemedText>
            <ScorePicker value={importance} onChange={setImportance} lowLabel="低い" highLabel="高い" />

            <View style={styles.deadlineRow}>
              <ThemedText style={styles.deadlineLabel}>締切がある</ThemedText>
              <Switch
                value={hasDeadline}
                onValueChange={setHasDeadline}
                trackColor={{ true: AppColors.accent, false: isDark ? '#333' : '#CCC' }}
              />
            </View>
            {hasDeadline && (
              <>
                <ThemedText style={[styles.sectionLabel, { color: mutedColor }]}>締切の切迫度</ThemedText>
                <ScorePicker value={deadlineUrgency} onChange={setDeadlineUrgency} lowLabel="余裕" highLabel="切迫" />
              </>
            )}

            <TouchableOpacity
              style={[styles.reactionBtn, { borderColor: AppColors.accent }]}
              onPress={() => setTestVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.reactionBtnText, { color: AppColors.accent }]}>
                {reaction
                  ? `計測済み ✓ 平均${reaction.avgReactionMs}ms（再計測）`
                  : '反応速度テストを行う（任意）'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: AppColors.accent }]}
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>記録して開始</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <ReactionTimeTest
        visible={testVisible}
        onComplete={result => setReaction(result)}
        onCancel={() => setTestVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '700' },
  skipAllText: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  deadlineLabel: { fontSize: 14, fontWeight: '500' },
  reactionBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  reactionBtnText: { fontSize: 14, fontWeight: '600' },
  doneBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
