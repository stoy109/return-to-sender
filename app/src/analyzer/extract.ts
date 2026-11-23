import type { DetectedKinds } from "./types.ts";

export interface TextSpan {
  raw: string;
  start: number;
  end: number;
}

export interface ExtractedLink extends TextSpan {
  host: string;
}

const TLD_ALT = [
  "co\\.id",
  "go\\.id",
  "ac\\.id",
  "or\\.id",
  "web\\.id",
  "my\\.id",
  "sch\\.id",
  "mil\\.id",
  "net\\.id",
  "com",
  "net",
  "org",
  "info",
  "biz",
  "xyz",
  "top",
  "click",
  "online",
  "site",
  "shop",
  "app",
  "dev",
  "link",
  "vip",
  "icu",
  "sbs",
  "cfd",
  "buzz",
  "gq",
  "tk",
  "ml",
  "ga",
  "cf",
  "io",
  "me",
  "ly",
  "gl",
  "cc",
  "be",
  "gg",
  "ru",
  "id",
  "co",
  "to",
].join("|");

const URL_RE = new RegExp(
  String.raw`(?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\.)+(?:${TLD_ALT})(?:\/[^\s<>"']*)?`,
  "gi",
);

const PHONE_RE = /(?<![\w+])(?:\+62[\s.-]?|62[\s.-]?|0)8(?:[\s.-]?\d){8,12}(?!\d)/gi;
const ACCOUNT_RE = /(?<!\d)\d{10,16}(?!\d)/g;

function overlaps(start: number, end: number, spans: readonly TextSpan[]): boolean {
  return spans.some((span) => start < span.end && end > span.start);
}

function trimTail(raw: string): string {
  return raw.replace(/[),.;:!?\]}>]+$/g, "");
}

function parseHost(raw: string): string | null {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    const host = new URL(withScheme).hostname.replace(/\.$/, "").toLowerCase();
    if (!host.includes(".")) return null;
    return host;
  } catch {
    return null;
  }
}

export function extractLinks(text: string): ExtractedLink[] {
  const found: ExtractedLink[] = [];
  for (const match of text.matchAll(URL_RE)) {
    const full = match[0];
    const start = match.index ?? 0;
    const trimmed = trimTail(full);
    if (trimmed.length < 4) continue;
    const host = parseHost(trimmed);
    if (!host) continue;
    found.push({ raw: trimmed, start, end: start + trimmed.length, host });
  }
  return found;
}

export function extractPhones(text: string, blocked: readonly TextSpan[] = []): TextSpan[] {
  const found: TextSpan[] = [];
  for (const match of text.matchAll(PHONE_RE)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const end = start + raw.length;
    if (overlaps(start, end, blocked) || overlaps(start, end, found)) continue;
    found.push({ raw, start, end });
  }
  return found;
}

export function extractAccounts(
  text: string,
  blocked: readonly TextSpan[] = [],
): TextSpan[] {
  const found: TextSpan[] = [];
  for (const match of text.matchAll(ACCOUNT_RE)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const end = start + raw.length;
    if (overlaps(start, end, blocked) || overlaps(start, end, found)) continue;
    found.push({ raw, start, end });
  }
  return found;
}

export function blankSpans(text: string, spans: readonly TextSpan[]): string {
  const chars = text.split("");
  for (const span of spans) {
    const from = Math.max(0, span.start);
    const to = Math.min(chars.length, span.end);
    for (let i = from; i < to; i++) chars[i] = " ";
  }
  return chars.join("");
}

export function detectKinds(text: string): DetectedKinds {
  const links = extractLinks(text);
  const phones = extractPhones(text, links);
  const accounts = extractAccounts(text, [...links, ...phones]);
  const masked = blankSpans(text, [...links, ...phones, ...accounts]);
  return {
    link: links.length > 0,
    phone: phones.length > 0,
    account: accounts.length > 0,
    message: /[A-Za-z]{3,}/.test(masked),
  };
}
