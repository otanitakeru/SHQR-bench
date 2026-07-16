function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 flex flex-col gap-3">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      {children}
    </section>
  )
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm font-mono whitespace-pre">
      {children}
    </div>
  )
}

interface ExampleRow {
  entry: string
  anls: string
  jaccard: string
  score: string
}

const EXAMPLE_ROWS: ExampleRow[] = [
  { entry: '① 完全一致', anls: '1.0', jaccard: '1.0', score: '1.0' },
  { entry: '② テキスト完璧・番号が不一致 (9≠4)', anls: '1.0', jaccard: '0', score: '0' },
  { entry: '③ 感想が分割された断片', anls: '0.5 → 切り捨て 0', jaccard: '0.5', score: '0' },
  { entry: '④ 正しい棄権 (-1 vs 番号なし)', anls: '1.0', jaccard: '1.0', score: '1.0' },
  { entry: '⑤ 欠落 (GTにあるが出力されず)', anls: '—', jaccard: '—', score: '0' },
  { entry: '全体感想', anls: '1.0', jaccard: '(掛けない)', score: '1.0' },
]

const DIAGNOSTIC_METRICS: { label: string; description: string; better: string }[] = [
  {
    label: 'Detection Precision / Recall / F1',
    description: '感想エントリを何件正しく検出できたか。Precision = 検出した中で正しかった割合、Recall = GTのうち検出できた割合。',
    better: '高いほど良い',
  },
  {
    label: 'Numbers Precision / Recall / F1',
    description: 'マッチしたペアの中で、作品番号がどれだけ正確に読み取れたか。',
    better: '高いほど良い',
  },
  {
    label: 'CER % (matched)',
    description: '検出できたペアだけを対象にした文字誤り率(表記ゆれは許容後)。「読めた部分の純粋な文字精度」で、検出漏れの影響を受けない。',
    better: '低いほど良い',
  },
  {
    label: 'Entry Exact Rate',
    description: 'マッチしたペアのうち、作品番号の集合が完全一致した割合(文字の誤りは問わない)。',
    better: '高いほど良い',
  },
  {
    label: 'Perfect Entry Rate',
    description: '番号が完全一致し、かつ文字誤りが0だったペアの割合。「人手修正が一切不要だったエントリの割合」を表す、Entry Exact Rateより厳しい指標。',
    better: '高いほど良い',
  },
  {
    label: 'Overall ANLS',
    description: '展覧会全体への感想欄(番号を持たない1エントリ)の読み取り精度。',
    better: '高いほど良い',
  },
  {
    label: 'Cost / Paper, Total Cost, Elapsed',
    description: '1論文あたり・全体の実行コスト(USD)と処理時間(秒)。リトライ分も合算。',
    better: '低いほど良い',
  },
]

export function MetricsGuide() {
  return (
    <div className="flex flex-col gap-4">
      <Section title="評価の流れ">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          手書きアンケート画像をAIモデルが読み取り、「感想文＋作品番号」のエントリ一覧として構造化抽出します。
          その出力を正解データ(GT)と比較し、次の3ステップで評価します。
        </p>
        <ol className="text-sm text-neutral-700 dark:text-neutral-300 flex flex-col gap-2 list-decimal list-inside">
          <li>
            <span className="font-medium">前処理</span> — 句読点・記号を除去し、読みが同じ表記ゆれ(「すばらしい」↔「素晴らしい」)をGT表記に揃える
          </li>
          <li>
            <span className="font-medium">マッチング</span> — GTと予測のエントリを、テキストの類似度だけで1対1に対応付ける(番号や出力順序は使わない)。対応しなかったGTは「欠落」、対応しなかった予測は「過剰」として扱う
          </li>
          <li>
            <span className="font-medium">採点</span> — 対応付いたペアごとにテキストと番号の一致度を採点し、用紙単位・モデル単位に集計する
          </li>
        </ol>
      </Section>

      <Section title="主指標: Entry Score(0〜1、高いほど良い)">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          「抽出結果のうち、人手修正なしで使える割合」を表す総合スコアです。用紙ごとに以下の式で計算し、モデル全体では各用紙の分子・分母を合算してから割ります。
        </p>
        <Formula>{`         Σ_ペア [ ANLS(感想文) × Jaccard(番号) ] + ANLS(全体感想)
Score = ────────────────────────────────────────────────────
                    max(GT件数, 予測件数) + 1`}</Formula>
        <ul className="text-sm text-neutral-700 dark:text-neutral-300 flex flex-col gap-2 list-disc list-inside">
          <li>
            <span className="font-medium">ANLS</span> = 1 − 正規化編集距離(rescored後のテキスト同士)。0.5以下は0点に切り捨て、明らかな誤読には部分点を与えない
          </li>
          <li>
            <span className="font-medium">Jaccard</span> = 共通する番号の数 ÷ 番号の和集合の数。棄権(-1)は除外して計算し、除外後に両方とも空なら1点(「番号なし」の判断が一致 = 正解)
          </li>
          <li>
            <span className="font-medium">なぜ掛け算か</span> — 番号が間違っている感想は下流集計で別の作品に紐づいてしまうため、テキストと番号の両方が揃って初めて価値が生まれる
          </li>
          <li>
            <span className="font-medium">なぜ分母が max(GT件数, 予測件数) + 1 か</span> —
            見落とし(欠落)も水増し(過剰)も同じ基準で「1エントリ分の取り逃がし」として自動的に0点になる。全体感想も1エントリ分として数えることで、修正作業の実感(「エントリN行＋全体感想1枠」を確認する)に合わせている
          </li>
        </ul>
      </Section>

      <Section title="具体例で見る">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          GT 5エントリ・全体感想1件に対し、予測が番号違い・分割・欠落・過剰を含む例です。
        </p>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">項目</th>
                <th className="px-3 py-2 font-medium">ANLS</th>
                <th className="px-3 py-2 font-medium">Jaccard</th>
                <th className="px-3 py-2 font-medium">得点</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_ROWS.map((row) => (
                <tr key={row.entry} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-3 py-2">{row.entry}</td>
                  <td className="px-3 py-2">{row.anls}</td>
                  <td className="px-3 py-2">{row.jaccard}</td>
                  <td className="px-3 py-2 font-medium">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Formula>{`Score = (1.0 + 0 + 0 + 1.0 + 1.0) ÷ (max(5, 5) + 1) = 3.0 / 6 = 0.50`}</Formula>
      </Section>

      <Section title="診断指標(スコアが低い理由を調べる)">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Entry Score だけでは「番号を見落としているのか」「文字が読めていないのか」といった失敗の種類が分かりません。以下の指標を併せて見ることで、モデルの弱点を切り分けられます。
        </p>
        <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
          {DIAGNOSTIC_METRICS.map((m) => (
            <div key={m.label} className="py-3 flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{m.label}</span>
                <span className="text-xs text-neutral-400 whitespace-nowrap">{m.better}</span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{m.description}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
