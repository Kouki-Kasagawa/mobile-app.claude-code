import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import type { FatigueLevel } from '@/types/fatigue';

const BLUR_INTENSITY: Record<FatigueLevel, number> = {
  ok: 0,
  caution: 0,
  danger: 55,
};

interface Props {
  level: FatigueLevel;
  children: ReactNode;
  /** ぼかしを有効にするか（level に加えて制御したい場合） */
  enabled?: boolean;
}

/**
 * 疲労レベルに応じてコンテンツにぼかしを適用するオーバーレイ。
 *
 * React Native では Web の `filter: blur()` が使えないため、
 * expo-blur の BlurView を absolute overlay として重ね、
 * さらに彩度を落とす半透明グレーレイヤーを組み合わせる。
 */
export function BlurOverlay({ level, children, enabled = true }: Props) {
  const colorScheme = useColorScheme();
  const intensity = BLUR_INTENSITY[level];
  const isBlurred = enabled && intensity > 0;

  return (
    <View style={styles.wrapper}>
      {/* コンテンツ本体: ぼかし時に彩度を下げる（グレーオーバーレイで表現） */}
      <View style={[styles.content, isBlurred && styles.contentBlurred]}>
        {children}
      </View>

      {isBlurred && (
        <>
          {/* グレースケール効果: 半透明グレーオーバーレイ */}
          <View
            style={[StyleSheet.absoluteFill, styles.grayLayer]}
            pointerEvents="none"
          />
          {/* expo-blur によるぼかし */}
          <BlurView
            style={StyleSheet.absoluteFill}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            intensity={intensity}
            pointerEvents="none"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  content: {},
  contentBlurred: {
    opacity: 0.45,
  },
  grayLayer: {
    backgroundColor: 'rgba(140, 140, 140, 0.35)',
    borderRadius: 16,
  },
});
