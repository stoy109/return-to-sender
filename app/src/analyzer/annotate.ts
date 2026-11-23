import type { Finding, HighlightLevel } from "./types.ts";

export interface Segment {
  text: string;
  level: "none" | HighlightLevel;
  findingIds: string[];
}

/** Split text so overlapping tricks share one highlight and several numbers. */
export function annotate(text: string, findings: readonly Finding[]): Segment[] {
  if (!text) return [];
  const cuts = new Set<number>([0, text.length]);
  for (const finding of findings) {
    if (finding.start >= 0 && finding.end <= text.length && finding.start < finding.end) {
      cuts.add(finding.start);
      cuts.add(finding.end);
    }
  }
  const points = [...cuts].sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i] ?? 0;
    const end = points[i + 1] ?? start;
    if (start === end) continue;
    const active = findings.filter((finding) => finding.start < end && finding.end > start);
    const level: Segment["level"] = active.some((finding) => finding.level === "scam")
      ? "scam"
      : active.length > 0
        ? "suspicious"
        : "none";
    segments.push({
      text: text.slice(start, end),
      level,
      findingIds: active.map((finding) => finding.id),
    });
  }
  return segments;
}
