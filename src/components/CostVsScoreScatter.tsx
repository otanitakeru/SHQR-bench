import { ScoreScatterChart } from "./ScoreScatterChart";
import type { ComparisonRow } from "../types";

interface Props {
  rows: ComparisonRow[];
}

export function CostVsScoreScatter({ rows }: Props) {
  return (
    <ScoreScatterChart
      rows={rows}
      xKey="cost_usd_per_paper"
      yKey="entry_score"
      title="Cost per Paper vs Entry Score"
    />
  );
}
