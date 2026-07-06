import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

const GUEST_STORAGE_KEY = 'authGuestMode';

type AuthResult = { error: string | null };

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** アカウント未作成のままアプリを閲覧しているかどうか */
  isGuest: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** アカウントを作らずにゲストとしてアプリを使い始める */
  continueAsGuest: () => Promise<void>;
  /** ゲストモードを終了してログイン画面に戻る */
  exitGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isGuest: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  continueAsGuest: async () => {},
  exitGuest: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestLoading, setGuestLoading] = useState(true);
  const loading = sessionLoading || guestLoading;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(GUEST_STORAGE_KEY)
      .then(value => setIsGuest(value === 'true'))
      .finally(() => setGuestLoading(false));
  }, []);

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    setIsGuest(false);
  };

  const continueAsGuest = async () => {
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, 'true');
    setIsGuest(true);
  };

  const exitGuest = async () => {
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isGuest,
        signUp,
        signIn,
        signOut,
        continueAsGuest,
        exitGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
