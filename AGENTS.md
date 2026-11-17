# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# フォルダ構成

- `mobile/`：アプリ本体（Expo プロジェクト）。`npm` や `npx expo` のコマンドは必ず `mobile/` に入ってから実行する。
- `log/`：開発ログ（メモ）。
- `docs/`：ユーザーや AI が作った資料（解説 PDF、デバッグ報告、AI のまとめ、メモ）。根拠としては扱わない。
- `research/`：外から持ってきた資料（論文、公式ドキュメント、記事の保存）。疲労ロジック（種類・閾値・割合）を考えるときは、まずここを読み、根拠はここの資料から出典つきで示す。著作権があるため Git には入れない（`.gitignore` 済み）。
- 直下：`CLAUDE.md`・`AGENTS.md`（Claude への指示）、`.gitignore`、`netlify.toml`（デプロイ設定。`base = "mobile"`）。

# 安全ルール

- `mobile/.env.local` は開かない・表示しない・編集しない。値が必要なときはキー名だけをユーザーに伝える。
- `mobile/assets/` と `log/` のファイルは、ユーザーが頼んだときだけ編集する。
- `mobile/dist/` は自動生成の完成品なので手で編集しない（作り直すときは `mobile/` で `npx expo export -p web`）。
- ファイルを削除・上書き・移動する前に、対象のパスを示してユーザーの確認を取る。
- `git push`、`git reset --hard`、ブランチの削除は、ユーザーが明示的に頼んだときだけ行う。
