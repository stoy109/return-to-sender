import { HeuristicAnalyzer } from "./heuristic.ts";
import { LlmAnalyzer } from "./llm.ts";
import type { Analyzer } from "./types.ts";

export function createAnalyzer(kind: "heuristic" | "llm" = "heuristic"): Analyzer {
  if (kind === "llm") return new LlmAnalyzer();
  return new HeuristicAnalyzer();
}

export { annotate } from "./annotate.ts";
export { detectKinds } from "./extract.ts";
export { analyzeText, HeuristicAnalyzer } from "./heuristic.ts";
export { assessHost } from "./lookalike.ts";
export { LlmAnalyzer } from "./llm.ts";
export { punycodeDecode } from "./punycode.ts";
export { SAMPLES } from "./samples.ts";
export { verdictForScore } from "./score.ts";
export type {
  AccountCheck,
  AnalysisResult,
  Analyzer,
  BreakdownId,
  DetectedKinds,
  Finding,
  HighlightLevel,
  LinkCheck,
  LinkFlag,
  PhoneCheck,
  ScorePart,
  TrickCategory,
  Verdict,
} from "./types.ts";
