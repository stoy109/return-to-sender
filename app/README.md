# Return to Sender

Stop. Check. Report.

Return to Sender is a student project for the Network Security course at President University, Indonesia (Group 2). It is a small **Stop–Check–Report** assistant for phishing and scam messages.

Paste a suspicious message, link, bank account number, or phone number. The app:

1. Checks links against a built-in known-bad list, lookalikes of common Indonesian bank and shop domains, shorteners, and unusual top-level domains.
2. Reads the message for scam tricks (impersonation, urgency, a fake link, a payment request, a personal-data or OTP request) and gives a 0–100 risk score.
3. For a likely scam, prepares an editable report summary and an evidence checklist. **You** submit that report. The app does not send it.

The check runs entirely in the browser. Nothing is uploaded.

> Automated check. It can be wrong. Return to Sender is a student project and is not affiliated with OJK, IASC or Komdigi.

## Run it

```bash
npm i
npm run dev
```

Open the URL Vite prints (this project uses port **4317**). English is the default. Use **EN | ID** to switch to Bahasa Indonesia.

Other commands:

```bash
npm test          # analyzer unit tests
npm run build     # typecheck and production build
npm run preview   # serve the production build
```

No API key and no backend are required.

## What you can do

- Paste a message. Outline chips show whether the text contains a link, account number, phone number, or message. **Check it** stays off until there are at least 3 characters.
- **Try an example** loads a labelled demo (a held-package SMS, a fake bank OTP, an everyday note, and a prize that asks for a transfer).
- Read the verdict stamp, the score, the highlighted tricks, and the reason list. A highlighted phrase scrolls to its explanation.
- Pasted links are plain text with **Copy**. They are never turned into links you can click.
- An account number gets **Check on CekRekening.id**, which opens the official Komdigi site in a new tab. The app does not check the number.
- A phone number is shown as text only.
- **Prepare report** (or **Prepare a report anyway** when the verdict is only Suspicious) opens an editable summary, an evidence checklist, and a link to IASC.
- History stays in `localStorage` on this device. Turn **Save history** off to stop recording new checks. Delete one row, or **Clear all** after a confirmation.

## How the score works

The demo analyzer is a transparent rule engine in `src/analyzer/`. Each trick type contributes its **strongest** matching sign once. Marks in the text can repeat; the points do not.

| Trick | Points | What sets it off |
| --- | --- | --- |
| Impersonation | 18 | A bank, courier, shop, or agency name, or the “paket Anda tertahan” pattern |
| Urgency | 14 | Deadlines, “segera”, “diblokir”, “hangus”, “urgent”, “suspended”, and similar pressure |
| Payment request | 16 or 10 | 16 for transfer, bayar, ongkir, rekening, or a fee. 10 for a prize, voucher, or “klaim” with no payment ask |
| Personal data | 34 or 16 | 34 if it asks you to send an OTP, PIN, or password. 16 if it only mentions a code or ID number. “Jangan berikan kode” is not treated as a request |
| Fake link | up to 80 | The worst link in the message. See the link table |

Link flags add up, then stop at 80:

| Flag | Points |
| --- | --- |
| On the known-bad list | 70 |
| Lookalike of a protected domain | 30 |
| Shortened link (destination hidden) | 14 |
| New / unusual TLD | 10 (not added again when the link is already a shortener) |

If several different trick types appear, a combination bonus is added: **+4** for two, **+8** for three, **+12** for four or more. The total is capped at 100.

If the sender matches someone already saved on this device, **+36** is added (Known sender, seen again) and a red **Repeat** stamp is shown. That bonus is applied after the rule score, from the local known-sender list, and it is still capped at 100. The class sample “Same sender, second text” scores **74** on its own and **100** once the fictional first report is on the list.

| Score | Verdict |
| --- | --- |
| 0–29 | Looks safe |
| 30–69 | Suspicious |
| 70–100 | Likely scam |

The class samples land like this:

| Example | Score | Verdict |
| --- | --- | --- |
| Package held at the warehouse (bit.ly) | 74 | Likely scam |
| Fake bank OTP (`bca-aman.top` plus an account number) | 100 | Likely scam |
| Everyday campus note | 0 | Looks safe |
| Prize that asks for a transfer | 52 | Suspicious |

Lookalikes use a homoglyph fold (for example `0`→`o`, `4`→`a`, and common Cyrillic lookalikes), then exact tokens, a small edit distance on longer names, and glued words such as `bcabank`. A real host such as `www.bca.co.id` is not flagged. A real name stuffed into another domain, such as `bca.co.id.secure-login.xyz`, is.

The known-bad list in `src/analyzer/lists.ts` is a short set of **fictional demo domains**, not a live blocklist.

Suspicious highlights are yellow. Scam-level highlights use a red tint and a red underline. There is no green in the interface.

## What the name means

Return to Sender means handing the scam back to the people who are supposed to stop it: the provider, IASC/OJK, and the cyber police. It does not mean replying to the scammer, or attacking them.

## Known senders and a repeat report

After a check you can save the sender (email, phone, or domain). The list stays in `localStorage`, with the date, the channels you used, and a short note. You can delete one row or export JSON. Nothing is uploaded.

A later message from that sender shows a **Repeat** banner with the first-report date and raises the score by 36. **Write a follow-up** builds a complaint you copy yourself: Gmail, Outlook, a generic email provider, or the phone operator and WhatsApp. The draft says you already reported them, attaches the evidence as text, and asks why the sender is still active. Buttons only open [IASC](https://iasc.ojk.go.id/), [CekRekening.id](https://cekrekening.id/), [Patroli Siber](https://patrolisiber.id/) (Polri), and, for Gmail or Outlook, the provider’s own abuse form. The app does not submit any of them.

Providers and operators have a duty to secure their systems and protect personal data under UU ITE and UU PDP. A documented repeat report is a push for them to trace the sender.

## Plugging in another analyzer

`Analyzer` in `src/analyzer/types.ts` is the seam:

```ts
interface Analyzer {
  readonly id: string;
  analyze(input: string, signal?: AbortSignal): Promise<AnalysisResult>;
}
```

`createAnalyzer("heuristic")` is what the page uses. `createAnalyzer("llm")` returns `LlmAnalyzer`, which rejects with `LLM_ANALYZER_NOT_CONFIGURED`. To add a model later, implement `analyze` so it returns the same `AnalysisResult`, and change the helper line under the box. Today that line says **“Stays on this device. Nothing is sent.”** That sentence is true only while the check stays in the browser. If text leaves the device, the sentence has to change.

## Official links

These were checked against the organisations’ own pages before they were hard-coded:

- **IASC (OJK):** <https://iasc.ojk.go.id/> — OJK states that reports to the Indonesia Anti-Scam Centre are made on this site (OJK notice, 28 March 2025, and later OJK press releases).
- **CekRekening.id:** <https://cekrekening.id/> — the Komdigi public-service portal names this as the official account-check site.

The account button does not put the number in the URL. The report button does not post the summary.

## Limits

- The engine matches keywords and patterns in English and Indonesian. It does not understand intent. A real bank OTP text can score **Suspicious** because it names a bank and mentions a code. It should not reach **Likely scam** unless it also asks you to send the code, pushes a payment, or includes a bad link.
- “Mandiri” by itself is a normal Indonesian word, so only “bank mandiri” is treated as the bank. “Dana” and “grab” are not treated as brands in the message text; their domains are still protected against lookalikes.
- Short links are not opened. The destination stays unknown on purpose.
- The bad-domain list is a class fixture. A domain that is not on it can still be a scam.
- Lookalike detection misses some clones and can flag a name that only resembles a brand.
- Account numbers are 10–16 digit runs that are not phone numbers. The app never asks Komdigi whether one is reported.
- History is local only. Clearing the browser’s site data clears it. There is no account and no server.
- This is not legal advice and not a report to OJK. If you lost money, contact your bank’s official call centre and submit the report yourself at IASC.

## Two-minute demo

0:00 — Open the app. Read **Stop / Check / Report** and the line under the box: nothing is sent. Toggle **EN | ID** once, then leave it on the language you will present in.

0:20 — Press **Try an example**. The held-package SMS fills in and is labelled **Example**. Point at the chips (link, phone, message). Press **Check it** and let the three steps tick: links, message, score.

0:45 — The stamp says **Likely scam**. Show one yellow urgency mark and one red impersonation mark, then the reason list. In **Checks**, show that `bit.ly/...` is text plus **Copy**, not a link, and that the phone number has no button.

1:05 — Switch to the fake bank OTP example and check it. Show **Lookalike of bca.co.id**, the unusual TLD, and **Check on CekRekening.id**. Say out loud that the button only opens Komdigi’s site.

1:25 — Press **Prepare report**. The summary is editable. Tick one evidence row. Press **Copy summary**. Then **Go to IASC (OJK)** — you submit it; the app does not.

1:45 — Open **History** (the side column on a laptop, the clock icon on a phone). The check is still on this device. Mention **Clear all** asks first. If there is time, load the everyday note (Looks safe) and the prize example (Suspicious, around 52).

2:00 — Close on the disclaimer: automated, can be wrong, a President University project, not affiliated with OJK, IASC, or Komdigi.
