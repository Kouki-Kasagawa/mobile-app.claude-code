import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const SETTINGS_KEY = 'appSettings';

export type ThemeMode = 'light' | 'dark' | 'system';

type SettingsData = {
  themeMode: ThemeMode;
  workHoursPerStudy: number;
};

type SettingsContextType = {
  themeMode: ThemeMode;
  colorScheme: 'light' | 'dark';
  workHoursPerStudy: number;
  conversionRatio: number;
  setThemeMode: (mode: ThemeMode) => void;
  setWorkHoursPerStudy: (hours: number) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  themeMode: 'system',
  colorScheme: 'light',
  workHoursPerStudy: 7,
  conversionRatio: 1 / 7,
  setThemeMode: () => {},
  setWorkHoursPerStudy: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [workHoursPerStudy, setWorkHoursState] = useState(7);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const data: SettingsData = JSON.parse(raw);
          if (data.themeMode) setThemeModeState(data.themeMode);
          if (data.workHoursPerStudy) setWorkHoursState(data.workHoursPerStudy);
        }
      } catch {}
    })();
  }, []);

  const save = useCallback((data: SettingsData) => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data)).catch(() => {});
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    save({ themeMode: mode, workHoursPerStudy });
  };

  const setWorkHoursPerStudy = (hours: number) => {
    setWorkHoursState(hours);
    save({ themeMode, workHoursPerStudy: hours });
  };

  const colorScheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme ?? 'light') : themeMode;

  return (
    <SettingsContext.Provider value={{
      themeMode,
      colorScheme,
      workHoursPerStudy,
      conversionRatio: 1 / workHoursPerStudy,
      setThemeMode,
      setWorkHoursPerStudy,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
