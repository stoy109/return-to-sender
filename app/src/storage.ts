import type { KnownSenderRecord } from "./analyzer/senders.ts";
import type { AnalysisResult, ReportChannel, SenderKind, Verdict } from "./analyzer/types.ts";
import type { Lang } from "./i18n.tsx";

export const EVIDENCE_IDS = ["screenshot", "sender", "receipt", "chat", "links", "identity"] as const;
export type EvidenceId = (typeof EVIDENCE_IDS)[number];

export type Channel = "" | "sms" | "whatsapp" | "email" | "call";

export interface ReportDraft {
  receivedAt: string;
  channel: Channel;
  sender: string;
  message: string;
  links: string;
  accounts: string;
  happened: string;
  losses: string;
  evidence: Record<EvidenceId, boolean>;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  input: string;
  score: number;
  verdict: Verdict;
  result: AnalysisResult;
  report?: ReportDraft;
}

const HISTORY_KEY = "rts.history";
const LANG_KEY = "rts.lang";
const SAVE_KEY = "rts.save";
const SENDERS_KEY = "rts.senders";

export interface KnownSender extends KnownSenderRecord {
  id: string;
}

const CHANNELS = new Set<ReportChannel>([
  "sms",
  "whatsapp",
  "email",
  "call",
  "iasc",
  "cekrekening",
  "police",
  "provider",
]);

const KINDS = new Set<SenderKind>(["email", "phone", "domain"]);

function emptyEvidence(): Record<EvidenceId, boolean> {
  return {
    screenshot: false,
    sender: false,
    receipt: false,
    chat: false,
    links: false,
    identity: false,
  };
}

export function draftFrom(result: AnalysisResult, existing?: ReportDraft): ReportDraft {
  if (existing) return existing;
  return {
    receivedAt: "",
    channel: "",
    sender: result.phones[0]?.number ?? "",
    message: result.input,
    links: result.links.map((link) => link.raw).join("\n"),
    accounts: result.accounts.map((account) => account.number).join("\n"),
    happened: "",
    losses: "",
    evidence: emptyEvidence(),
  };
}

export function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "id" ? "id" : "en";
  } catch {
    return "en";
  }
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode */
  }
}

export function loadSavePref(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveSavePref(on: boolean): void {
  try {
    localStorage.setItem(SAVE_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<HistoryEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.createdAt === "number" &&
    typeof entry.input === "string" &&
    typeof entry.score === "number" &&
    (entry.verdict === "safe" || entry.verdict === "suspicious" || entry.verdict === "likely_scam") &&
    !!entry.result &&
    typeof entry.result === "object"
  );
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { entries?: unknown };
    if (!parsed || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(isEntry).slice(0, 50);
  } catch {
    return [];
  }
}

function isSender(value: unknown): value is KnownSender {
  if (!value || typeof value !== "object") return false;
  const sender = value as Partial<KnownSender>;
  return (
    typeof sender.id === "string" &&
    typeof sender.key === "string" &&
    typeof sender.raw === "string" &&
    typeof sender.note === "string" &&
    typeof sender.firstReportedAt === "number" &&
    !!sender.kind &&
    KINDS.has(sender.kind) &&
    Array.isArray(sender.channels) &&
    sender.channels.every((channel) => CHANNELS.has(channel))
  );
}

export function loadKnownSenders(): KnownSender[] {
  try {
    const raw = localStorage.getItem(SENDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { senders?: unknown };
    if (!parsed || !Array.isArray(parsed.senders)) return [];
    return parsed.senders.filter(isSender).slice(0, 100);
  } catch {
    return [];
  }
}

export function saveKnownSenders(senders: KnownSender[]): void {
  try {
    localStorage.setItem(SENDERS_KEY, JSON.stringify({ v: 1, senders: senders.slice(0, 100) }));
  } catch {
    /* keep the list in memory */
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  const payload = JSON.stringify({ v: 1, entries: entries.slice(0, 50) });
  try {
    localStorage.setItem(HISTORY_KEY, payload);
  } catch {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ v: 1, entries: entries.slice(0, 15) }));
    } catch {
      /* keep the list in memory */
    }
  }
}
