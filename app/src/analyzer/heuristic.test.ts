import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { domainToASCII } from "node:url";
import { annotate } from "./annotate.ts";
import { analyzeText } from "./heuristic.ts";
import { createAnalyzer } from "./index.ts";
import { assessHost } from "./lookalike.ts";
import { punycodeDecode } from "./punycode.ts";
import { SAMPLES } from "./samples.ts";
import type { Finding, TrickCategory, Verdict } from "./types.ts";
import { verdictForScore } from "./score.ts";

function categories(findings: readonly Finding[]): Set<TrickCategory> {
  return new Set(findings.map((finding) => finding.category));
}

describe("score thresholds", () => {
  const cases: Array<[number, Verdict]> = [
    [0, "safe"],
    [29, "safe"],
    [30, "suspicious"],
    [69, "suspicious"],
    [70, "likely_scam"],
    [100, "likely_scam"],
  ];

  for (const [score, verdict] of cases) {
    test(`${score} is ${verdict}`, () => {
      assert.equal(verdictForScore(score), verdict);
    });
  }
});

describe("trick categories", () => {
  test("impersonation names a trusted organisation", () => {
    const result = analyzeText("Pesan dari BCA untuk nasabah.");
    assert.ok(categories(result.findings).has("impersonation"));
    assert.equal(result.breakdown.find((part) => part.id === "impersonation")?.points, 18);
    assert.equal(result.score, 18);
    assert.equal(result.verdict, "safe");
  });

  test("urgency on its own stays under the suspicious line", () => {
    const result = analyzeText("This is urgent. Act now.");
    assert.ok(categories(result.findings).has("urgency"));
    assert.equal(result.breakdown.find((part) => part.id === "urgency")?.points, 14);
    assert.equal(result.score, 14);
    assert.equal(result.verdict, "safe");
  });

  test("repeated urgency phrases are counted once", () => {
    const result = analyzeText("Segera, ini urgent, act now, hari ini, jangan abaikan.");
    const urgency = result.findings.filter((finding) => finding.category === "urgency");
    assert.equal(urgency.length, 1);
    assert.equal(result.breakdown.find((part) => part.id === "urgency")?.points, 14);
    assert.equal(result.score, 14);
  });

  test("a payment ask is its own category", () => {
    const result = analyzeText("Tolong transfer ya.");
    assert.ok(categories(result.findings).has("payment_request"));
    assert.equal(result.score, 16);
    assert.equal(result.verdict, "safe");
  });

  test("a prize with no payment ask scores lower", () => {
    const result = analyzeText("Anda mendapat hadiah.");
    assert.equal(result.breakdown.find((part) => part.id === "payment_request")?.points, 10);
    assert.equal(result.verdict, "safe");
  });

  test("asking for an OTP is a personal-data request", () => {
    const result = analyzeText("Kirim kode OTP sekarang.");
    assert.ok(result.findings.some((finding) => finding.explanationId === "data.otp_request"));
    assert.equal(result.findings.filter((finding) => finding.category === "personal_data").length, 1);
    assert.equal(result.breakdown.find((part) => part.id === "personal_data")?.points, 34);
    assert.equal(result.score, 34);
    assert.equal(result.verdict, "suspicious");
  });

  test("a normal bank OTP text is not labelled likely scam", () => {
    const result = analyzeText(
      "BCA: Kode OTP Anda 839201. Jangan berikan kode ini kepada siapa pun.",
    );
    assert.equal(result.findings.some((finding) => finding.explanationId === "data.otp_request"), false);
    assert.ok(categories(result.findings).has("impersonation"));
    assert.ok(categories(result.findings).has("personal_data"));
    assert.equal(result.verdict, "suspicious");
    assert.ok(result.score < 70);
    assert.equal(result.score, 38);
  });

  test("two tricks together cross into suspicious", () => {
    const result = analyzeText("Tolong transfer hari ini.");
    assert.equal(result.breakdown.find((part) => part.id === "combo")?.points, 4);
    assert.equal(result.score, 34);
    assert.equal(result.verdict, "suspicious");
  });

  test("fake link is a trick category", () => {
    const result = analyzeText("Cek bit.ly/abcde");
    assert.ok(categories(result.findings).has("fake_link"));
    assert.deepEqual(result.links[0]?.flags, ["shortened"]);
    assert.equal(result.score, 14);
    assert.equal(result.verdict, "safe");
  });

  test("an English scam message reaches likely scam", () => {
    const result = analyzeText(
      "URGENT: your BCA account is suspended. Send your OTP now to https://bca-secure-login.xyz",
    );
    assert.ok(categories(result.findings).has("impersonation"));
    assert.ok(categories(result.findings).has("urgency"));
    assert.ok(categories(result.findings).has("personal_data"));
    assert.ok(categories(result.findings).has("fake_link"));
    assert.equal(result.score, 100);
    assert.ok(result.uncapped > 100);
    assert.equal(result.verdict, "likely_scam");
  });
});

describe("link checks", () => {
  test("a real bank domain is not flagged", () => {
    const result = analyzeText("https://www.bca.co.id/id/personal");
    assert.equal(result.links.length, 1);
    assert.deepEqual(result.links[0]?.flags, []);
    assert.equal(result.links[0]?.lookalikeOf, undefined);
    assert.equal(result.score, 0);
    assert.equal(result.verdict, "safe");
  });

  test("bit.ly is a short link and not an unusual TLD", () => {
    const assessed = assessHost("bit.ly");
    assert.deepEqual(assessed.flags, ["shortened"]);
  });

  test("a lookalike plus an unusual TLD", () => {
    const assessed = assessHost("bca-aman.top");
    assert.equal(assessed.lookalikeOf, "bca.co.id");
    assert.deepEqual(assessed.flags, ["lookalike", "unusual_tld"]);
    assert.equal(assessed.points, 40);
  });

  test("a glued short brand with a bait word", () => {
    const assessed = assessHost("bcabank.xyz");
    assert.equal(assessed.lookalikeOf, "bca.co.id");
    assert.ok(assessed.flags.includes("lookalike"));
    assert.ok(assessed.flags.includes("unusual_tld"));
  });

  test("homoglyph digits", () => {
    const assessed = assessHost("bc4.co.id");
    assert.equal(assessed.lookalikeOf, "bca.co.id");
    assert.deepEqual(assessed.flags, ["lookalike"]);
  });

  test("punycode homoglyph of bca.co.id", () => {
    assert.equal(punycodeDecode("bcher-kva"), "bücher");
    const unicode = "bc\u0430.co.id";
    const ascii = domainToASCII(unicode);
    assert.ok(ascii.startsWith("xn--"));
    const fromAscii = assessHost(ascii);
    const fromUnicode = analyzeText(`cek https://${unicode}/login`);
    assert.equal(fromAscii.lookalikeOf, "bca.co.id");
    assert.equal(fromUnicode.links[0]?.lookalikeOf, "bca.co.id");
    assert.equal(fromUnicode.links[0]?.clickable, false);
  });

  test("a protected domain buried in a longer host", () => {
    const assessed = assessHost("bca.co.id.secure-login.xyz");
    assert.equal(assessed.lookalikeOf, "bca.co.id");
    assert.ok(assessed.flags.includes("unusual_tld"));
  });

  test("a subdomain of the real site is not a lookalike", () => {
    const assessed = assessHost("login.bca.co.id");
    assert.deepEqual(assessed.flags, []);
  });

  test("ordinary sites and words are not lookalikes", () => {
    assert.deepEqual(assessHost("example.com").flags, []);
    assert.deepEqual(assessHost("bridge.com").flags, []);
    assert.deepEqual(assessHost("www.bankmandiri.co.id").flags, []);
  });

  test("an unusual TLD on its own is a small flag", () => {
    const result = analyzeText("https://nota.xyz/a");
    assert.deepEqual(result.links[0]?.flags, ["unusual_tld"]);
    assert.equal(result.score, 10);
    assert.equal(result.verdict, "safe");
  });

  test("a known-bad demo domain is likely scam on its own", () => {
    const result = analyzeText("https://bca-secure-login.xyz/login");
    const flags = result.links[0]?.flags ?? [];
    assert.ok(flags.includes("known_bad"));
    assert.ok(flags.includes("lookalike"));
    assert.ok(flags.includes("unusual_tld"));
    assert.equal(result.links[0]?.lookalikeOf, "bca.co.id");
    assert.equal(result.links[0]?.clickable, false);
    assert.ok(result.score >= 70);
    assert.equal(result.verdict, "likely_scam");
  });

  test("pasted links are never marked clickable", () => {
    const result = analyzeText("https://www.bca.co.id and https://bca-aman.top and bit.ly/x");
    assert.ok(result.links.length >= 3);
    for (const link of result.links) assert.equal(link.clickable, false);
  });
});

describe("numbers", () => {
  test("a mobile number is a phone, not an account", () => {
    const result = analyzeText("Hubungi 0812-3456-7890 atau 081234567890.");
    assert.equal(result.phones.length, 2);
    assert.deepEqual(result.accounts, []);
    assert.equal(result.detected.phone, true);
    assert.equal(result.detected.account, false);
  });

  test("a 12-digit account is not treated as a phone", () => {
    const result = analyzeText("Rekening 539201847362");
    assert.deepEqual(
      result.accounts.map((account) => account.number),
      ["539201847362"],
    );
    assert.equal(result.phones.length, 0);
  });
});

describe("class samples", () => {
  for (const sample of SAMPLES) {
    test(`${sample.id} is ${sample.expectedVerdict} (${sample.expectedScore})`, () => {
      const result = analyzeText(sample.text);
      if (result.score !== sample.expectedScore || result.verdict !== sample.expectedVerdict) {
        console.log(
          sample.id,
          result.score,
          result.verdict,
          result.breakdown,
          result.findings.map((finding) => [finding.category, finding.points, finding.evidence]),
          result.links,
          result.phones,
          result.accounts,
        );
      }
      assert.equal(result.verdict, sample.expectedVerdict);
      assert.equal(result.score, sample.expectedScore);
      assert.ok(result.score >= 0 && result.score <= 100);
    });
  }

  test("the package SMS exposes a short link and a phone", () => {
    const result = analyzeText(SAMPLES[0].text);
    assert.equal(result.links[0]?.raw, "bit.ly/jne-cek-paket");
    assert.deepEqual(result.links[0]?.flags, ["shortened"]);
    assert.equal(result.phones[0]?.number, "0812-3456-7890");
    assert.equal(result.detected.link, true);
    assert.equal(result.detected.phone, true);
    assert.equal(result.detected.message, true);
  });

  test("the bank WhatsApp exposes a lookalike and an account", () => {
    const result = analyzeText(SAMPLES[1].text);
    assert.equal(result.links[0]?.lookalikeOf, "bca.co.id");
    assert.ok(result.links[0]?.flags.includes("unusual_tld"));
    assert.deepEqual(
      result.accounts.map((account) => account.number),
      ["539201847362"],
    );
    assert.ok(result.findings.some((finding) => finding.explanationId === "data.otp_request"));
  });

  test("the safe note has no findings", () => {
    const result = analyzeText(SAMPLES[2].text);
    assert.deepEqual(result.findings, []);
    assert.deepEqual(result.links, []);
    assert.equal(result.detected.message, true);
    assert.equal(result.detected.link, false);
  });
});

describe("highlights", () => {
  test("overlapping tricks keep the stronger style and both numbers", () => {
    const findings: Finding[] = [
      {
        id: "f1",
        category: "impersonation",
        explanationId: "imp.courier",
        evidence: "Paket Anda tertahan",
        start: 0,
        end: 6,
        points: 18,
        level: "suspicious",
      },
      {
        id: "f2",
        category: "urgency",
        explanationId: "urg.pressure",
        evidence: "tertahan",
        start: 4,
        end: 8,
        points: 14,
        level: "scam",
      },
    ];
    const segments = annotate("aaaaBBBB", findings);
    assert.equal(segments[0]?.level, "suspicious");
    assert.deepEqual(segments[0]?.findingIds, ["f1"]);
    assert.equal(segments[1]?.level, "scam");
    assert.deepEqual(segments[1]?.findingIds, ["f1", "f2"]);
    assert.deepEqual(segments[2]?.findingIds, ["f2"]);
  });
});

describe("analyzer interface", () => {
  test("the heuristic analyzer resolves the same result", async () => {
    const analyzer = createAnalyzer("heuristic");
    const result = await analyzer.analyze("Pesan dari BCA.");
    assert.equal(analyzer.id, "heuristic");
    assert.equal(result.verdict, "safe");
  });

  test("the LLM analyzer is only a stub", async () => {
    const analyzer = createAnalyzer("llm");
    await assert.rejects(() => analyzer.analyze("hello"), /LLM_ANALYZER_NOT_CONFIGURED/);
  });

  test("empty input scores zero", () => {
    const result = analyzeText("");
    assert.equal(result.score, 0);
    assert.equal(result.verdict, "safe");
    assert.equal(result.detected.message, false);
  });
});
