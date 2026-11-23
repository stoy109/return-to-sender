import {
  KNOWN_BAD_DOMAINS,
  MULTI_SUFFIXES,
  PROTECTED_DOMAINS,
  SHORTENERS,
  UNUSUAL_TLDS,
  type ProtectedDomain,
} from "./lists.ts";
import { toUnicodeHost } from "./punycode.ts";
import type { HighlightLevel, LinkFlag } from "./types.ts";

const HOMOGLYPHS: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ј: "j",
  ѕ: "s",
  һ: "h",
  ԁ: "d",
  ɡ: "g",
  α: "a",
  ε: "e",
  ι: "i",
  κ: "k",
  ν: "v",
  ο: "o",
  ρ: "p",
  τ: "t",
};

/** Extra words that, glued to a short brand, still read as that brand. */
const SHORT_AFFIX =
  /^(?:bank|login|secure|aman|verify|verifikasi|official|resmi|update|akun|mobile|app|otp|pay)$/;

const MULTI = new Set(MULTI_SUFFIXES);
const BAD = new Set(KNOWN_BAD_DOMAINS);
const SHORT = new Set(SHORTENERS);
const UNUSUAL = new Set(UNUSUAL_TLDS);

const FLAG_POINTS: Record<LinkFlag, number> = {
  known_bad: 70,
  lookalike: 30,
  shortened: 14,
  unusual_tld: 10,
};

/** One link never contributes more than this, even with several flags. */
export const LINK_SCORE_CAP = 80;

export interface HostParts {
  labels: string[];
  suffix: string;
  registrable: string;
  nameLabels: string[];
}

export interface HostAssessment {
  flags: LinkFlag[];
  lookalikeOf?: string;
  points: number;
  level: HighlightLevel;
  explanationId: string;
}

export function skeleton(value: string): string {
  let out = "";
  for (const ch of value.toLowerCase()) {
    out += HOMOGLYPHS[ch] ?? ch;
  }
  return out.replace(/[^a-z0-9]/g, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length] ?? 0;
}

export function splitHost(host: string): HostParts {
  const labels = host.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  const last2 = labels.slice(-2).join(".");
  const multi = labels.length >= 3 && MULTI.has(last2);
  const suffixLen = multi ? 2 : 1;
  const suffix = multi ? last2 : (labels[labels.length - 1] ?? "");
  const registrable = labels.slice(Math.max(labels.length - (suffixLen + 1), 0)).join(".");
  const nameLabels = labels.slice(0, Math.max(labels.length - suffixLen, 0));
  return { labels, suffix, registrable, nameLabels };
}

function isExactProtected(parts: HostParts): boolean {
  return PROTECTED_DOMAINS.some((brand) => brand.domain === parts.registrable);
}

function embeddedProtected(labels: string[]): string | undefined {
  let best: ProtectedDomain | undefined;
  for (const brand of PROTECTED_DOMAINS) {
    const domainLabels = brand.domain.split(".");
    for (let i = 0; i + domainLabels.length < labels.length; i++) {
      const matches = domainLabels.every((part, j) => labels[i + j] === part);
      if (!matches) continue;
      if (!best || brand.domain.length > best.domain.length) best = brand;
    }
  }
  return best?.domain;
}

function maxDistance(brandLength: number): number {
  if (brandLength <= 4) return 0;
  if (brandLength <= 7) return 1;
  return 2;
}

interface Hit {
  domain: string;
  strength: number;
  brandLength: number;
}

function consider(best: Hit | undefined, hit: Hit): Hit {
  if (!best) return hit;
  if (hit.strength !== best.strength) return hit.strength > best.strength ? hit : best;
  if (hit.brandLength !== best.brandLength) return hit.brandLength > best.brandLength ? hit : best;
  return best;
}

function matchPiece(piece: string, best: Hit | undefined): Hit | undefined {
  const sk = skeleton(piece);
  if (!sk) return best;
  let next = best;
  for (const brand of PROTECTED_DOMAINS) {
    for (const name of brand.labels) {
      const bn = skeleton(name);
      if (!bn) continue;
      if (sk === bn) {
        next = consider(next, { domain: brand.domain, strength: 3, brandLength: bn.length });
        continue;
      }
      const dist = maxDistance(bn.length);
      if (dist > 0 && Math.abs(sk.length - bn.length) <= dist && levenshtein(sk, bn) <= dist) {
        next = consider(next, { domain: brand.domain, strength: 2, brandLength: bn.length });
        continue;
      }
      if (bn.length >= 5 && sk.length > bn.length && sk.length - bn.length <= 16) {
        if (sk.startsWith(bn) || sk.endsWith(bn)) {
          next = consider(next, { domain: brand.domain, strength: 1, brandLength: bn.length });
        }
        continue;
      }
      if (bn.length >= 2 && bn.length <= 4 && sk.length > bn.length) {
        const rest = sk.startsWith(bn) ? sk.slice(bn.length) : sk.endsWith(bn) ? sk.slice(0, -bn.length) : "";
        if (rest && SHORT_AFFIX.test(rest)) {
          next = consider(next, { domain: brand.domain, strength: 1, brandLength: bn.length });
        }
      }
    }
  }
  return next;
}

/** Return the protected domain this host imitates, or undefined if it does not. */
export function findLookalike(host: string): string | undefined {
  const unicode = toUnicodeHost(host);
  const parts = splitHost(unicode);
  if (parts.labels.length < 2) return undefined;
  if (isExactProtected(parts)) return undefined;
  const embedded = embeddedProtected(parts.labels);
  if (embedded) return embedded;

  let best: Hit | undefined;
  for (const label of parts.nameLabels) {
    const tokens = label.split(/[-_]+/).filter(Boolean);
    const pieces = tokens.length > 1 ? tokens : [label];
    for (const piece of pieces) best = matchPiece(piece, best);
  }
  return best?.domain;
}

function hostInSet(host: string, set: Set<string>): boolean {
  const parts = splitHost(toUnicodeHost(host));
  return set.has(parts.registrable) || set.has(host.toLowerCase()) || set.has(parts.labels.join("."));
}

export function linkPoints(flags: readonly LinkFlag[]): number {
  let total = 0;
  for (const flag of flags) {
    if (flag === "unusual_tld" && flags.includes("shortened")) continue;
    total += FLAG_POINTS[flag];
  }
  return Math.min(LINK_SCORE_CAP, total);
}

export function assessHost(host: string): HostAssessment {
  const ascii = host.toLowerCase().replace(/\.$/, "");
  const unicode = toUnicodeHost(ascii);
  const flags: LinkFlag[] = [];
  const shortened = hostInSet(unicode, SHORT) || hostInSet(ascii, SHORT);
  const known = hostInSet(unicode, BAD) || [...BAD].some((bad) => unicode.endsWith(`.${bad}`) || ascii.endsWith(`.${bad}`));
  const lookalikeOf = findLookalike(unicode);
  const unusual = !shortened && UNUSUAL.has(splitHost(unicode).suffix);

  if (known) flags.push("known_bad");
  if (lookalikeOf) flags.push("lookalike");
  if (shortened) flags.push("shortened");
  if (unusual) flags.push("unusual_tld");

  let explanationId = "link.tld";
  let level: HighlightLevel = "suspicious";
  if (known) {
    explanationId = "link.known_bad";
    level = "scam";
  } else if (lookalikeOf) {
    explanationId = "link.lookalike";
    level = "scam";
  } else if (shortened) {
    explanationId = "link.short";
  }

  return {
    flags,
    lookalikeOf,
    points: linkPoints(flags),
    level,
    explanationId,
  };
}
