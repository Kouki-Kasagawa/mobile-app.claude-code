import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { FatigueProvider } from '@/context/FatigueContext';
import { TimeProvider } from '@/context/TimeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <TimeProvider>
      <FatigueProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            tabBarButton: HapticTab,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'ホーム',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="timer"
            options={{
              title: 'タイマー',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="timer" color={color} />,
            }}
          />
          <Tabs.Screen
            name="worklog"
            options={{
              title: '換算',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: 'カレンダー',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
            }}
          />
          <Tabs.Screen
            name="fatigue"
            options={{
              title: '疲労',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="bolt.heart.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: '設定',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
            }}
          />
        </Tabs>
      </FatigueProvider>
    </TimeProvider>
  );
}
