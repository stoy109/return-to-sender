# Return to Sender — Week 12 Progress Script

Group 2 · Network Security · President University · Mon 16 Nov 2026 · Lecturer: Sir Tjong Wan Sen

Speakers: **Casey** slides 1–2 · **Alfa** slides 3–6 · **Ferisca** slides 7–9 · target ~6 minutes.

## Slide 1 — Title  ·  Casey (~24 s)

Good afternoon, Sir, and everyone. We are Group 2: I'm Casey, with Alfa and Ferisca. Our project is Return to Sender, a layered defense against phishing and scams: laws and habits, the network, accounts and apps, and a Stop-Check-Report assistant. This is our week 12 progress. Today we show what changed after your feedback, and the second version of our assistant.

## Slide 2 — What Sir said last week  ·  Casey (~46 s)

Last week, Sir, you gave us clear feedback. First, the name. Return to Sender does not mean sending the scam back to the scammer. It means reporting it to the authority. Second, save known scammer accounts. Third, if the same sender comes back, escalate to the provider's admin, for example Gmail, with proof. You reminded us that every infrastructure admin has a duty to secure it, and that reports should force them to trace the sender. Reports should also go to IASC and the cybercrime police. And you said: nobody can be anonymous if ID and regulation are set properly. Your verdict was that we are on track, so this week we built exactly these points.

## Slide 3 — What we built (MVP v2)  ·  Alfa (~49 s)

This is MVP version two. First, the home screen now explains the name: we hand the scam to the people who should stop it, not reply to the scammer. Second, a Known senders list. It is saved on the device in localStorage, and you can export it as JSON. Third, when a message comes from a saved sender, the app adds a REPEAT stamp, which adds 36 to the score, capped at 100. Fourth, a Write a follow-up button. It makes a complaint draft for Gmail, Outlook, a generic email, or the phone operator and WhatsApp, and it cites the first report date and the evidence. Finally, buttons open IASC, CekRekening and Patroli Siber. Nothing is sent automatically; the user submits it.

## Slide 4 — Demo flow  ·  Alfa (~40 s)

Here is the demo flow. The number 0812-3456-7890 is a fictional sample. It is already in Known senders from a first package SMS on 9 November. Now a second JNE SMS arrives from the same number. On its own, this text scores 74, likely scam. Because the sender is already on the list, the REPEAT stamp pushes it to 100. Then the user taps Write a follow-up and gets this draft to the phone operator and WhatsApp: I already reported this sender on 9 November, here is the evidence, why is it still active? The user copies it and submits it.

## Slide 5 — Layer 2 proof: block it before the click  ·  Alfa (~35 s)

This is Layer 2, the network layer. On 16 November we ran a Containerlab lab on Fedora with Podman. Four nodes: a victim PC, a DNS filter, a gateway firewall, and a static fake JNE DEMO page — no forms, no credentials. The demo domain is jne-paket-tertunda.example. With the filter off, DNS returns 10.10.2.66 and the page opens with HTTP 200. With the filter on, DNS answers NXDOMAIN, curl by name cannot resolve the host, and curl to the IP times out after five seconds, because the gateway drops traffic to 10.10.2.66.

## Slide 6 — What the 16 Nov capture shows  ·  Alfa (~30 s)

Here is a summary of that capture, not a raw pcap export. Packets 6 to 38, filter off: DNS answers with the A record, then GET slash, then HTTP 1.1 200 OK. Packets 39 to 57, filter on: DNS says no such name, and we only see SYN retransmissions to the IP — the handshake never completes. So the phishing page is blocked before the click. This is a lab only. A real deployment would be an ISP or campus DNS filter, plus a TrustPositif-style blocklist.

## Slide 7 — Law angle  ·  Ferisca (~52 s)

This is the law angle, which is our group's role. Our point is the provider's duty of care. Under UU ITE Articles 15 and 16, electronic system operators must run their systems reliably and securely, and they are responsible for them. Under UU PDP, Law 27 of 2022, Articles 35, 39 and 47, the data controller must secure personal data, prevent unauthorized access, and is accountable. So a documented repeat report changes the story from "we didn't know" to "you were told". We also have a policy idea: institutions can require Chrome Enhanced Safe Browsing through the policy SafeBrowsingProtectionLevel equals 2. Google says Enhanced Protection users are phished 20 to 35 percent less. But more browsing data goes to Google, so under UU PDP the institution needs a privacy notice.

## Slide 8 — Numbers  ·  Ferisca (~28 s)

Now the numbers. We have 57 automated tests passing, up from 41. Here are sample scores. The package SMS scores 74, likely scam. The fake bank OTP and the fake bank email both score 100. An everyday note scores 0, looks safe. The prize SMS and the fake prize email score 52, suspicious. And the same sender's second text goes from 74 to 100 once the sender is saved.

## Slide 9 — Next steps & Q&A  ·  Ferisca (~25 s)

This week we also finished the Layer 2 lab. Next steps: in week 13 we add AI scam-message scoring and test it on real scam samples, with personal details redacted. As you asked, Sir, we will also collect a real example scam email. Then we show the full demo in sessions 14 and 15. Thank you, Sir. We are happy to take your questions and feedback.

---

Links on slides: IASC https://iasc.ojk.go.id/ · CekRekening https://cekrekening.id/ · Patroli Siber https://patrolisiber.id/

Source (Enhanced Safe Browsing 20–35% less phishing, slide 7): https://security.googleblog.com/2022/12/enhanced-protection-strongest-level-of.html

Demo number 0812-3456-7890 is a fictional sample, not a real sender.

Layer 2 lab (slides 5–6): Containerlab on Fedora/Podman, 16 Nov 2026 ~15:30 WIB. The packet rows are a stylized summary of that capture, not a raw pcap export.
