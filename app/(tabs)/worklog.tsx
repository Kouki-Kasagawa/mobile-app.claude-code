import { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 7時間の勤務・授業 → 1時間の学習として換算
const CONVERSION_RATIO = 1 / 7;

export default function WorklogScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const minutesRef = useRef<TextInput>(null);

  const totalInputMinutes =
    (parseInt(inputHours || '0') * 60) + parseInt(inputMinutes || '0');
  const convertedMinutes = Math.round(totalInputMinutes * CONVERSION_RATIO);
  const convertedH = Math.floor(convertedMinutes / 60);
  const convertedM = convertedMinutes % 60;
  const hasInput = totalInputMinutes > 0;

  const handleConvert = () => {
    Keyboard.dismiss();
    const result = convertedH > 0
      ? `${convertedH}時間${convertedM}分`
      : `${convertedM}分`;
    Alert.alert(
      '換算結果',
      `学習換算：${result}\n（7時間勤務 → 1時間換算）`,
      [{ text: '閉じる', onPress: () => { setInputHours(''); setInputMinutes(''); } }]
    );
  };

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
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ThemedText type="title" style={styles.screenTitle}>勤務・授業の換算</ThemedText>
          <ThemedText style={styles.description}>
            勤務・授業時間を入力すると{'\n'}学習換算時間の目安を確認できます
          </ThemedText>

          <ThemedView lightColor="#FFFFFF" darkColor="#1A251C" style={styles.inputCard}>
            <ThemedText style={styles.inputLabel}>今日の時間</ThemedText>
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
          </ThemedView>

          <TouchableOpacity
            style={[styles.addBtn, !hasInput && styles.addBtnDisabled]}
            onPress={handleConvert}
            disabled={!hasInput}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>換算する</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  screenTitle: {
    marginBottom: 0,
  },
  description: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 13,
    color: '#9E9E9E',
  },
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
  addBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#D0D0D0',
  },
  addBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
