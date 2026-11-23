import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { analyzeText } from "./heuristic.ts";
import { SAMPLES } from "./samples.ts";
import {
  REPEAT_POINTS,
  applyKnownSenders,
  buildEscalationDraft,
  extractCandidates,
  findRepeat,
  identifySender,
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
  providerForSender,
  providerFormUrl,
  type KnownSenderRecord,
} from "./senders.ts";

const FIRST_REPORT = Date.parse("2026-11-01T08:00:00.000Z");

function sender(partial: Partial<KnownSenderRecord> & Pick<KnownSenderRecord, "key" | "kind" | "raw">): KnownSenderRecord {
  return {
    firstReportedAt: FIRST_REPORT,
    channels: ["sms"],
    note: "first report",
    ...partial,
  };
}

describe("sender normalization", () => {
  test("phone formats collapse to one key", () => {
    const dashed = normalizePhone("0812-3456-7890");
    const plus = normalizePhone("+62 812 3456 7890");
    const compact = normalizePhone("081234567890");
    const international = normalizePhone("6281234567890");
    assert.equal(dashed, "6281234567890");
    assert.equal(plus, dashed);
    assert.equal(compact, dashed);
    assert.equal(international, dashed);
    assert.equal(identifySender("0812-3456-7890")?.key, "phone:6281234567890");
  });

  test("email is lowercased and Gmail plus-tags are folded", () => {
    assert.equal(normalizeEmail("  Promo.Belanja+win@Gmail.com "), "promo.belanja@gmail.com");
    assert.equal(normalizeEmail("a+b@outlook.com"), "a+b@outlook.com");
    assert.equal(normalizeEmail("not an email"), null);
  });

  test("domains drop scheme, www, and path", () => {
    assert.equal(normalizeDomain("https://www.BCA-Aman.top/login"), "bca-aman.top");
    assert.equal(normalizeDomain("WWW.Bit.ly/jne-cek-paket"), "bit.ly");
    assert.equal(normalizeDomain("keamanan-bca@gmail.com"), null);
  });
});

describe("repeat matching", () => {
  const known = [
    sender({ kind: "phone", raw: "0812-3456-7890", key: "phone:6281234567890", channels: ["sms", "iasc"] }),
    sender({
      kind: "email",
      raw: "keamanan-bca@gmail.com",
      key: "email:keamanan-bca@gmail.com",
      firstReportedAt: FIRST_REPORT + 86_400_000,
      channels: ["email"],
    }),
  ];

  test("a later message with the same phone matches the first report", () => {
    const text = "Hubungi +62 812-3456-7890 hari ini.";
    const hit = findRepeat(text, known);
    assert.equal(hit?.key, "phone:6281234567890");
    assert.equal(hit?.firstReportedAt, FIRST_REPORT);
    assert.deepEqual(hit?.channels, ["sms", "iasc"]);
  });

  test("a different number is not a repeat", () => {
    assert.equal(findRepeat("Hubungi 0813-0000-1111.", known), null);
  });

  test("Gmail plus-tag matches the saved mailbox", () => {
    const hit = findRepeat("From: Keamanan-BCA+otp@gmail.com\n\nKirim kode OTP.", known);
    assert.equal(hit?.key, "email:keamanan-bca@gmail.com");
  });

  test("the earliest saved report wins when two identifiers match", () => {
    const text = "From: keamanan-bca@gmail.com Hubungi 0812-3456-7890";
    const hit = findRepeat(text, known);
    assert.equal(hit?.key, "phone:6281234567890");
  });

  test("candidates keep the phone, the address, and the link domain", () => {
    const keys = extractCandidates(
      "From: a@outlook.com Hubungi 0812-3456-7890 https://bca-aman.top/login",
    ).map((candidate) => candidate.key);
    assert.deepEqual(keys, ["phone:6281234567890", "email:a@outlook.com", "domain:bca-aman.top"]);
  });
});

describe("repeat score", () => {
  test("a saved sender adds 36 and can change the verdict", () => {
    const base = analyzeText("Hubungi 0812-3456-7890 ya.");
    assert.ok(base.score < 30);
    const next = applyKnownSenders(base, [
      sender({ kind: "phone", raw: "0812-3456-7890", key: "phone:6281234567890" }),
    ]);
    assert.equal(next.score, base.score + REPEAT_POINTS);
    assert.equal(next.breakdown.at(-1)?.id, "repeat");
    assert.equal(next.verdict, "suspicious");
    assert.equal(next.repeat?.raw, "0812-3456-7890");
  });

  test("the bonus is capped at 100 and is not applied twice", () => {
    const sample = SAMPLES.find((item) => item.id === "repeat");
    assert.ok(sample);
    const base = analyzeText(sample.text);
    assert.equal(base.score, sample.expectedScore);
    const once = applyKnownSenders(base, [
      sender({ kind: "phone", raw: "0812-3456-7890", key: "phone:6281234567890" }),
    ]);
    assert.equal(once.score, 100);
    assert.ok(once.uncapped > 100);
    const twice = applyKnownSenders(once, [
      sender({ kind: "phone", raw: "0812-3456-7890", key: "phone:6281234567890" }),
    ]);
    assert.equal(twice.score, 100);
    assert.equal(twice.breakdown.filter((part) => part.id === "repeat").length, 1);
  });

  test("no saved sender leaves the rule score unchanged", () => {
    const base = analyzeText(SAMPLES[0].text);
    const next = applyKnownSenders(base, []);
    assert.equal(next.score, base.score);
    assert.equal(next.repeat, null);
  });
});

describe("escalation template", () => {
  test("template follows the sender type", () => {
    assert.equal(providerForSender("email", "email:keamanan-bca@gmail.com"), "gmail");
    assert.equal(providerForSender("email", "email:undian.resmi@outlook.com"), "outlook");
    assert.equal(providerForSender("email", "email:billing@toko-palsu.example"), "generic-email");
    assert.equal(providerForSender("phone", "phone:6281234567890"), "phone");
    assert.equal(providerForSender("domain", "domain:bca-aman.top"), "generic-email");
    assert.equal(providerForSender("domain", "domain:gmail.com"), "gmail");
    assert.equal(providerFormUrl("gmail"), "https://support.google.com/mail/contact/abuse");
    assert.equal(providerFormUrl("phone"), null);
  });

  test("the draft names the first report date and the evidence, and says it was not sent", () => {
    const draft = buildEscalationDraft({
      provider: "phone",
      senderDisplay: "0812-3456-7890",
      reportedOn: "1 Nov 2026",
      channels: "SMS, IASC",
      note: "Package SMS with a short link.",
      message: "Hubungi 0812-3456-7890. Cek bit.ly/jne-cek-paket",
      language: "en",
    });
    assert.match(draft, /I already reported this sender on 1 Nov 2026/);
    assert.match(draft, /Why is it still active/);
    assert.match(draft, /bit\.ly\/jne-cek-paket/);
    assert.match(draft, /Package SMS with a short link/);
    assert.match(draft, /UU ITE/);
    assert.match(draft, /It was not sent/);
    assert.doesNotMatch(draft, /mailto:/);
  });
});
