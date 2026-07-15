# SHQR Bench

アンケート抽出タスクにおける各AIモデルのベンチマーク結果を可視化するWebアプリです。

## 画面

- **Overview**: コスト(1論文あたり)と精度(Entry Score)の関係を示す散布図
- **Metrics**: 各モデルの評価指標(Entry Score, Detection Precision/Recall/F1, Numbers Precision/Recall/F1, CER, ANLS, コストなど)を一覧できるリーダーボードと棒グラフ
- **Run Detail**: モデルごとに、論文単位のスコア推移と詳細を確認

## デプロイ

`main` ブランチへの push をトリガーに GitHub Actions がビルドし、GitHub Pages へ自動的に公開されます。
