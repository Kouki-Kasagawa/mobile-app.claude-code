import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline, Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QuadrantPoint, normalizeObjective, normalizeSubjective } from '@/utils/quadrant';

const WIDTH = 300;
const HEIGHT = 180;
const PADDING = 20;
const DIVERGENCE_THRESHOLD = 30; // 正規化スケール(0-100)上での乖離幅

export function TimeSeriesChart({ points }: { points: QuadrantPoint[] }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const gridColor = isDark ? '#2A3B2D' : '#EEEEEE';
  const mutedColor = isDark ? '#9E9E9E' : '#AAAAAA';

  if (points.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <ThemedText style={{ color: mutedColor }}>まだデータがありません</ThemedText>
      </View>
    );
  }

  const plotW = WIDTH - PADDING * 2;
  const plotH = HEIGHT - PADDING * 2;
  const n = points.length;
  const xStep = n > 1 ? plotW / (n - 1) : 0;

  const subjXY = points.map((p, i) => ({
    x: PADDING + i * xStep,
    y: PADDING + plotH - (normalizeSubjective(p.subjectiveScore) / 100) * plotH,
  }));
  const objXY = points.map((p, i) => ({
    x: PADDING + i * xStep,
    y: PADDING + plotH - (normalizeObjective(p.objectiveMs) / 100) * plotH,
  }));

  const subjLine = subjXY.map(pt => `${pt.x},${pt.y}`).join(' ');
  const objLine = objXY.map(pt => `${pt.x},${pt.y}`).join(' ');

  return (
    <View style={styles.wrap}>
      <Svg width={WIDTH} height={HEIGHT}>
        <Rect x={PADDING} y={PADDING} width={plotW} height={plotH} fill="none" stroke={gridColor} strokeWidth={1} />

        {points.map((p, i) => {
          const divergence = Math.abs(normalizeSubjective(p.subjectiveScore) - normalizeObjective(p.objectiveMs));
          if (divergence < DIVERGENCE_THRESHOLD) return null;
          const x = PADDING + i * xStep;
          const bandWidth = n > 1 ? xStep : plotW;
          return (
            <Rect
              key={`hl-${p.id}`}
              x={Math.max(PADDING, x - bandWidth / 2)}
              y={PADDING}
              width={bandWidth}
              height={plotH}
              fill={AppColors.warning}
              opacity={0.14}
            />
          );
        })}

        {n > 1 && <Polyline points={subjLine} fill="none" stroke="#EF5B5B" strokeWidth={2} />}
        {n > 1 && <Polyline points={objLine} fill="none" stroke="#5B8DEF" strokeWidth={2} />}

        {subjXY.map((pt, i) => (
          <Circle key={`s-${points[i].id}`} cx={pt.x} cy={pt.y} r={3} fill="#EF5B5B" />
        ))}
        {objXY.map((pt, i) => (
          <Circle key={`o-${points[i].id}`} cx={pt.x} cy={pt.y} r={3} fill="#5B8DEF" />
        ))}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF5B5B' }]} />
          <ThemedText style={[styles.legendLabel, { color: mutedColor }]}>主観的疲労</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#5B8DEF' }]} />
          <ThemedText style={[styles.legendLabel, { color: mutedColor }]}>客観的疲労（反応時間）</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppColors.warning }]} />
          <ThemedText style={[styles.legendLabel, { color: mutedColor }]}>乖離が大きい区間</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  legend: { width: '100%', gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11 },
});
