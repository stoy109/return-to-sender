import { GMAIL_ABUSE_URL, MICROSOFT_ABUSE_URL } from "../official.ts";
import { extractLinks, extractPhones } from "./extract.ts";
import { splitHost } from "./lookalike.ts";
import { toUnicodeHost } from "./punycode.ts";
import { verdictForScore } from "./score.ts";
import type { AnalysisResult, RepeatMatch, ReportChannel, SenderKind } from "./types.ts";

/** Added once when a saved sender shows up again. Documented in the README. */
export const REPEAT_POINTS = 36;

export type ProviderKind = "gmail" | "outlook" | "generic-email" | "phone";

export interface SenderCandidate {
  kind: SenderKind;
  raw: string;
  key: string;
}

export interface KnownSenderRecord {
  key: string;
  kind: SenderKind;
  raw: string;
  firstReportedAt: number;
  channels: ReportChannel[];
  note: string;
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

const GMAIL_HOSTS = new Set(["gmail.com", "googlemail.com"]);
const OUTLOOK_HOSTS = new Set(["outlook.com", "hotmail.com", "live.com", "msn.com"]);

export function normalizeEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase().replace(/^[<("']+|[>),.;]+$/g, "");
  const match = trimmed.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/);
  if (!match) return null;
  const [local, host] = trimmed.split("@");
  if (!local || !host) return null;
  const bareLocal = GMAIL_HOSTS.has(host) ? (local.split("+")[0] ?? local) : local;
  if (!bareLocal) return null;
  return `${bareLocal}@${host}`;
}

export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  if (!digits.startsWith("628")) return null;
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

export function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase().replace(/^[<("']+|[>),.;]+$/g, "");
  if (!trimmed || trimmed.includes("@")) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let host = "";
  try {
    host = new URL(withScheme).hostname;
  } catch {
    host = trimmed.split("/")[0] ?? "";
  }
  host = toUnicodeHost(host.replace(/\.$/, ""));
  if (!host.includes(".")) return null;
  const registrable = splitHost(host).registrable;
  if (!registrable.includes(".")) return null;
  return registrable;
}

export function identifySender(raw: string): SenderCandidate | null {
  const email = normalizeEmail(raw);
  if (email) return { kind: "email", raw: email, key: `email:${email}` };
  const phone = normalizePhone(raw);
  if (phone) return { kind: "phone", raw: raw.trim(), key: `phone:${phone}` };
  const domain = normalizeDomain(raw);
  if (domain) return { kind: "domain", raw: domain, key: `domain:${domain}` };
  return null;
}

export function extractCandidates(text: string): SenderCandidate[] {
  const found: SenderCandidate[] = [];
  const seen = new Set<string>();
  const push = (candidate: SenderCandidate | null) => {
    if (!candidate || seen.has(candidate.key)) return;
    seen.add(candidate.key);
    found.push(candidate);
  };
  for (const phone of extractPhones(text)) push(identifySender(phone.raw));
  const masked = text.split("");
  for (const match of text.matchAll(EMAIL_RE)) {
    push(identifySender(match[0]));
    const start = match.index ?? 0;
    for (let i = start; i < start + match[0].length && i < masked.length; i++) masked[i] = " ";
  }
  for (const link of extractLinks(masked.join(""))) {
    const domain = normalizeDomain(link.host);
    if (domain) push({ kind: "domain", raw: domain, key: `domain:${domain}` });
  }
  return found;
}

export function findRepeat(text: string, known: readonly KnownSenderRecord[]): RepeatMatch | null {
  const keys = new Set(extractCandidates(text).map((candidate) => candidate.key));
  const hits = known.filter((sender) => keys.has(sender.key));
  if (hits.length === 0) return null;
  const earliest = [...hits].sort((a, b) => a.firstReportedAt - b.firstReportedAt)[0];
  if (!earliest) return null;
  return {
    key: earliest.key,
    kind: earliest.kind,
    raw: earliest.raw,
    firstReportedAt: earliest.firstReportedAt,
    channels: earliest.channels,
    note: earliest.note,
  };
}

/** Recompute the score from the rule breakdown, then add the repeat bonus at most once. */
export function applyKnownSenders(
  result: AnalysisResult,
  known: readonly KnownSenderRecord[],
): AnalysisResult {
  const baseBreakdown = result.breakdown.filter((part) => part.id !== "repeat");
  const baseUncapped = baseBreakdown.reduce((sum, part) => sum + part.points, 0);
  const repeat = findRepeat(result.input, known);
  if (!repeat) {
    const score = Math.max(0, Math.min(100, baseUncapped));
    return {
      ...result,
      breakdown: baseBreakdown,
      uncapped: baseUncapped,
      score,
      verdict: verdictForScore(score),
      repeat: null,
    };
  }
  const uncapped = baseUncapped + REPEAT_POINTS;
  const score = Math.max(0, Math.min(100, uncapped));
  return {
    ...result,
    breakdown: [...baseBreakdown, { id: "repeat", points: REPEAT_POINTS }],
    uncapped,
    score,
    verdict: verdictForScore(score),
    repeat,
  };
}

export function providerForSender(kind: SenderKind, key: string): ProviderKind {
  if (kind === "phone" || key.startsWith("phone:")) return "phone";
  const value = key.includes(":") ? key.slice(key.indexOf(":") + 1) : key;
  const host = value.includes("@") ? (value.split("@")[1] ?? "") : value;
  if (GMAIL_HOSTS.has(host)) return "gmail";
  if (OUTLOOK_HOSTS.has(host)) return "outlook";
  return "generic-email";
}

export function providerFormUrl(provider: ProviderKind): string | null {
  if (provider === "gmail") return GMAIL_ABUSE_URL;
  if (provider === "outlook") return MICROSOFT_ABUSE_URL;
  return null;
}

export function buildEscalationDraft(input: {
  provider: ProviderKind;
  senderDisplay: string;
  reportedOn: string;
  channels: string;
  note: string;
  message: string;
  language: "en" | "id";
}): string {
  const who: Record<ProviderKind, { en: string; id: string }> = {
    gmail: {
      en: "To Google's abuse team (Gmail)",
      id: "Kepada tim penyalahgunaan Google (Gmail)",
    },
    outlook: {
      en: "To Microsoft's abuse team (Outlook / Hotmail)",
      id: "Kepada tim penyalahgunaan Microsoft (Outlook / Hotmail)",
    },
    "generic-email": {
      en: "To the email provider's abuse team",
      id: "Kepada tim penyalahgunaan penyedia email",
    },
    phone: {
      en: "To the phone operator and WhatsApp",
      id: "Kepada operator seluler dan WhatsApp",
    },
  };
  if (input.language === "id") {
    return [
      who[input.provider].id,
      "",
      `Saya sudah melaporkan pengirim ini pada ${input.reportedOn}. Ini buktinya. Mengapa akun ini masih aktif?`,
      "",
      `Pengirim: ${input.senderDisplay}`,
      `Kanal laporan sebelumnya: ${input.channels || "tidak tercatat"}`,
      `Catatan laporan pertama: ${input.note || "—"}`,
      "",
      "Pesan terbaru:",
      input.message,
      "",
      "Saya tidak meminta Anda membalas penipu. Saya meminta penyedia layanan menelusuri akun ini dan menghentikan pemakaiannya untuk penipuan. Berdasarkan UU ITE dan UU PDP, penyelenggara sistem elektronik wajib menjaga keamanan sistem dan melindungi data pribadi. Laporan ulang yang tercatat adalah permintaan agar pengirim dilacak dan jalurnya ditutup.",
      "",
      "Draf ini dibuat di perangkat oleh Return to Sender. Teks ini tidak dikirim.",
    ].join("\n");
  }
  return [
    who[input.provider].en,
    "",
    `I already reported this sender on ${input.reportedOn}. Here is the evidence. Why is it still active?`,
    "",
    `Sender: ${input.senderDisplay}`,
    `Earlier report channel(s): ${input.channels || "not recorded"}`,
    `First-report note: ${input.note || "—"}`,
    "",
    "Latest message:",
    input.message,
    "",
    "I am not asking you to reply to the scammer. I am asking the provider to trace this account and stop it being used for fraud. Under Indonesia's UU ITE and UU PDP, electronic-system operators have a duty to keep their systems secure and to protect personal data. A documented repeat report is a request that you trace the sender and close the infrastructure.",
    "",
    "This draft was prepared on-device by Return to Sender. It was not sent.",
  ].join("\n");
}
