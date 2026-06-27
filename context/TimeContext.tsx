import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'timeLogData';

type SavedData = {
  totalMinutes: number;
  todayMinutes: number;
  savedDate: string;
};

type TimeContextType = {
  totalMinutes: number;
  todayMinutes: number;
  addMinutes: (minutes: number) => void;
};

const TimeContext = createContext<TimeContextType>({
  totalMinutes: 0,
  todayMinutes: 0,
  addMinutes: () => {},
});

function todayString(): string {
  return new Date().toISOString().slice(0, 10); // "2026-06-28"
}

export function TimeProvider({ children }: { children: ReactNode }) {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // 起動時に1回だけデータを読み込む
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: SavedData = JSON.parse(raw);
          setTotalMinutes(data.totalMinutes);
          // 日付が変わっていたら今日の分はリセット
          setTodayMinutes(data.savedDate === todayString() ? data.todayMinutes : 0);
        }
      } catch {
        // 読み込み失敗時はデフォルト値（0）のまま
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // totalMinutes か todayMinutes が変わるたびに保存
  useEffect(() => {
    if (!loaded) return; // 読み込み完了前は保存しない
    const data: SavedData = {
      totalMinutes,
      todayMinutes,
      savedDate: todayString(),
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [totalMinutes, todayMinutes, loaded]);

  const addMinutes = (minutes: number) => {
    if (minutes <= 0) return;
    setTotalMinutes(prev => prev + minutes);
    setTodayMinutes(prev => prev + minutes);
  };

  return (
    <TimeContext.Provider value={{ totalMinutes, todayMinutes, addMinutes }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  return useContext(TimeContext);
}
