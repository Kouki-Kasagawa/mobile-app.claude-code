# 学習時間記録アプリ v2 開発ログ

## v2 の目標

v1 で実装したタイマー・換算・育成機能をベースに、**学習の振り返り**と**カスタマイズ**ができる機能を追加する。

---

## 実装ステップ

### Step 1：履歴画面の追加（カレンダー表示）

**やったこと**
- タブナビゲーションに「履歴」タブを追加（アイコン: `calendar`）
- `app/(tabs)/history.tsx` を新規作成
- 日ごとの学習時間を**カレンダー形式**で確認できる画面を実装
- `TimeContext` から記録データを参照して表示
- ホーム画面（`index.tsx`）の表示・構造もあわせてリファクタリング

**変更ファイル**
```
app/(tabs)/_layout.tsx        「履歴」タブを追加
app/(tabs)/history.tsx        新規作成（カレンダー表示）
app/(tabs)/index.tsx          ホーム画面のリファクタリング
app/(tabs)/worklog.tsx        不要なロジックを整理・簡略化
components/ui/icon-symbol.tsx  calendar アイコンを追加
context/TimeContext.tsx        日ごとデータの管理構造を改善
```

**変更規模**：+464行 / -95行

---

### Step 2：設定画面の追加（テーマ・換算比率）

**やったこと**
- タブナビゲーションに「設定」タブを追加（アイコン: `gear`）
- `app/(tabs)/settings.tsx` を新規作成
- **テーマ切り替え**（ライト / ダーク / システム）機能を実装
- **換算比率の変更**機能を実装（v1 では 7:1 固定だったものをカスタマイズ可能に）
- `context/SettingsContext.tsx` を新規作成し、設定値をアプリ全体で共有
- `hooks/use-color-scheme.ts` をテーマ設定に対応するよう更新
- `app/_layout.tsx` のルートレイアウトに `SettingsContext.Provider` を組み込み

**変更ファイル**
```
app/(tabs)/_layout.tsx        「設定」タブを追加
app/(tabs)/settings.tsx       新規作成（テーマ・換算比率の設定UI）
app/(tabs)/worklog.tsx        換算比率を SettingsContext から参照するよう変更
app/_layout.tsx               SettingsContext.Provider をルートに追加
components/ui/icon-symbol.tsx  gear アイコンを追加
context/SettingsContext.tsx   新規作成（テーマ・換算比率の共有状態）
context/TimeContext.tsx        SettingsContext との連携対応
hooks/use-color-scheme.ts     テーマ設定に連動するよう更新
```

**変更規模**：+344行 / -9行

---

## v2 追加後のファイル構成

```
time_log_app/
├── app/
│   ├── _layout.tsx          ルートレイアウト（SettingsContext.Provider を追加）
│   └── (tabs)/
│       ├── _layout.tsx      タブバー設定（4タブ構成に拡張）
│       ├── index.tsx        ホーム画面（育成・累計時間）
│       ├── timer.tsx        タイマー画面
│       ├── worklog.tsx      換算画面（換算比率を設定から参照）
│       ├── history.tsx      履歴画面（カレンダー表示）★新規
│       └── settings.tsx     設定画面（テーマ・換算比率）★新規
├── context/
│   ├── TimeContext.tsx      共有状態（学習時間データ・永続化）
│   └── SettingsContext.tsx  共有状態（テーマ・換算比率）★新規
├── components/              既存の共通コンポーネント
├── constants/
│   └── theme.ts             カラーパレット（AppColors）
└── hooks/
    └── use-color-scheme.ts  テーマ設定連動に更新
```

---

## v2 実装済み機能

- [x] 日ごとの学習時間をカレンダーで振り返る（履歴画面）
- [x] テーマ切り替え（ライト / ダーク / システム）
- [x] 換算比率のカスタマイズ（固定 7:1 → 設定で変更可能）

## v3 候補

- [ ] カスタムイラストへの差し替え（絵文字を画像に）
- [ ] 週・月単位の集計グラフ
- [ ] 通知機能（学習開始のリマインド）
