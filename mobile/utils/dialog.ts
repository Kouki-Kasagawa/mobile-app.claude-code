import { Alert, Platform } from 'react-native';

/**
 * 確認ダイアログとお知らせを、Web とスマホの両方で動かすための関数。
 *
 * react-native-web の Alert.alert は中身が空の関数で、Web では何も表示されない。
 * そのため「削除しますか？」の確認が出ず、削除・ログアウトなどに進めなかった。
 * Web ではブラウザ標準の confirm / alert を使い、スマホでは今までどおり Alert を使う。
 */

type ConfirmOptions = {
  title: string;
  message?: string;
  /** 実行するボタンの文言（スマホのみ。Web のブラウザ確認画面は OK／キャンセル固定） */
  confirmText: string;
  onConfirm: () => void;
};

export function confirmAction({ title, message, confirmText, onConfirm }: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (window.confirm(text)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'キャンセル', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

export function showMessage(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
