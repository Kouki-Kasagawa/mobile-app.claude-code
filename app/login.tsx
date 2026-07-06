import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Mode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signIn, signUp, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mutedColor = isDark ? '#9E9E9E' : '#AAAAAA';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const cardBg = isDark ? '#1A251C' : '#FFFFFF';

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    setSubmitting(true);
    const result =
      mode === 'signIn' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === 'signUp') {
      setInfo('確認メールを送信しました。メール内のリンクから認証してください。');
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'signIn' ? 'signUp' : 'signIn'));
    setError(null);
    setInfo(null);
  };

  const handleGuest = () => {
    continueAsGuest();
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            <ThemedText type="title" style={styles.title}>学習記録</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
              {mode === 'signIn' ? 'ログインして記録を同期' : '新しいアカウントを作成'}
            </ThemedText>

            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                placeholder="メールアドレス"
                placeholderTextColor={mutedColor}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                placeholder="パスワード（6文字以上）"
                placeholderTextColor={mutedColor}
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}
              {info && <Text style={[styles.infoText, { color: AppColors.accent }]}>{info}</Text>}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: AppColors.accent },
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? '処理中…' : mode === 'signIn' ? 'ログイン' : 'アカウント作成'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={toggleMode} style={styles.switchModeBtn} activeOpacity={0.7}>
              <Text style={[styles.switchModeText, { color: mutedColor }]}>
                {mode === 'signIn'
                  ? 'アカウントをお持ちでない方はこちら'
                  : 'すでにアカウントをお持ちの方はこちら'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGuest} style={styles.guestBtn} activeOpacity={0.7}>
              <Text style={[styles.guestBtnText, { color: mutedColor }]}>
                アカウントを作らずにゲストとして見る
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', fontSize: 14, marginBottom: 24 },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: { color: '#EF5B5B', fontSize: 13 },
  infoText: { fontSize: 13 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  switchModeBtn: { alignItems: 'center', marginTop: 20, padding: 8 },
  switchModeText: { fontSize: 13 },
  guestBtn: { alignItems: 'center', marginTop: 4, padding: 8 },
  guestBtnText: { fontSize: 13, textDecorationLine: 'underline' },
});
