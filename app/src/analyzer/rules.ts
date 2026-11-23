import type { HighlightLevel, TrickCategory } from "./types.ts";

export interface TextRule {
  id: string;
  category: Exclude<TrickCategory, "fake_link">;
  source: string;
  points: number;
  level: HighlightLevel;
  explanationId: string;
}

/**
 * Keyword and phrase list, English and Indonesian.
 * Points are the category weight of that sign. The scorer keeps the strongest
 * weight in each category, so extra matches highlight the text without adding
 * the same trick twice.
 */
export const TEXT_RULES: readonly TextRule[] = [
  {
    id: "imp.brand",
    category: "impersonation",
    source:
      String.raw`\b(?:bca|bni|bri|btn|tokopedia|shopee|bukalapak|lazada|blibli|gojek|jne|j&t|jnt|sicepat|anteraja|ojk|dukcapil|bpjs|telkomsel|whatsapp|instagram|cimb|livin'?|mybca|linkaja|jenius|bsi)\b|\bbank\s+mandiri\b|\bpos\s+indonesia\b|\bpihak\s+bank\b`,
    points: 18,
    level: "scam",
    explanationId: "imp.brand",
  },
  {
    id: "imp.courier",
    category: "impersonation",
    source: String.raw`paket\s+anda\s+tertahan`,
    points: 18,
    level: "scam",
    explanationId: "imp.courier",
  },
  {
    id: "urg.pressure",
    category: "urgency",
    source:
      String.raw`\bsegera\b|\bmendesak\b|\bjangan\s+abaikan\b|\bsekarang\s+juga\b|\bbatas\s+waktu\b|\bhari\s+ini\b|\bhangus\b|\btertahan\b|\bdiblokir\b|\bdibekukan\b|\bterkunci\b|\bakan\s+dikembalikan\b|\bdalam\s+\d+\s*(?:jam|menit|hari)\b|\b1x24\s*jam\b|\burgent(?:ly)?\b|\bimmediately\b|\bact\s+now\b|\bright\s+now\b|\blimited\s+time\b|\blast\s+chance\b|\bfinal\s+notice\b|\baction\s+required\b|\bexpires?\b|\bsuspended\b|\bwithin\s+\d+\s*hours?\b`,
    points: 14,
    level: "suspicious",
    explanationId: "urg.pressure",
  },
  {
    id: "pay.transfer",
    category: "payment_request",
    source:
      String.raw`\btransfer\b|\bbayar\b|\bnomor\s+rekening\b|\bno\.?\s*rek(?:ening)?\b|\brekening\b|\bongkir\b|\bbiaya\s+admin\b|\bkirim(?:kan)?\s+uang\b|\bpembayaran\b|\bkode\s+bayar\b|\bpay\s+now\b|\bsend\s+money\b|\bpayment\b|\bwire\b|\binvoice\b`,
    points: 16,
    level: "scam",
    explanationId: "pay.transfer",
  },
  {
    id: "pay.prize",
    category: "payment_request",
    source: String.raw`\bhadiah\b|\bklaim\b|\bprize\b|\bvoucher\b|\bpencairan\b`,
    points: 10,
    level: "suspicious",
    explanationId: "pay.prize",
  },
  {
    id: "data.request",
    category: "personal_data",
    source:
      String.raw`(?<!\bjangan\s)\bkirim(?:kan)?\s+kode(?:\s+otp)?\b|(?<!\bjangan\s)\bkirim(?:kan)?\s+otp\b|(?<!\bjangan\s)\bkirim(?:kan)?\s+pin\b|(?<!\bjangan\s)\bkirim(?:kan)?\s+(?:password|kata\s+sandi)\b|\bsend\s+(?:me\s+|us\s+)?(?:the\s+|your\s+)?(?:otp|code|pin|password)\b|\bshare\s+(?:your\s+)?(?:otp|code|pin|password)\b|(?<!\bjangan\s)\bberitahu(?:kan)?\s+kode\b|(?<!\bjangan\s)\bberikan\s+kode\b|\bmasukkan\s+(?:kode\s+)?otp\b`,
    points: 34,
    level: "scam",
    explanationId: "data.otp_request",
  },
  {
    id: "data.mention",
    category: "personal_data",
    source:
      String.raw`\botp\b|\bkode\s+verifikasi\b|\bone-time\s+password\b|\bverification\s+code\b|\bpin\b|\bpassword\b|\bkata\s+sandi\b|\bktp\b|\bnik\b|\bcvv\b|\bnomor\s+kartu\b|\bkartu\s+kredit\b|\bnama\s+ibu\s+kandung\b`,
    points: 16,
    level: "suspicious",
    explanationId: "data.otp_mention",
  },
];

export interface RuleHit {
  rule: TextRule;
  start: number;
  end: number;
  evidence: string;
}

export function matchRules(text: string): RuleHit[] {
  const hits: RuleHit[] = [];
  for (const rule of TEXT_RULES) {
    const re = new RegExp(rule.source, "gi");
    for (const match of text.matchAll(re)) {
      const raw = match[0];
      if (!raw) continue;
      const start = match.index ?? 0;
      hits.push({
        rule,
        start,
        end: start + raw.length,
        evidence: raw.replace(/\s+/g, " ").trim(),
      });
    }
  }
  return hits;
}
