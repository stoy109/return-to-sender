/** Shared result shape. An LLM analyzer can return the same structure later. */

export type Verdict = "safe" | "suspicious" | "likely_scam";

export type TrickCategory =
  | "impersonation"
  | "urgency"
  | "fake_link"
  | "payment_request"
  | "personal_data";

export type HighlightLevel = "suspicious" | "scam";

export type LinkFlag = "known_bad" | "lookalike" | "shortened" | "unusual_tld";

export interface Finding {
  id: string;
  category: TrickCategory;
  explanationId: string;
  /** Optional values for the translated explanation, such as a real domain. */
  params?: Record<string, string>;
  evidence: string;
  start: number;
  end: number;
  /** Weight of this sign. A category contributes only its strongest weight. */
  points: number;
  level: HighlightLevel;
}

export interface LinkCheck {
  raw: string;
  host: string;
  flags: LinkFlag[];
  lookalikeOf?: string;
  start: number;
  end: number;
  /**
   * Pasted links are never anchors. A flagged link must not be clickable,
   * and this demo does not make clean pasted links clickable either.
   */
  clickable: false;
}

export interface AccountCheck {
  number: string;
  start: number;
  end: number;
}

export interface PhoneCheck {
  number: string;
  start: number;
  end: number;
}

export type BreakdownId = TrickCategory | "combo" | "repeat";

export interface ScorePart {
  id: BreakdownId;
  points: number;
}

export interface DetectedKinds {
  link: boolean;
  account: boolean;
  phone: boolean;
  message: boolean;
}

export interface AnalysisResult {
  input: string;
  score: number;
  /** Sum before the 100 cap, so the breakdown can show that it was capped. */
  uncapped: number;
  verdict: Verdict;
  findings: Finding[];
  links: LinkCheck[];
  accounts: AccountCheck[];
  phones: PhoneCheck[];
  detected: DetectedKinds;
  breakdown: ScorePart[];
  /** Set when a saved sender identifier appears again. Absent on older saved checks. */
  repeat?: RepeatMatch | null;
}

export type SenderKind = "email" | "phone" | "domain";

export type ReportChannel =
  | "sms"
  | "whatsapp"
  | "email"
  | "call"
  | "iasc"
  | "cekrekening"
  | "police"
  | "provider";

export interface RepeatMatch {
  key: string;
  kind: SenderKind;
  raw: string;
  firstReportedAt: number;
  channels: ReportChannel[];
  note: string;
}

export interface Analyzer {
  readonly id: string;
  analyze(input: string, signal?: AbortSignal): Promise<AnalysisResult>;
}
