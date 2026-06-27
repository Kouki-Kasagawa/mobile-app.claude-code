# 学習時間記録アプリ v1 開発ログ

## プロジェクト概要

外発的報酬（ストリーク・ランキング）を排除した、努力を讃え・サボった日も責めない優しい学習記録アプリ。

## 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Expo | ~54.0.34 | 開発環境・ライブラリ集 |
| React Native | 0.81.5 | UI フレームワーク |
| TypeScript | ~5.9.2 | 型付き JavaScript |
| expo-router | ~6.0.23 | ファイルベースの画面遷移 |
| AsyncStorage | 2.2.0 | データ永続化 |

---

## 実装ステップ

### Step 1：プロジェクト準備・ナビゲーション土台

**やったこと**
- デフォルトのサンプル画面（`explore.tsx`）を削除
- ボトムタブを3画面構成に変更
- Android/Web 用アイコンマッピングに `timer`・`briefcase.fill` を追加

**変更ファイル**
```
app/(tabs)/_layout.tsx       タブを3つに再設定
app/(tabs)/index.tsx         ホーム画面プレースホルダー
app/(tabs)/timer.tsx         タイマー画面プレースホルダー（新規）
app/(tabs)/worklog.tsx       換算画面プレースホルダー（新規）
app/(tabs)/explore.tsx       削除
components/ui/icon-symbol.tsx  アイコン追加
```

---

### Step 2：ホーム画面・タイマー画面の UI

**やったこと**
- アプリカラーパレット（ソフトグリーン系）を `AppColors` として定義
- ホーム画面：育成キャラ枠（丸角カード）＋累計・今日の時間カード
- タイマー画面：大きな時間表示カード＋状態ボタン（`useState` で状態管理）
- ライト/ダークモード両対応（`ThemedView` の `lightColor`/`darkColor` prop を活用）

**変更ファイル**
```
constants/theme.ts      AppColors を追加
app/(tabs)/index.tsx    ホーム UI 実装
app/(tabs)/timer.tsx    タイマー UI 実装（開始/一時停止/再開/停止ボタン）
```

**新概念（Python 比較）**
- `StyleSheet.create` → tkinter の `configure()` に相当
- `flexDirection` → `pack(side=...)` に相当
- `useState` → インスタンス変数＋自動再描画

---

### Step 3：タイマーロジック・換算機能

**やったこと**
- タイマー：`useEffect` + `useRef` + `setInterval` で実際にカウントアップ
- `formatTime(seconds)` で `HH:MM:SS` 形式に変換して表示
- 換算画面：勤務・授業時間を **7:1 の比率**で換算（7時間 → 1時間）
- `TextInput` で時間・分を入力、換算結果をリアルタイムプレビュー

**変更ファイル**
```
app/(tabs)/timer.tsx    タイマーロジック追加
app/(tabs)/worklog.tsx  換算 UI・計算ロジック実装
```

**新概念（Python 比較）**
- `useEffect` → 描画後に実行される「副作用」の置き場
- `useRef` → 画面更新をトリガーしない内部変数（インターバル ID の保持に使用）
- `setInterval` / `clearInterval` → `threading.Timer` に相当

```typescript
// タイマーの核心部分
useEffect(() => {
  if (status === 'running') {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  }
  return () => { clearInterval(intervalRef.current); };
}, [status]);
```

---

### Step 4：累積時間の計算・育成要素の反映

**やったこと**
- `context/TimeContext.tsx` を新規作成（Context API で全画面に状態を共有）
- `TimeProvider` でタブ全体を包み、どの画面からも `useTime()` で読み書き可能に
- タイマー「停止」時に経過時間を累計に加算
- 換算「記録に追加」時に換算後の分数を累計に加算
- ホーム画面：累計時間に応じてキャラクターが変化（5ステージ）

**変更ファイル**
```
context/TimeContext.tsx      新規作成（共有状態・addMinutes 関数）
app/(tabs)/_layout.tsx       TimeProvider で Tabs を包む
app/(tabs)/timer.tsx         停止時に addMinutes 呼び出し
app/(tabs)/worklog.tsx       記録追加時に addMinutes 呼び出し
app/(tabs)/index.tsx         Context 読み取り・ステージ表示
```

**育成ステージ**

| 累計時間 | 絵文字 | メッセージ |
|----------|--------|-----------|
| 0〜59 分 | 🌱 | はじめの一歩 |
| 1〜5 時間 | 🌿 | 芽が出てきた |
| 5〜10 時間 | 🌻 | すくすく成長中 |
| 10〜25 時間 | 🌳 | 大きくなってきた |
| 25 時間〜 | ⭐ | 立派に育ったね |

**新概念（Python 比較）**
- Context API → `g` オブジェクト（アプリ全体で共有されるグローバル状態）に相当
- `createContext` / `useContext` → モジュールレベルの変数＋自動再描画の仕組み

---

### Step 5：データの永続化

**やったこと**
- `@react-native-async-storage/async-storage@2.2.0` をインストール
- `TimeContext.tsx` に読み込み・保存ロジックを追加
- 起動時に保存済みデータを復元
- 翌日起動時は `todayMinutes` のみリセット（`totalMinutes` は保持）
- `loaded` フラグで「読み込み完了前に 0 で上書きしてしまう」バグを防止

**変更ファイル**
```
package.json             AsyncStorage を追加
context/TimeContext.tsx  起動時読み込み・変更時自動保存・日付リセット処理
```

**保存データの構造**
```json
{
  "totalMinutes": 300,
  "todayMinutes": 60,
  "savedDate": "2026-06-28"
}
```

**新概念（Python 比較）**
- `AsyncStorage` → `json.dump` / `json.load` に相当（非同期版）
- `await` → Python の `asyncio.await` と同じ概念

---

## 最終的なファイル構成

```
time_log_app/
├── app/
│   ├── _layout.tsx          ルートレイアウト（Stack ナビゲーション）
│   ├── modal.tsx            モーダル画面（未使用）
│   └── (tabs)/
│       ├── _layout.tsx      タブバー設定 + TimeProvider
│       ├── index.tsx        ホーム画面（育成・累計時間）
│       ├── timer.tsx        タイマー画面
│       └── worklog.tsx      換算画面
├── context/
│   └── TimeContext.tsx      共有状態（totalMinutes・todayMinutes・永続化）
├── components/              既存の共通コンポーネント
├── constants/
│   └── theme.ts             カラーパレット（AppColors 追加）
└── hooks/                   既存のカスタムフック
```

---

## v1 実装済み機能

- [x] タイマー（開始 / 一時停止 / 再開 / 停止）
- [x] 勤務・授業時間の換算記録（7:1 比率）
- [x] 累計・今日の学習時間の表示
- [x] 育成キャラクター（累計時間で 5 段階変化）
- [x] データの永続化（アプリ終了後も保持）
- [x] 翌日の「今日」リセット
- [x] ライト / ダークモード対応

## v2 候補

- [ ] カスタムイラストへの差し替え（Step 4 の絵文字を画像に）
- [ ] 換算比率の設定変更機能
- [ ] 週・月単位の集計グラフ
- [ ] セッション履歴の表示
- [ ] 通知機能（学習開始のリマインド）
