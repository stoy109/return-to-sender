import type { Verdict } from "../analyzer/types.ts";
import { useI18n } from "../i18n.tsx";

export function Stamp({
  verdict,
  mini = false,
  animate = false,
}: {
  verdict: Verdict;
  mini?: boolean;
  animate?: boolean;
}) {
  const { t } = useI18n();
  const className = [
    "stamp",
    `stamp--${verdict}`,
    mini ? "stamp--mini" : "",
    !mini && animate && verdict === "likely_scam" ? "stamp--enter" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <p class={className} aria-hidden="true">
      {t(`verdict.${verdict}`)}
    </p>
  );
}

export function RiskBar({ score, verdict }: { score: number; verdict: Verdict }) {
  const width = Math.max(0, Math.min(100, score));
  return (
    <div class="risk" aria-hidden="true">
      <div class="risk-track">
        <div class={`risk-fill risk-fill--${verdict}`} style={{ width: `${width}%` }} />
        <span class="risk-tick" style={{ left: "30%" }} />
        <span class="risk-tick" style={{ left: "70%" }} />
      </div>
      <div class="risk-scale mono">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}
