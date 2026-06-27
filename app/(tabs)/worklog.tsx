import { useState } from 'react';
import {
  Alert,
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
import { useTime } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 7時間の勤務・授業 → 1時間の学習として換算
const CONVERSION_RATIO = 1 / 7;

export default function WorklogScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { addMinutes } = useTime();
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');

  const totalInputMinutes =
    (parseInt(inputHours || '0') * 60) + parseInt(inputMinutes || '0');
  const convertedMinutes = Math.round(totalInputMinutes * CONVERSION_RATIO);
  const convertedHours = Math.floor(convertedMinutes / 60);
  const convertedMins = convertedMinutes % 60;
  const hasInput = totalInputMinutes > 0;

  const handleAdd = () => {
    addMinutes(convertedMinutes);
    Alert.alert(
      '記録しました',
      `${convertedMinutes}分を学習時間に追加しました`,
      [{ text: 'OK', onPress: () => { setInputHours(''); setInputMinutes(''); } }]
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
            今日の勤務・授業時間を入力すると{'\n'}学習時間として換算して追加します
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
              />
              <ThemedText style={styles.inputUnit}>時間</ThemedText>
              <TextInput
                style={inputStyle}
                value={inputMinutes}
                onChangeText={setInputMinutes}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor="#9E9E9E"
              />
              <ThemedText style={styles.inputUnit}>分</ThemedText>
            </View>
          </ThemedView>

          <View style={[
            styles.resultCard,
            { backgroundColor: hasInput
                ? (isDark ? AppColors.accentDeep : AppColors.accentLight)
                : (isDark ? '#1A251C' : '#F7F7F7') },
          ]}>
            <Text style={[styles.resultLabel, { color: hasInput ? AppColors.accentDark : '#9E9E9E' }]}>
              換算後の学習時間
            </Text>
            <View style={styles.resultValueRow}>
              {convertedHours > 0 && (
                <>
                  <Text style={[styles.resultValueBig, { color: hasInput ? AppColors.accentDark : '#BBBBBB' }]}>
                    {convertedHours}
                  </Text>
                  <Text style={[styles.resultUnit, { color: hasInput ? AppColors.accentDark : '#9E9E9E' }]}>
                    時間
                  </Text>
                </>
              )}
              <Text style={[styles.resultValueBig, { color: hasInput ? AppColors.accentDark : '#BBBBBB' }]}>
                {convertedMins}
              </Text>
              <Text style={[styles.resultUnit, { color: hasInput ? AppColors.accentDark : '#9E9E9E' }]}>
                分
              </Text>
            </View>
            <Text style={styles.resultNote}>7時間 → 1時間換算</Text>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, !hasInput && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!hasInput}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>記録に追加</Text>
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
  resultCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 4,
    alignItems: 'flex-start',
  },
  resultLabel: {
    fontSize: 13,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  resultValueBig: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
  resultUnit: {
    fontSize: 16,
    marginRight: 4,
  },
  resultNote: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
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
