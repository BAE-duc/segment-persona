---
inclusion: manual
---

# GitHub Pages デプロイメント成功パターン

## 推奨デプロイ方法
**peaceiris/actions-gh-pages@v3** を使用した安定的な配布方式

## 成功したワークフロー設定

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## GitHub リポジトリ設定

### Settings > Pages 設定
1. **Source**: "Deploy from a branch" を選択
2. **Branch**: "gh-pages" を選択 (ワークフロー実行後に自動生成)
3. **Folder**: "/ (root)" を選択

## 避けるべき方法

### ❌ 失敗パターン
- `actions/configure-pages` + `actions/deploy-pages` の組み合わせ
- GitHub Pages が有効化されていない状態での Actions 使用
- 複雑な environment 設定

### ❌ よくあるエラー
- "repository has Pages enabled and configured to build using GitHub Actions"
- YAML 文法エラー (environment の位置間違い)

## 成功要因
1. **シンプルな設定**: 複雑な Pages 設定不要
2. **安定したアクション**: peaceiris/actions-gh-pages は実績豊富
3. **自動ブランチ管理**: gh-pages ブランチ自動生成・管理
4. **最小権限**: contents: write のみで十分

## 使用場面
- React/Vue/Angular などの SPA アプリケーション
- Vite/Webpack などのビルドツール使用プロジェクト
- 静的サイト生成 (SSG) プロジェクト

## 注意事項
- `npm ci` を使用して依存関係の一貫性を保つ
- `publish_dir` はビルド出力ディレクトリと一致させる
- Node.js バージョンは LTS (20) を推奨