import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  OBJECTIVE_THRESHOLD_MS,
  QUADRANT_META,
  QuadrantLabel,
  QuadrantPoint,
  normalizeObjective,
  normalizeSubjective,
  SUBJECTIVE_THRESHOLD,
} from '@/utils/quadrant';

const SIZE = 260;
const PADDING = 24;

export function QuadrantChart({ points }: { points: QuadrantPoint[] }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const plotSize = SIZE - PADDING * 2;

  const xThreshold = PADDING + (normalizeObjective(OBJECTIVE_THRESHOLD_MS) / 100) * plotSize;
  const yThresholdNorm = normalizeSubjective(SUBJECTIVE_THRESHOLD);
  const yThreshold = PADDING + plotSize - (yThresholdNorm / 100) * plotSize;

  const gridColor = isDark ? '#2A3B2D' : '#EEEEEE';
  const axisColor = isDark ? '#9E9E9E' : '#AAAAAA';

  const latest = points[points.length - 1];

  return (
    <View style={styles.wrap}>
      <ThemedText style={[styles.axisLabelTop, { color: axisColor }]}>↑ 主観的疲労</ThemedText>
      <Svg width={SIZE} height={SIZE}>
        <Rect
          x={PADDING}
          y={PADDING}
          width={xThreshold - PADDING}
          height={yThreshold - PADDING}
          fill={QUADRANT_META.eustress.color}
          opacity={0.1}
        />
        <Rect
          x={xThreshold}
          y={PADDING}
          width={PADDING + plotSize - xThreshold}
          height={yThreshold - PADDING}
          fill={QUADRANT_META.distress.color}
          opacity={0.1}
        />
        <Rect
          x={PADDING}
          y={yThreshold}
          width={xThreshold - PADDING}
          height={PADDING + plotSize - yThreshold}
          fill={QUADRANT_META.stable.color}
          opacity={0.1}
        />
        <Rect
          x={xThreshold}
          y={yThreshold}
          width={PADDING + plotSize - xThreshold}
          height={PADDING + plotSize - yThreshold}
          fill={QUADRANT_META.tension.color}
          opacity={0.1}
        />

        <Rect x={PADDING} y={PADDING} width={plotSize} height={plotSize} fill="none" stroke={gridColor} strokeWidth={1} />
        <Line x1={xThreshold} y1={PADDING} x2={xThreshold} y2={PADDING + plotSize} stroke={gridColor} strokeWidth={1} strokeDasharray="4,4" />
        <Line x1={PADDING} y1={yThreshold} x2={PADDING + plotSize} y2={yThreshold} stroke={gridColor} strokeWidth={1} strokeDasharray="4,4" />

        {points.map(p => {
          const cx = PADDING + (normalizeObjective(p.objectiveMs) / 100) * plotSize;
          const cy = PADDING + plotSize - (normalizeSubjective(p.subjectiveScore) / 100) * plotSize;
          const isLatest = p.id === latest?.id;
          return (
            <Circle
              key={p.id}
              cx={cx}
              cy={cy}
              r={isLatest ? 7 : 5}
              fill={QUADRANT_META[p.quadrant].color}
              opacity={isLatest ? 1 : 0.55}
              stroke={isLatest ? (isDark ? '#FFFFFF' : '#333333') : 'none'}
              strokeWidth={isLatest ? 1.5 : 0}
            />
          );
        })}
      </Svg>
      <ThemedText style={[styles.axisLabelBottom, { color: axisColor }]}>客観的疲労（反応時間）→</ThemedText>

      {latest && (
        <ThemedText style={[styles.latestText, { color: QUADRANT_META[latest.quadrant].color }]}>
          直近: {QUADRANT_META[latest.quadrant].label}
        </ThemedText>
      )}

      <View style={styles.legend}>
        {(Object.keys(QUADRANT_META) as QuadrantLabel[]).map(key => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: QUADRANT_META[key].color }]} />
            <ThemedText style={[styles.legendLabel, { color: axisColor }]}>{QUADRANT_META[key].label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  axisLabelTop: { fontSize: 11, alignSelf: 'flex-start', marginLeft: PADDING },
  axisLabelBottom: { fontSize: 11 },
  latestText: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  legend: {
    width: '100%',
    marginTop: 6,
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, flexShrink: 1 },
});
