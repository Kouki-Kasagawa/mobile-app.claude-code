import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ScorePicker({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map(n => {
          const selected = value === n;
          return (
            <TouchableOpacity
              key={n}
              style={[
                styles.chip,
                { backgroundColor: selected ? AppColors.accent : isDark ? '#243028' : '#EEEEEE' },
              ]}
              onPress={() => onChange(n)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? '#FFFFFF' : isDark ? '#CCCCCC' : '#333333' },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {(lowLabel || highLabel) && (
        <View style={styles.labelRow}>
          <Text style={[styles.hintLabel, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>
            {lowLabel ?? ''}
          </Text>
          <Text style={[styles.hintLabel, { color: isDark ? '#9E9E9E' : '#AAAAAA' }]}>
            {highLabel ?? ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 15, fontWeight: '700' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hintLabel: { fontSize: 11 },
});
