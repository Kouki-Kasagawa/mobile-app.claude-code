import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { FatigueLevel } from '@/types/fatigue';
import { scoreToBatteryFill } from '@/utils/fatigueCalc';

const LEVEL_COLORS: Record<FatigueLevel, string> = {
  ok: '#6BAE75',      // AppColors.accent
  caution: '#F5A623', // AppColors.warning
  danger: '#EF5B5B',
};

const LEVEL_LABELS: Record<FatigueLevel, string> = {
  ok: '良好',
  caution: '注意',
  danger: '要休息',
};

interface Props {
  level: FatigueLevel;
  score: number;
  size?: 'small' | 'large';
}

export function FatigueBattery({ level, score, size = 'large' }: Props) {
  const fill = scoreToBatteryFill(score);
  const color = LEVEL_COLORS[level];
  const isLarge = size === 'large';

  const bodyW = isLarge ? 72 : 44;
  const bodyH = isLarge ? 32 : 20;
  const nubW = isLarge ? 6 : 4;
  const nubH = isLarge ? 14 : 8;
  const padding = 3;

  return (
    <View style={styles.container}>
      <View style={[styles.body, { width: bodyW, height: bodyH, borderColor: color }]}>
        {/* 充電残量バー */}
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(fill * 100, 4)}%`,
              backgroundColor: color,
            },
          ]}
        />
        {/* 危険時の点滅は opacity animation で実装可能（v3では省略） */}
      </View>
      {/* バッテリーの突起 */}
      <View style={[styles.nub, { width: nubW, height: nubH, backgroundColor: color }]} />
      {isLarge && (
        <ThemedText style={[styles.label, { color }]}>{LEVEL_LABELS[level]}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  body: {
    borderRadius: 5,
    borderWidth: 2,
    padding: 3,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  nub: {
    borderRadius: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});
