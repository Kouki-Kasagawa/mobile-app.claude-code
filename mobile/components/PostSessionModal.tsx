import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ReactionTestResult, ReactionTimeTest } from '@/components/ReactionTimeTest';
import { ScorePicker } from '@/components/ScorePicker';
import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface PostSessionInput {
  subjectiveScore?: number;
  subjectiveNote?: string;
  reaction?: ReactionTestResult;
}

export function PostSessionModal({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: (input: PostSessionInput) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [reaction, setReaction] = useState<ReactionTestResult | undefined>(undefined);
  const [testVisible, setTestVisible] = useState(false);

  const sheetBg = isDark ? '#1E2E22' : '#F7F7F7';
  const mutedColor = isDark ? '#9E9E9E' : '#AAAAAA';
  const textColor = isDark ? '#ECEDEE' : '#11181C';

  const reset = () => {
    setScore(null);
    setNote('');
    setReaction(undefined);
  };

  const handleDone = () => {
    onDone({
      subjectiveScore: score ?? undefined,
      subjectiveNote: note.trim() || undefined,
      reaction,
    });
    reset();
  };

  const handleSkipAll = () => {
    onDone({});
    reset();
  };

  // 背景・戻るボタンでは何もしない。以前は「スキップして終了」と同じ動きで、
  // 確認なしで学習が終了・保存されていた（#3）。終了は下のボタンからだけにする
  const ignoreClose = () => {};

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={ignoreClose}>
        <View style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.title}>学習後チェック</ThemedText>
              <TouchableOpacity onPress={handleSkipAll} hitSlop={12}>
                <Text style={[styles.skipAllText, { color: mutedColor }]}>スキップして終了</Text>
              </TouchableOpacity>
            </View>

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
              <Text style={styles.doneBtnText}>記録して終了</Text>
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
