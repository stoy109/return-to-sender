# Return to Sender — Week 12 Progress Script

Group 2 · Network Security · President University · Mon 16 Nov 2026 · Lecturer: Sir Tjong Wan Sen

Speakers: **Casey** slides 1–2 · **Alfa** slides 3–6 · **Ferisca** slides 7–10 · target ~7 minutes.

## Slide 1 — Title  ·  Casey (~24 s)

Good afternoon, Sir, and everyone. We are Group 2: I'm Casey, with Alfa and Ferisca. Our project is Return to Sender, a layered defense against phishing and scams: laws and habits, the network, accounts and apps, and a Stop-Check-Report assistant. This is our week 12 progress. Today we show what changed after your feedback, and the second version of our assistant.

## Slide 2 — What Sir said last week  ·  Casey (~46 s)

Last week, Sir, you gave us clear feedback. First, the name. Return to Sender does not mean sending the scam back to the scammer. It means reporting it to the authority. Second, save known scammer accounts. Third, if the same sender comes back, escalate to the provider's admin, for example Gmail, with proof. You reminded us that every infrastructure admin has a duty to secure it, and that reports should force them to trace the sender. Reports should also go to IASC and the cybercrime police. And you said: nobody can be anonymous if ID and regulation are set properly. Your verdict was that we are on track, so this week we built exactly these points.

## Slide 3 — What we built (MVP v2)  ·  Alfa (~49 s)

This is MVP version two. First, the home screen now explains the name: we hand the scam to the people who should stop it, not reply to the scammer. Second, a Known senders list. It is saved on the device in localStorage, and you can export it as JSON. Third, when a message comes from a saved sender, the app adds a REPEAT stamp, which adds 36 to the score, capped at 100. Fourth, a Write a follow-up button. It makes a complaint draft for Gmail, Outlook, a generic email, or the phone operator and WhatsApp, and it cites the first report date and the evidence. Finally, buttons open IASC, CekRekening and Patroli Siber. Nothing is sent automatically; the user submits it.

## Slide 4 — Demo flow  ·  Alfa (~40 s)

Here is the demo flow. The number 0812-3456-7890 is a fictional sample. It is already in Known senders from a first package SMS on 9 November. Now a second JNE SMS arrives from the same number. On its own, this text scores 74, likely scam. Because the sender is already on the list, the REPEAT stamp pushes it to 100. Then the user taps Write a follow-up and gets this draft to the phone operator and WhatsApp: I already reported this sender on 9 November, here is the evidence, why is it still active? The user copies it and submits it.

## Slide 5 — Layer 2 proof: block it before the click (GNS3)  ·  Alfa (~44 s)

This is Layer 2, the network layer. On 23 November we verified it in GNS3 on Fedora, with the Docker nodes running on Podman. On the canvas you see the victim, a Linux bridge switch, a dnsmasq DNS filter, the gateway with iptables, and a static fake JNE page marked DEMO — no forms, no credentials. The demo domain is jne-paket-tertunda.example. With the filter off, DNS returns 10.10.2.66 and the page opens with HTTP 200. With the filter on, DNS answers NXDOMAIN, and because the gateway drops traffic to 10.10.2.66, curl to the IP times out after five seconds. Our first prototype, in Containerlab on 16 November, gave the same result.

## Slide 6 — What the 23 Nov capture shows  ·  Alfa (~45 s)

These are the real Wireshark captures from that run, with the MAC addresses masked. On the left is the link between the victim and the switch. Filter off: the DNS A answer, then HTTP 1.1 200 OK. Filter on: DNS says no such name, and all that is left are SYN retransmissions to 10.10.2.66 that nobody answers. On the right is the link between the gateway and the phishing server. With the filter off, the HTTP session reaches it. With the filter on, nothing from the victim arrives — the DROP rule works. This is a lab only; a real deployment would be an ISP or campus DNS filter with a TrustPositif-style blocklist.

## Slide 7 — Law angle  ·  Ferisca (~52 s)

This is the law angle, which is our group's role. Our point is the provider's duty of care. Under UU ITE Articles 15 and 16, electronic system operators must run their systems reliably and securely, and they are responsible for them. Under UU PDP, Law 27 of 2022, Articles 35, 39 and 47, the data controller must secure personal data, prevent unauthorized access, and is accountable. So a documented repeat report changes the story from "we didn't know" to "you were told". We also have a policy idea: institutions can require Chrome Enhanced Safe Browsing through the policy SafeBrowsingProtectionLevel equals 2. Google says Enhanced Protection users are phished 20 to 35 percent less. But more browsing data goes to Google, so under UU PDP the institution needs a privacy notice.

## Slide 8 — Numbers  ·  Ferisca (~28 s)

Now the numbers. We have 57 automated tests passing, up from 41. Here are sample scores. The package SMS scores 74, likely scam. The fake bank OTP and the fake bank email both score 100. An everyday note scores 0, looks safe. The prize SMS and the fake prize email score 52, suspicious. And the same sender's second text goes from 74 to 100 once the sender is saved.

## Slide 9 — Real-world cases  ·  Ferisca (~60 s)

Sir, you asked for a real example, so here are two published cases, not from our own inbox. First, an email. On 23 September 2024, BCA warned about a fake Customer Service email saying the customer's credit card is being misused, with a link to block it. The form looks like BCA and asks for the card number, expiry date, CVV, and then the SMS OTP. BCA says its customer service never asks for personal data, through any channel. Second, on 4 September 2025 Detik reported an iMessage saying a J&T package label was damaged: update the address within 24 hours, and pay an extra charge of about 9,000 rupiah. The page kept saying the payment failed. The victim tried five times, and every charge went through in Saudi riyal — about 70 million rupiah lost. The package was never stuck. Our lab domain models exactly this kind of lure.

## Slide 10 — Next steps & Q&A  ·  Ferisca (~31 s)

So, this week MVP v2 is done, the Layer 2 GNS3 lab is done, and we collected real example cases. The app is also live as a web app on Cloudflare Workers, at return-to-sender.r-pinontoan19.workers.dev. Next, in week 13 we add AI scam-message scoring and test it on real scam samples, with personal details redacted. Then we show the full demo in sessions 14 and 15. Thank you, Sir. We are happy to take your questions and feedback.

---

Links on slides: IASC https://iasc.ojk.go.id/ · CekRekening https://cekrekening.id/ · Patroli Siber https://patrolisiber.id/

Source (Enhanced Safe Browsing 20–35% less phishing, slide 7): https://security.googleblog.com/2022/12/enhanced-protection-strongest-level-of.html

Demo number 0812-3456-7890 is a fictional sample, not a real sender.

Layer 2 lab (slides 5–6): GNS3 2.2.61 with the Docker nodes on Podman (Fedora), verified 23 Nov 2026 ~14:56 WIB with ./scripts/demo.sh; Wireshark captures ~15:00 WIB on the victim↔sw-lan and gw↔phish links (display filter `dns || http || tcp.flags.syn==1`). MAC addresses and the hostname were masked before the screenshots went into the repo; the raw pcap is not published. First prototype: Containerlab, 16 Nov 2026 ~15:30 WIB, same result. Details: rts-repo docs/lab-results.md.

Real-world cases (slide 9): Case 1 — BCA, “Awas Modus”, 23 Sep 2024: https://www.bca.co.id/id/informasi/awas-modus/2024/09/23/03/00/waspada-penipuan-email-pembatalan-transaksi-yang-mengatasnamakan-bca (BCA did not publish the verbatim email body). Case 2 — Detik Inet, 4 Sep 2025, 19:45 WIB: https://inet.detik.com/security/d-8096567/solusi-menangkal-jebakan-phishing-pengiriman-barang-cek-curiga-cancel (channel is iMessage, not email; loss about Rp 70 juta as reported by the victim). Full notes: final-project/real-case-examples.md.

Web app (slide 10): https://return-to-sender.r-pinontoan19.workers.dev (Cloudflare Workers).
