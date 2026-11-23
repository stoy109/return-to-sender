import type { BreakdownId, ScorePart, TrickCategory, Verdict } from "./types.ts";

/** 0–29 looks safe, 30–69 suspicious, 70–100 likely scam. */
export function verdictForScore(score: number): Verdict {
  if (!Number.isFinite(score) || score < 30) return "safe";
  if (score < 70) return "suspicious";
  return "likely_scam";
}

/** Extra points when several different tricks show up together. */
export function comboBonus(categoryCount: number): number {
  if (categoryCount >= 4) return 12;
  if (categoryCount >= 3) return 8;
  if (categoryCount >= 2) return 4;
  return 0;
}

const ORDER: readonly BreakdownId[] = [
  "impersonation",
  "urgency",
  "fake_link",
  "payment_request",
  "personal_data",
  "combo",
];

export function buildBreakdown(
  categoryPoints: Partial<Record<TrickCategory, number>>,
  bonus: number,
): ScorePart[] {
  const parts: ScorePart[] = [];
  for (const id of ORDER) {
    if (id === "repeat") continue;
    const points = id === "combo" ? bonus : (categoryPoints[id] ?? 0);
    if (points > 0) parts.push({ id, points });
  }
  return parts;
}
