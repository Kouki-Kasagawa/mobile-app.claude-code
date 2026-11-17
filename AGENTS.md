# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# 安全ルール

- `.env.local` は開かない・表示しない・編集しない。値が必要なときはキー名だけをユーザーに伝える。
- `assets/` と `log/` のファイルは、ユーザーが頼んだときだけ編集する。
- `dist/` は自動生成の完成品なので手で編集しない（作り直すときは `npx expo export -p web`）。
- ファイルを削除・上書き・移動する前に、対象のパスを示してユーザーの確認を取る。
- `git push`、`git reset --hard`、ブランチの削除は、ユーザーが明示的に頼んだときだけ行う。
