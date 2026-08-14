# カラー比較

色を並べて、数値と見た目で比べるWebサイト。

**公開URL**: https://shotaiuchi.github.io/Color-Comparison/

## 機能

- **色リスト** — デフォルト2色、無制限に追加可能。カラーピッカー / HEX / rgb() / hsl() で入力、並べ替え・削除に対応
- **定量比較** — 色差 ΔE2000（CIE76併記）、WCAG 2.x コントラスト比と AA / AAA 判定、明度・彩度・色相の成分差。3色以上は全ペアのマトリクス表示からペアを選択
- **色の値** — HEX / RGB / HSL / Lab / LCH / OKLCH / 相対輝度をワンクリックでコピー
- **パーツプレビュー** — 比較対象パーツ（ボタン、カード背景、見出し等）を選び、色ごとのサンプルページ（LP / 商品一覧 / モバイル）をグリッド表示で見比べ。ライト / ダーク切替、コントラスト不足の警告付き
- **インポート / エクスポート** — Android `colors.xml`・iOS Swift / Asset Catalog・CSS 変数・SCSS 変数・JSON トークンの色定義を自動判別で取り込み。色リストを各形式で書き出してコピー / ダウンロード
- **共有** — 比較状態（色・名前・表示設定）をURLに埋め込んで共有。localStorage への自動保存・復元にも対応

## 開発

```bash
npm install      # 初回のみ
npm run dev      # 開発サーバー (http://localhost:5173)
npm run build    # 型チェック + 本番ビルド (dist/)
npm run preview  # ビルド結果のローカル確認
```

## 技術構成

- React + Vite + TypeScript（依存は React のみ、色計算は自前実装: `src/color.ts`）
- GitHub Actions で `main` プッシュ時に GitHub Pages へ自動デプロイ（`.github/workflows/deploy.yml`）

## ドキュメント

- [要件定義書](docs/requirements.md)
