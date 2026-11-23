# Return to Sender — real, publicly documented scam examples

These two cases are for the concrete-example gap in the Group 2 final report. They are **not** from a personal inbox. Every quotation and figure below is taken from a named source. Nothing in the message boxes was invented or “reconstructed.”

URLs were checked with WebFetch on **23 November 2026 (WIB)**. Komdigi hoax pages and the IASC portal (`iasc.ojk.go.id`) returned 403 or empty shells, so they are **not** used as primary sources. Dates are given as the source printed them; times that the source marked as WIB are left in that zone.

| Pick | Type | Why it is in the report |
| --- | --- | --- |
| **1. BCA “transaction cancellation” email** | **Email** (the format the lecturer asked for) | Official BCA warning, 23 September 2024, describing a live email lure that harvests card data and OTP. BCA did **not** publish a verbatim transcript. |
| **2. J&T “damaged label / extra charge” lure** | **iMessage** (Apple Messages — not email, not WhatsApp) | Detik, 4–5 September 2025, with the victim’s own wording, a reported loss of about Rp 70 million, and a later official J&T campaign. This is the closest published match to our `jne-paket-tertunda.example` lab. |

A related official WhatsApp/APK courier warning (Polri and CNN, December 2022; still flagged by Pusiknas Bareskrim on 21 March 2025) is noted after Case 2. It is a separate, well-documented modus, not the same incident.

---

## Case 1 — BCA “transaction cancellation” phishing email

**Title:** Fake BCA Customer Service email claims the credit card is being misused and offers a link to “block” it.

**Type:** Email.

### Sources

| Source | Publication date | URL | WebFetch |
| --- | --- | --- | --- |
| PT Bank Central Asia Tbk, official “Awas Modus” page (Indonesian) | 23 September 2024 (date in the official URL path `/2024/09/23/03/00/…`) | https://www.bca.co.id/id/informasi/awas-modus/2024/09/23/03/00/waspada-penipuan-email-pembatalan-transaksi-yang-mengatasnamakan-bca | Loaded, 23 Nov 2026 |
| Same page, English edition | Same URL date | https://www.bca.co.id/en/informasi/awas-modus/2024/09/23/03/00/waspada-penipuan-email-pembatalan-transaksi-yang-mengatasnamakan-bca | Loaded, 23 Nov 2026 |
| Medcom.id, reprint of the BCA warning | 23 September 2024, 20:00 (WIB not labelled, Indonesian outlet) | https://www.medcom.id/ekonomi/bisnis/yNLB8ovk-waspada-penipuan-e-mail-pembatalan-transaksi-bca-begini-cara-menghindarinya | Loaded, 23 Nov 2026 |

BCA’s accompanying photograph is a posed “HOAX” illustration, not a readable screenshot of the email, so no body text was taken from the image.

### The message as published

BCA describes the **format and steps** of the email. It does **not** print a full verbatim body, subject line, or sender address. The box below is that official description, not a fabricated transcript.

> **Channel:** email, from an account that is made to look like official BCA mail. BCA says the sender uses a profile picture that “sepintas seperti resmi dari BCA” and “nama akun yang mirip sekali dengan email BCA.” Official BCA mail, the bank says, ends in `@bca.co.id` or `@klikbca.com`. Lookalike or masked senders are a warning sign.
>
> **Claim:** the writer, posing as BCA Customer Service, “menjelaskan adanya penyalahgunaan kartu kredit milik nasabah” — that the customer’s credit card is being misused or used by someone unauthorised.
>
> **Call to action:** the email “menyarankan pada korban untuk melakukan sanggahan atau blokir kartu” and includes “link sanggahan/pemblokiran kartu.”
>
> **After the click:** the link opens “e-form yang menyerupai situs resmi BCA.” The victim is asked for the credit-card number, expiry date, and CVV, then to copy an SMS OTP into the form and press KIRIM.

Defanged link: none was published. Treat any “block your BCA card” URL that is not opened from the official myBCA or BCA mobile app as `hxxp://[lookalike-BCA-form]/`.

### Modus

1. Impersonate BCA in the sender name and profile picture.
2. Create urgency with a claim that the credit card is being abused.
3. Offer a “helpful” block/dispute link so the email does not look as if it is asking for secrets up front.
4. On the fake form, collect card number, expiry, CVV, then the SMS OTP, which BCA says is then used to break into the card.

BCA’s own wording for the last step: “Kode OTP yang merupakan kode otentikasi sebuah transaksi yang seharusnya rahasia, malah diberikan ke si pelaku. Yang terjadi adalah, kartu kredit milik korban baru saja dibobol si pelaku!”

### Impact as reported

BCA and Medcom describe the modus as something “yang sedang terjadi.” They do **not** publish a victim count or a rupiah loss for this specific email campaign. No figure is invented here. The harm BCA does state is that a completed OTP handover means the card “baru saja dibobol.”

### Red flags

- Sender looks like BCA but is not `@bca.co.id` or `@klikbca.com` (BCA: often “mirip” or “di-masking”).
- Urgency and panic: a claim that the card is already being misused (BCA calls this social engineering).
- A link in the email to “sanggahan/pemblokiran,” instead of the official myBCA or BCA mobile app, or Halo BCA **1500888**.
- The landing page asks for card number, expiry, CVV, and OTP. BCA: “Customer Service BCA tidak pernah meminta data pribadi kepada nasabah lewat sarana apapun.”

---

## Case 2 — J&T “damaged label / extra charge” iMessage phishing

**Title:** Unknown iMessage says a courier package label is damaged, demands a 24-hour address update via a link, then a small “extra charge” — reported loss about Rp 70 million.

**Type:** iMessage (Apple Messages). This is **not** an email and **not** a WhatsApp thread. It is included because the published wording, the courier lure, and the loss figure are clearer than any phishing-email transcript we could verify, and because it matches the project’s paket / fake-courier-site scenario.

### Sources

| Source | Publication date | URL | WebFetch |
| --- | --- | --- | --- |
| Detik Inet, Alfi Kholisdinuka, “Solusi Menangkal Jebakan Phishing Pengiriman Barang: Cek, Curiga, Cancel” | Kamis, 4 September 2025, 19:45 WIB | https://inet.detik.com/security/d-8096567/solusi-menangkal-jebakan-phishing-pengiriman-barang-cek-curiga-cancel | Loaded, 23 Nov 2026 |
| Detik Inet, Moch Prima Fauzi, “Waspada Penipuan Modus Pengiriman Barang, Bagaimana Cara Mencegahnya?” | Jumat, 5 September 2025, 20:53 WIB | https://inet.detik.com/security/d-8098252/waspada-penipuan-modus-pengiriman-barang-bagaimana-cara-mencegahnya | Loaded, 23 Nov 2026 |
| J&T Express Indonesia, official “Cek, Curiga, and Cancel” campaign release | Release time 19 November 2025 (time zone not stated on the page) | https://jet.co.id/news/news?show=228 | Loaded, 23 Nov 2026 |

The victim, actress Asmara Abigail, told the story on YouTube channel RJL5 (Fajar Aditya). The quotations below are the ones **Detik printed**, not a re-transcription of the video. She later appeared in J&T’s 3C education campaign. Her name is used here because she and J&T made the case public. No phone number was published; Detik only says the iMessage number was from the Philippines.

### The message as published

No full screenshot transcript was printed. What follows is the victim’s description, quoted or closely paraphrased from Detik (4 September 2025), with nothing added.

> **Channel:** iMessage, from a number she did not know. She later said the number was from the Philippines.
>
> **Claim:** the package label was damaged, so the location / address could not be read. Her words, as printed by Detik: “dia bilang paket bermasalah, alamatnya rusak, tidak terbaca jelas, tentu dengan penulisan yang sangat profesional.”
>
> **Urgency and link:** she was asked to confirm the address **within 24 hours**, online, through an embedded link: “Aku dipandu untuk klik link itu untuk memperbaharui alamat.”
>
> **The fee:** “Kemudian aku mesti bayar extra charge 9.000 sekian rupiah, yang kita pikir 9.000 sekian rupiah bukan nominal yang besar.”
>
> **What the page did next** (same Detik article, her words): “Ternyata tiap kali melakukan pembayaran, di page nya itu dia bilang selalu gagal, transaksi gagal, aku coba sampe 5x, ternyata transaksinya sukses semua, dan ternyata nominalnya SAR, Riyal, dan kalau di total kerugian nominal finansial yang hilang dari account aku yang ke charge, itu sekitar Rp 70 juta.”
>
> On 5 September 2025 Detik added that she had entered credit-card data on a site that looked like the official courier site, and restated the loss as about Rp 70 juta from the card.

Defanged link: the articles do not print the phishing URL. In our lab the same class of lure is represented as `hxxp://jne-paket-tertunda[.]example/`.

### Modus

1. Time the lure to a real shipment (the package was actually in transit with J&T).
2. Contact the recipient off-channel (iMessage, unknown foreign number), with formal wording, claiming the label is damaged.
3. Impose a 24-hour deadline and a link to “update the address.”
4. Present a lookalike courier page and a small extra fee (about Rp 9,000) to lower suspicion.
5. Show a fake “transaction failed” result so the victim retries; charges actually go through in SAR (Saudi riyal).

J&T later showed her CCTV and the transit record. Detik (4 September 2025) quotes her: “Jadi nggak ada paketnya tuh nyangkut, alamatnya tidak terbaca, itu tuh kebohongan.” J&T’s 19 November 2025 release says the company “never requests personal information or payments outside of official channels,” and lists typical misuses of its name: fake WhatsApp or SMS delivery messages, imitation websites, and refund or extra-fee QR-code scams.

### Impact as reported

- Victim’s figure, printed by Detik on 4 and 5 September 2025: about **Rp 70 juta**, after five payment attempts that the page called failures, charged in **SAR**.
- The package itself was never stuck; J&T confirmed it was moving normally to Takengon.
- Do **not** attach IASC’s national totals or Polri’s general fraud-case counts to this one incident. Those figures, where we cite them at all, are background only.

### Red flags

- A large courier contacting the customer by **iMessage** from an unknown, later **Philippines**, number — not the official J&T channels (hotline **021-80661888**, official website, Instagram `@jntexpressid`).
- “Professional” wording plus a **24-hour** deadline.
- A link to “update the address” instead of checking the receipt number on the official site or at an outlet.
- An unexpected “extra charge” of “9.000 sekian rupiah.”
- A lookalike payment page that reports failure while charges succeed, in a foreign currency (SAR, not IDR).

---

## Related official warning — WhatsApp “LIHAT Foto Paket” APK (separate modus)

This is **not** Case 2 and **not** a second incident of the same event. It is the official record of the WhatsApp / fake-resi APK lure that our project also discusses.

In December 2022, messages impersonating a J&T courier circulated on WhatsApp with an attachment titled **“LIHAT Foto Paket”** whose real extension was **`.apk`**, not a photo. CNN Indonesia (6 December 2022, 10:12 WIB, https://www.cnnindonesia.com/teknologi/20221206094446-192-883374/viral-penipuan-modus-kurir-kirim-foto-bisa-bobol-data-mobile-banking — loaded 23 Nov 2026) reported that a victim who installed the file later found their **BRIMO** balance gone, while saying they had not opened another app or typed a user ID or password on another site. J&T’s official Instagram `@jntexpressid`, as quoted by CNN (post dated Saturday, 19 November 2022 in that article), said: “Sprinter J&T Express TIDAK PERNAH meminta J&T Friends untuk mengunduh aplikasi melalui Whatsapp atau chat. Aplikasi resmi kami hanya ada di App Store dan Play Store.” CNN also quoted BRI’s official account `@kontakBRI` warning customers not to click or install courier APK files.

The same filename and APK extension were repeated by Polri’s Tribratanews on 8 December 2022, 12:38 WIB (https://tribratanews.polri.go.id/blog/none-22/masyarakat-diminta-waspadai-pesan-whatsapp-pengiriman-paket-j-t-express-52240 — loaded 23 Nov 2026), which, citing Kominfo, described the file as an exploit / RAT aimed at data that can reach mobile banking. A kabupaten CSIRT republished the hoax notice on 7 December 2022 (https://csirt.bulelengkab.go.id/konten/detail/pesan-whatsapp-pengiriman-paket-mengatasnamakan-j-t-express — loaded 23 Nov 2026).

The modus was still being warned about in 2025. Pusiknas Bareskrim Polri, 21 March 2025 (https://pusiknas.polri.go.id/detail_artikel/waspada_penipuan_berkedok_pesan_%E2%80%98salah_kirim_paket%E2%80%99 — loaded 23 Nov 2026), described WhatsApp messages from a supposed courier who “salah kirim paket,” sends an **APK** file called a “resi,” and tempts the victim to scan a barcode that is “jebakan untuk menguras saldo rekening korban yang sering disebut dengan phishing.” Official bodies, Pusiknas says, will never ask for personal data, account numbers, OTP, or PIN.

Alleged malware-author names and personal sites that appeared in later CNN coverage (7 December 2022) are omitted here.

---

## How Return to Sender handles it

Apply the same four layers to both cases (and to the WhatsApp APK variant).

### L1 — Stop, Check, Report

- **Stop.** Do not click the “block card” or “update address” link, do not install a “foto paket” / “resi” APK, do not type card data, OTP, PIN, or passwords, and do not retry a payment that the page calls a failure.
- **Check** on a channel you already trust, not the one that just contacted you. For BCA: myBCA, BCA mobile, or Halo BCA **1500888**. For J&T: official site or call centre **021-80661888**, or an outlet with the real receipt number. This is the same idea as J&T’s later 3C campaign (Cek, Curiga, Cancel) and as BCA’s “jangan panik / kenali email resmi.”
- **Report** even if no money has moved yet:
  - **IASC** (Indonesia Anti-Scam Centre, OJK) for financial-transaction scams. Detik (4 September 2025) treats IASC as the national reporting channel and cites its 2025 volumes; the portal is publicly given as `https://iasc.ojk.go.id/`. WebFetch received **403 Forbidden** for that host on 23 November 2026, so the URL is recorded here as the commonly cited official address, not as a page we re-read this turn.
  - **Patroli Siber, Polri:** https://www.patrolisiber.id/submit-report (loaded 23 Nov 2026). Submit a chronology, any identifier for the sender, and screenshots.
  - The **provider or operator abuse desk**: Halo BCA 1500888 / haloBCA for the bank email; J&T 021-80661888 or the official Instagram for a courier lure; the victim’s own bank immediately if a card or BRIMO-style balance was hit (CNN quotes BRI’s `@kontakBRI` on the APK variant).
  - **CekRekening** (Komdigi): https://cekrekening.id/lapor (loaded 23 Nov 2026), to report a destination bank or e-wallet account used in the fraud, with conversation and transfer evidence.

### L2 — DNS filter and firewall blocklist (our lab)

Case 2 is the lab in the real world: a lookalike courier page behind an urgent “paket bermasalah” story. In `rts-lab` / `rts-gns3`, a name in the style of `jne-paket-tertunda.example` is answered **NXDOMAIN** when the DNS filter is on, and the phishing host (`10.10.2.66` in the lab) is **DROP**ped on the gateway, so even a direct-IP attempt times out. That is what we captured on 23 November 2026: filter OFF → DNS A plus HTTP 200; filter ON → NXDOMAIN plus unanswered SYNs, and no packets on the gw↔phish link.

A published phishing URL for the Asmara incident was not printed, so we cannot claim that exact host is in a public blocklist. The control is the same: put confirmed courier-phishing domains and their IPs on the DNS filter and the firewall, then keep the list updated from IASC, Patroli Siber, operator notices, and our own reports.

The BCA email is the same pattern on a bank lookalike form: if the landing host is known, L2 stops the click from resolving or connecting. It does not fix a lookalike sender address by itself.

### L3 — Passkeys, session revoke, app control

- **Passkeys** stop a stolen password from being enough, which matters after a fake login page (less so for a raw card+OTP form, which is why L1 and L2 still come first).
- **Session revoke** and card or account block via the official app or call centre, immediately, if a link was opened or data was typed — the step BCA already asks customers to take through myBCA / Halo BCA, and the step a BRIMO or card victim needs after an APK or a fake payment page.
- **App control** (the “program firewall”) is the specific control for the WhatsApp “LIHAT Foto Paket” APK: an unsigned or unapproved sideload should not run. Official J&T and bank apps come only from the App Store or Play Store.

### L4 — MVP: risk score, known senders, REPEAT stamp, follow-up complaint draft

On a reported message (email, and the same fields if the team later ingests SMS/WA/iMessage metadata):

- **Risk score** rises for lookalike bank or courier senders, urgency (“24 jam,” “blokir sekarang”), unexpected attachments (`.apk` labelled as a photo or resi), and payment or “address update” links.
- **Known senders** would not treat a masked BCA lookalike, or an unknown Philippines iMessage number, as Halo BCA or J&T official.
- **REPEAT stamp** if the same lure (damaged label, extra Rp 9,000-class fee, “LIHAT Foto Paket” APK, “block your card” form) is seen again.
- **Follow-up complaint draft** pre-fills the L1 report for IASC, Patroli Siber, CekRekening, and the operator abuse desk, so the victim is not starting from a blank page after a shock loss.

---

## Three-line version (to say aloud)

1. For the concrete example we used a published case, not a made-up inbox: in September 2025 Detik reported that Asmara Abigail got an iMessage, not from official J&T, saying her package label was damaged and she had 24 hours to update the address via a link, then pay an “extra charge” of about Rp 9,000.
2. The page kept saying the payment had failed; she tried five times; the charges actually went through in Saudi riyal, and she lost about Rp 70 million — J&T later showed the package had never been stuck.
3. Return to Sender would stop at that first check and official call-back, block the lure domain at DNS and the firewall the way our lab turns `jne-paket-tertunda.example` into NXDOMAIN plus DROP, and if a click already happened, revoke the session, lock the card, and file with IASC, Patroli Siber, the operator, and CekRekening.

*(If the lecturer specifically wants an email: BCA’s official warning of 23 September 2024 describes a fake Customer Service email about a misused credit card, with a “block your card” link that asks for the card number, CVV, and OTP. BCA did not publish the full wording, which is why we lead with the Detik courier case.)*

---

## Slide

A one-page visual of Case 2 is at [`img/real-case-example.png`](img/real-case-example.png), labelled “Real case — reported by Detik, 4 September 2025.”
