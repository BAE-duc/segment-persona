---
inclusion: manual
---

# デプロイメントガイド

## GitHub Pages デプロイ
```bash
# 本番ビルド
npm run build

# GitHub Pages にデプロイ
npm run deploy
```

## 環境変数設定
- **GEMINI_API_KEY**: AI統合用APIキー
- `.env.local` ファイルに設定

## ビルド設定
- **Base Path**: `/i-map/` (GitHub Pages用)
- **Server Host**: `0.0.0.0` (開発用)
- **Port**: 3000

## デプロイ前チェックリスト
1. `npm run build` でエラーがないか確認
2. 環境変数が正しく設定されているか確認
3. 画像ファイルパスが正しいか確認
4. 日本語テキストが正しく表示されるか確認

## トラブルシューティング
- ビルドエラー時: `rm -rf node_modules && npm install`
- 型エラー時: TypeScript設定とtypes パッケージを確認
- 画像表示エラー時: public フォルダのパス確認