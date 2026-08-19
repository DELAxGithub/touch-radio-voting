# たっちレディオ 名言60選 ＆ 閉塞感60選 投票フォーム

たっちレディオの「名言（210件）」と「閉塞感（56件）」から、カードゲーム用にそれぞれ60個を選んで投票・集計するためのWebアプリです。

## 🌟 特徴
- **スタンドアロン型**: HTMLファイル1枚（`index.html`）のみで完結し、サーバー不要で動作します。
- **名言＆閉塞感の完全分離投票**: それぞれ最大60個を独立して選択・管理できます。
- **自由記述の投稿・即時反映機能**: リストにない名言や閉塞感をその場で追加でき、自動で投票選択されます（ブラウザの`localStorage`に保持）。
- **リアルタイム検索＆発言者フィルター**: 田淵さん、田代さん、デラさん、ゲスト別や種別で高速フィルタリング。
- **CSVダウンロード**: 選択した投票結果をワンクリックでCSV出力可能。
- **完全匿名化対応**: 投稿者の個人情報・たっちネームは非表示になっています。

## 🚀 GitHub Pages でコミュニティに共有・公開する手順（完全無料）

1. **GitHubで新しいリポジトリを作成**（例: `touch-radio-voting`）
2. 本フォルダ内のファイル（特に `index.html`）をコミット＆プッシュします：
   ```bash
   cd /Users/delaxpro/.gemini/antigravity/scratch/touch_radio_voting
   git init
   git add .
   git commit -m "feat: initial release of touch radio voting app"
   git branch -M main
   git remote add origin https://github.com/<あなたのユーザー名>/touch-radio-voting.git
   git push -u origin main
   ```
3. GitHubリポジトリの **Settings（設定）** → **Pages** を開きます。
4. **Branch** で `main`（または `master`）、フォルダを `/ (root)` に設定して **Save** を押します。
5. 1〜2分後、`https://<あなたのユーザー名>.github.io/touch-radio-voting/` というURLが発行され、**誰でもブラウザから投票・利用できるようになります！**

## 📂 ファイル構成
- `index.html`: 投票フォームWebアプリ本体
- `quotes_and_heisoku_extracted.csv`: 統合データ（全266件）
- `meigen_list.csv`: 名言一覧データ（210件）
- `heisoku_list.csv`: 閉塞感一覧データ（56件）
- `voting_data.json`: 埋め込み用JSONデータ
