import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { BaselineConfig, ScheduleEntry, ScheduleTag } from '@/types/fatigue';
import { DEFAULT_TAGS } from '@/utils/scheduleTags';

const STORAGE_KEY = 'fatigueData_v3';

interface PersistedData {
  entries: ScheduleEntry[];
  tags: ScheduleTag[];
  baseline: BaselineConfig;
  threshold: number;
  restDays: string[];
  scoreHistory: Record<string, number>;
}

export interface FatigueContextType {
  entries: ScheduleEntry[];
  tags: ScheduleTag[];
  baseline: BaselineConfig;
  threshold: number;
  restDays: string[];
  /** 日付→疲労スコアの記録（前日比較用）*/
  scoreHistory: Record<string, number>;

  addEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  markRestDay: (dateStr: string) => void;
  unmarkRestDay: (dateStr: string) => void;
  setBaseline: (config: Partial<BaselineConfig>) => void;
  setThreshold: (value: number) => void;
  recordTodayScore: (score: number, dateStr: string) => void;
}

const DEFAULT_BASELINE: BaselineConfig = {
  enabled: true,
  startHour: 9,
  endHour: 17,
  weekdaysOnly: true,
};

const FatigueContext = createContext<FatigueContextType>({
  entries: [],
  tags: DEFAULT_TAGS,
  baseline: DEFAULT_BASELINE,
  threshold: 7,
  restDays: [],
  scoreHistory: {},
  addEntry: () => {},
  removeEntry: () => {},
  markRestDay: () => {},
  unmarkRestDay: () => {},
  setBaseline: () => {},
  setThreshold: () => {},
  recordTodayScore: () => {},
});

export function FatigueProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [tags, setTags] = useState<ScheduleTag[]>(DEFAULT_TAGS);
  const [baseline, setBaselineState] = useState<BaselineConfig>(DEFAULT_BASELINE);
  const [threshold, setThresholdState] = useState(7);
  const [restDays, setRestDays] = useState<string[]>([]);
  const [scoreHistory, setScoreHistory] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: PersistedData = JSON.parse(raw);
          if (data.entries) setEntries(data.entries);
          if (data.tags) setTags(data.tags);
          if (data.baseline) setBaselineState(data.baseline);
          if (data.threshold != null) setThresholdState(data.threshold);
          if (data.restDays) setRestDays(data.restDays);
          if (data.scoreHistory) setScoreHistory(data.scoreHistory);
        }
      } catch {
        // 読み込み失敗はデフォルト値のまま
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(
    (patch: Partial<PersistedData>) => {
      if (!loaded) return;
      AsyncStorage.getItem(STORAGE_KEY)
        .then(raw => {
          const current: PersistedData = raw
            ? JSON.parse(raw)
            : { entries, tags, baseline, threshold, restDays, scoreHistory };
          return AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...current, ...patch })
          );
        })
        .catch(() => {});
    },
    [loaded, entries, tags, baseline, threshold, restDays, scoreHistory]
  );

  const addEntry = useCallback(
    (entry: Omit<ScheduleEntry, 'id'>) => {
      const newEntry: ScheduleEntry = {
        ...entry,
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      setEntries(prev => {
        const next = [...prev, newEntry];
        persist({ entries: next });
        return next;
      });
    },
    [persist]
  );

  const removeEntry = useCallback(
    (id: string) => {
      setEntries(prev => {
        const next = prev.filter(e => e.id !== id);
        persist({ entries: next });
        return next;
      });
    },
    [persist]
  );

  const markRestDay = useCallback(
    (dateStr: string) => {
      setRestDays(prev => {
        if (prev.includes(dateStr)) return prev;
        const next = [...prev, dateStr];
        persist({ restDays: next });
        return next;
      });
    },
    [persist]
  );

  const unmarkRestDay = useCallback(
    (dateStr: string) => {
      setRestDays(prev => {
        const next = prev.filter(d => d !== dateStr);
        persist({ restDays: next });
        return next;
      });
    },
    [persist]
  );

  const setBaseline = useCallback(
    (config: Partial<BaselineConfig>) => {
      setBaselineState(prev => {
        const next = { ...prev, ...config };
        persist({ baseline: next });
        return next;
      });
    },
    [persist]
  );

  const setThreshold = useCallback(
    (value: number) => {
      setThresholdState(value);
      persist({ threshold: value });
    },
    [persist]
  );

  const recordTodayScore = useCallback(
    (score: number, dateStr: string) => {
      setScoreHistory(prev => {
        const next = { ...prev, [dateStr]: score };
        persist({ scoreHistory: next });
        return next;
      });
    },
    [persist]
  );

  return (
    <FatigueContext.Provider
      value={{
        entries,
        tags,
        baseline,
        threshold,
        restDays,
        scoreHistory,
        addEntry,
        removeEntry,
        markRestDay,
        unmarkRestDay,
        setBaseline,
        setThreshold,
        recordTodayScore,
      }}
    >
      {children}
    </FatigueContext.Provider>
  );
}

export function useFatigueContext() {
  return useContext(FatigueContext);
}
