# The four layers

The lecturer's order of priority shaped the design: **laws and identity first**, then the **security layer** (firewall, guard), then **AI and automation**. Inside each layer, solutions were ranked by **biggest impact, easiest, fastest and cheapest**. Each week a new solution was added and logged.

Running scenario: a hijacked Discord friend sends a malicious Minecraft mod (trust-chain phishing), alongside everyday Indonesian scam SMS (fake courier, fake bank OTP, fake prize). Two published cases — a BCA “transaction cancellation” phishing email (23 September 2024) and a J&T “damaged label / extra charge” iMessage reported by Detik (4 September 2025, about Rp 70 million lost) — are written up in [real-case-examples.md](real-case-examples.md), with a one-page visual at [img/real-case-example.png](img/real-case-example.png).

## L1 – Laws & habits

### Laws (Group 2's "laws and regulations" role)

- **Provider and admin duty of care.** UU ITE Pasal 15 requires every Electronic System Operator to run its system reliably and securely and makes it responsible for proper operation; Pasal 15(3) removes that only for force majeure or proven user fault. Pasal 16(1)(b) requires protecting the availability, integrity, authenticity, confidentiality and accessibility of electronic information. UU PDP Pasal 35 (technical-operational protection), Pasal 39 (prevent unauthorised access) and Pasal 47 (accountability) add the same duty for personal data. Return to Sender uses this as the basis for escalation: a first report with proof, a stronger complaint when the same account sends again, and parallel reports to IASC and Patroli Siber so the case is traced, not only logged.
- **Shared-responsibility liability (proposal).** Following Singapore's Shared Responsibility Framework (MAS + IMDA, in force since 16 Dec 2024), OJK and Komdigi would set baseline anti-phishing duties for banks, e-wallets and telcos (real-time fraud surveillance, cooling periods and notifications on risky changes, blocking unregistered SMS sender IDs and SMS with known malicious URLs). A provider that breaches a duty repays the victim. This moves defence from user-by-user to infrastructure level. Limit: the SRF excludes malware and victim-authorised transactions.
- **Earlier proposal ("better law").** AI-fraud penalties, AI media labelling, breach notification, and a UU PDP security baseline.

### Habits

- **Stop, Check, Report.** Stop: don't act inside the same chat. Check: look up the account number on Komdigi's CekRekening.id and confirm through another channel. Report: report to IASC (iasc.ojk.go.id or OJK 157), report the account on CekRekening.id, and report the hijacked account to the platform. Reporting speed decides how much money IASC can still block.
- **Call-back verification** and **official sources only** (from earlier weeks): confirm unusual requests through a second channel and only install mods or apps from official sources.

## L2 – Network

- **DNS filtering** of known phishing domains, plus a **gateway firewall** that drops direct-IP bypasses. Demonstrated in the lab: see [lab-results.md](lab-results.md).
- **VLAN** segmentation and an **AI-aware firewall with egress filtering** (earlier weeks) limit what an infected device can reach and send out.

## L3 – Accounts & apps

- **Passkeys** (phishing-resistant sign-in) and **session revoke** (kill stolen session tokens), from earlier weeks.
- **Leaked-password firewall** (SQL injection week): parameterized queries so databases don't leak, plus screening passwords against known breached lists (NIST SP 800-63B-4 requirement; Have I Been Pwned Pwned Passwords with k-anonymity).
- **Browser guard** (Project 2 week): enforce Chrome Enhanced Safe Browsing on managed browsers with the policy `SafeBrowsingProtectionLevel=2`.
- **Program firewall** (firewall week): application control / allowlisting (Windows Smart App Control at home, App Control for Business or AppLocker on managed PCs, following Australia's Essential Eight), so an unknown executable dropped by a fake mod cannot run. Limit: the Java stages of a malicious mod run inside the allowed Java runtime.

## L4 – Stop-Check-Report assistant

The web app in [`../app`](../app) puts the habit into a tool:

1. **Stop.** Paste the message instead of acting on it.
2. **Check.** On-device rule engine: link checks (known-bad demo list, lookalikes of Indonesian bank and shop domains, shorteners, unusual TLDs) and message tricks (impersonation, urgency, payment request, personal-data/OTP request) give a 0–100 score: Looks safe / Suspicious / Likely scam.
3. **Report.** An editable report summary and evidence checklist, and buttons that open IASC, CekRekening.id and Patroli Siber.
4. **Return to sender.** Save a known scam sender locally. If the same sender appears again, the app shows a **REPEAT** stamp (+36) and drafts a follow-up complaint to the provider (Gmail, Outlook, generic email, or phone operator/WhatsApp) citing the first report and the evidence.

Nothing is sent automatically, and nothing leaves the device.
