import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Web はブラウザ標準のURL実装を持っており、react-native-url-polyfillで
// window.URLを上書きするとexpo-routerのWebルーティングと衝突し無限ループを
// 起こすため、ネイティブ環境でのみポリフィルを適用する。
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY が設定されていません。.env.local を作成してください（.env.local.example 参照）。'
  );
}

/**
 * expo-router のWeb版はNode.js上でSSRを行うため、window/localStorageに依存する
 * AsyncStorageをそのまま渡すと `window is not defined` でSSRごと落ちる。
 * SSR時（window未定義）は何もしないダミー実装にフォールバックする。
 */
const ssrSafeStorage = {
  getItem: (key: string) => (typeof window === 'undefined' ? Promise.resolve(null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
