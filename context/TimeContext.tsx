import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'timeLogData';

type SavedData = {
  totalMinutes: number;
  history: Record<string, number>;
};

type TimeContextType = {
  totalMinutes: number;
  todayMinutes: number;
  history: Record<string, number>;
  addMinutes: (minutes: number) => void;
  resetAll: () => void;
};

const TimeContext = createContext<TimeContextType>({
  totalMinutes: 0,
  todayMinutes: 0,
  history: {},
  addMinutes: () => {},
  resetAll: () => {},
});

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TimeProvider({ children }: { children: ReactNode }) {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [history, setHistory] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  const todayMinutes = history[todayString()] ?? 0;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setTotalMinutes(data.totalMinutes ?? 0);

          if (data.history) {
            setHistory(data.history);
          } else if (data.savedDate && (data.todayMinutes ?? 0) > 0) {
            // 旧フォーマットからの移行
            setHistory({ [data.savedDate]: data.todayMinutes });
          }
        }
      } catch {
        // 読み込み失敗時はデフォルト値のまま
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data: SavedData = { totalMinutes, history };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [totalMinutes, history, loaded]);

  const addMinutes = (minutes: number) => {
    if (minutes <= 0) return;
    const today = todayString();
    setTotalMinutes(prev => prev + minutes);
    setHistory(prev => ({
      ...prev,
      [today]: (prev[today] ?? 0) + minutes,
    }));
  };

  const resetAll = () => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setTotalMinutes(0);
    setHistory({});
  };

  return (
    <TimeContext.Provider value={{ totalMinutes, todayMinutes, history, addMinutes, resetAll }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  return useContext(TimeContext);
}
