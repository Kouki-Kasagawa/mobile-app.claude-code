import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  LOCAL_USER_ID,
  ReactionTimeResult,
  RewardAppraisal,
  StudySession,
  SubjectiveEntry,
  SubjectiveTiming,
} from '@/types/studyLog';

const STORAGE_KEY = 'studyLogData_v1';

interface PersistedData {
  sessions: StudySession[];
  subjectiveEntries: SubjectiveEntry[];
  reactionResults: ReactionTimeResult[];
}

export interface StudyLogContextType {
  sessions: StudySession[];
  subjectiveEntries: SubjectiveEntry[];
  reactionResults: ReactionTimeResult[];

  startSession: (input: {
    subject?: string;
    reward: RewardAppraisal | null;
    plannedFor?: string;
  }) => string;
  finishSession: (id: string, durationMinutes: number) => void;
  addSubjectiveEntry: (input: {
    sessionId?: string;
    timing: SubjectiveTiming;
    score: number;
    note?: string;
  }) => string;
  addReactionResult: (input: {
    sessionId?: string;
    timing: SubjectiveTiming;
    trials: ReactionTimeResult['trials'];
    avgReactionMs: number;
    accuracy: number;
  }) => string;
}

const StudyLogContext = createContext<StudyLogContextType>({
  sessions: [],
  subjectiveEntries: [],
  reactionResults: [],
  startSession: () => '',
  finishSession: () => {},
  addSubjectiveEntry: () => '',
  addReactionResult: () => '',
});

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function StudyLogProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjectiveEntries, setSubjectiveEntries] = useState<SubjectiveEntry[]>([]);
  const [reactionResults, setReactionResults] = useState<ReactionTimeResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: PersistedData = JSON.parse(raw);
          if (data.sessions) setSessions(data.sessions);
          if (data.subjectiveEntries) setSubjectiveEntries(data.subjectiveEntries);
          if (data.reactionResults) setReactionResults(data.reactionResults);
        }
      } catch {
        // 読み込み失敗はデフォルト値のまま
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // 保存は「3つの記録のどれかが変わったら、全体をまとめて1回書く」だけにする。
  // 以前は操作ごとに「読む→一部を差し替える→書く」を何度も呼んでいたため、
  // 保存どうしがぶつかって片方の変更が古いデータで上書きされていた（#4）。
  // 読み込みが終わる前に空のデータで上書きしないよう、loaded を待つ。
  useEffect(() => {
    if (!loaded) return;
    const data: PersistedData = { sessions, subjectiveEntries, reactionResults };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [loaded, sessions, subjectiveEntries, reactionResults]);

  const startSession = useCallback(
    (input: { subject?: string; reward: RewardAppraisal | null; plannedFor?: string }) => {
      const id = genId();
      const session: StudySession = {
        id,
        userId: LOCAL_USER_ID,
        subject: input.subject,
        startedAt: new Date().toISOString(),
        durationMinutes: 0,
        reward: input.reward,
        plannedFor: input.plannedFor,
      };
      setSessions(prev => [...prev, session]);
      return id;
    },
    []
  );

  const finishSession = useCallback(
    (id: string, durationMinutes: number) => {
      setSessions(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, endedAt: new Date().toISOString(), durationMinutes }
            : s
        )
      );
    },
    []
  );

  const addSubjectiveEntry = useCallback(
    (input: { sessionId?: string; timing: SubjectiveTiming; score: number; note?: string }) => {
      const id = genId();
      const entry: SubjectiveEntry = {
        id,
        userId: LOCAL_USER_ID,
        sessionId: input.sessionId,
        timing: input.timing,
        score: input.score,
        note: input.note,
        timestamp: new Date().toISOString(),
      };
      setSubjectiveEntries(prev => [...prev, entry]);
      if (input.sessionId) {
        const field = input.timing === 'pre' ? 'subjectivePreId' : 'subjectivePostId';
        setSessions(prev =>
          prev.map(s => (s.id === input.sessionId ? { ...s, [field]: id } : s))
        );
      }
      return id;
    },
    []
  );

  const addReactionResult = useCallback(
    (input: {
      sessionId?: string;
      timing: SubjectiveTiming;
      trials: ReactionTimeResult['trials'];
      avgReactionMs: number;
      accuracy: number;
    }) => {
      const id = genId();
      const result: ReactionTimeResult = {
        id,
        userId: LOCAL_USER_ID,
        sessionId: input.sessionId,
        timing: input.timing,
        trials: input.trials,
        avgReactionMs: input.avgReactionMs,
        accuracy: input.accuracy,
        timestamp: new Date().toISOString(),
      };
      setReactionResults(prev => [...prev, result]);
      if (input.sessionId) {
        const field = input.timing === 'pre' ? 'reactionPreId' : 'reactionPostId';
        setSessions(prev =>
          prev.map(s => (s.id === input.sessionId ? { ...s, [field]: id } : s))
        );
      }
      return id;
    },
    []
  );

  return (
    <StudyLogContext.Provider
      value={{
        sessions,
        subjectiveEntries,
        reactionResults,
        startSession,
        finishSession,
        addSubjectiveEntry,
        addReactionResult,
      }}
    >
      {children}
    </StudyLogContext.Provider>
  );
}

export function useStudyLogContext() {
  return useContext(StudyLogContext);
}
