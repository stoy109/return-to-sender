import {
  blankSpans,
  detectKinds,
  extractAccounts,
  extractLinks,
  extractPhones,
} from "./extract.ts";
import { assessHost } from "./lookalike.ts";
import { matchRules } from "./rules.ts";
import { buildBreakdown, comboBonus, verdictForScore } from "./score.ts";
import type {
  AnalysisResult,
  Analyzer,
  Finding,
  LinkCheck,
  TrickCategory,
} from "./types.ts";

/** One highlighted quote per explanation. The category score still uses the strongest weight. */
function keepOnePerExplanation(findings: Finding[]): Finding[] {
  const best = new Map<string, Finding>();
  for (const finding of findings) {
    const key = `${finding.explanationId}:${finding.params?.domain ?? ""}`;
    const current = best.get(key);
    if (!current || finding.end - finding.start > current.end - current.start) {
      best.set(key, finding);
    }
  }
  return [...best.values()];
}

function quote(text: string, start: number, end: number): string {
  const slice = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (slice.length <= 90) return slice;
  return `${slice.slice(0, 89)}…`;
}

function containedByStronger(finding: Finding, others: readonly Finding[]): boolean {
  return others.some((other) => {
    if (other === finding) return false;
    if (other.category !== finding.category) return false;
    const covers = other.start <= finding.start && other.end >= finding.end;
    if (!covers) return false;
    if (other.points > finding.points) return true;
    if (other.points === finding.points && other.end - other.start > finding.end - finding.start) {
      return true;
    }
    return false;
  });
}

export function analyzeText(input: string): AnalysisResult {
  const links = extractLinks(input);
  const phones = extractPhones(input, links);
  const accounts = extractAccounts(input, [...links, ...phones]);
  const masked = blankSpans(input, [...links, ...phones, ...accounts]);

  const draft: Finding[] = [];
  for (const hit of matchRules(masked)) {
    draft.push({
      id: "",
      category: hit.rule.category,
      explanationId: hit.rule.explanationId,
      evidence: quote(input, hit.start, hit.end),
      start: hit.start,
      end: hit.end,
      points: hit.rule.points,
      level: hit.rule.level,
    });
  }

  const linkChecks: LinkCheck[] = links.map((link) => {
    const assessment = assessHost(link.host);
    return {
      raw: link.raw,
      host: link.host,
      flags: assessment.flags,
      lookalikeOf: assessment.lookalikeOf,
      start: link.start,
      end: link.end,
      clickable: false,
    };
  });

  for (const link of linkChecks) {
    if (link.flags.length === 0) continue;
    const assessment = assessHost(link.host);
    draft.push({
      id: "",
      category: "fake_link",
      explanationId: assessment.explanationId,
      params: link.lookalikeOf ? { domain: link.lookalikeOf } : undefined,
      evidence: quote(input, link.start, link.end),
      start: link.start,
      end: link.end,
      points: assessment.points,
      level: assessment.level,
    });
  }

  const pruned = draft.filter((finding) => !containedByStronger(finding, draft));
  const unique = keepOnePerExplanation(pruned);
  unique.sort((a, b) => a.start - b.start || a.end - b.end || a.category.localeCompare(b.category));
  const findings = unique.map((finding, index) => ({ ...finding, id: `f${index + 1}` }));

  const categoryPoints: Partial<Record<TrickCategory, number>> = {};
  for (const finding of findings) {
    categoryPoints[finding.category] = Math.max(categoryPoints[finding.category] ?? 0, finding.points);
  }
  const categoryCount = Object.values(categoryPoints).filter((points) => (points ?? 0) > 0).length;
  const bonus = comboBonus(categoryCount);
  const breakdown = buildBreakdown(categoryPoints, bonus);
  const uncapped = breakdown.reduce((sum, part) => sum + part.points, 0);
  const score = Math.max(0, Math.min(100, uncapped));

  return {
    input,
    score,
    uncapped,
    verdict: verdictForScore(score),
    findings,
    links: linkChecks,
    accounts: accounts.map((account) => ({
      number: account.raw,
      start: account.start,
      end: account.end,
    })),
    phones: phones.map((phone) => ({
      number: phone.raw,
      start: phone.start,
      end: phone.end,
    })),
    detected: detectKinds(input),
    breakdown,
  };
}

export class HeuristicAnalyzer implements Analyzer {
  readonly id = "heuristic";

  analyze(input: string, signal?: AbortSignal): Promise<AnalysisResult> {
    if (signal?.aborted) {
      return Promise.reject(new DOMException("The check was cancelled.", "AbortError"));
    }
    return Promise.resolve(analyzeText(input));
  }
}
