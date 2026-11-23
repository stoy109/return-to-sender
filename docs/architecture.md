# Architecture

Return to Sender is a **defence in depth** design: each layer catches what the one before it misses, and the last layer makes sure a scam that still gets through is handed back to the party responsible for stopping it.

```
 Scam message / link / mod file
            │
            ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ L1  Laws & habits                                           │
 │     UU ITE Pasal 15–16, UU PDP Pasal 35/39/47 duties,        │
 │     shared-responsibility proposal (Singapore SRF model),    │
 │     Stop-Check-Report habit                                  │
 └─────────────────────────────────────────────────────────────┘
            │ still arrives
            ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ L2  Network                                                 │
 │     DNS filter (NXDOMAIN for known phishing domains)         │
 │     + gateway firewall (drop direct-IP bypass)               │
 │     → lab/containerlab, lab/gns3                             │
 └─────────────────────────────────────────────────────────────┘
            │ new domain, not yet listed
            ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ L3  Accounts & apps                                         │
 │     passkeys, session revoke, breached-password screening,   │
 │     Chrome Enhanced Safe Browsing by policy,                 │
 │     application control ("program firewall")                 │
 └─────────────────────────────────────────────────────────────┘
            │ the user is unsure
            ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ L4  Stop-Check-Report assistant (app/)                      │
 │     check → risk score → known-sender REPEAT → report draft  │
 │     → user submits to provider / IASC / Patroli Siber        │
 └─────────────────────────────────────────────────────────────┘
```

## L4 app internals

```
app/src/
  analyzer/        rule engine (pure TypeScript, unit-tested)
    extract.ts       find links, account numbers, phone numbers, sender
    rules.ts         trick patterns (impersonation, urgency, payment, personal data)
    lookalike.ts     homoglyph fold + edit distance against protected domains
    punycode.ts      decode xn-- hosts before comparing
    lists.ts         fictional known-bad demo domains, shorteners, unusual TLDs
    score.ts         0–100 score and verdict
    senders.ts       known-sender normalisation, REPEAT bonus, escalation templates
    llm.ts           placeholder analyzer (not configured; nothing leaves the device)
  components/      Preact UI (composer, result, report, known senders, escalation)
  storage.ts       localStorage for history and known senders
  official.ts      hard-coded official links (IASC, CekRekening.id, Patroli Siber)
  i18n.tsx         English / Bahasa Indonesia
```

Data flow is one-way and local:

1. The user pastes text into the composer.
2. `analyzer` extracts entities, scores tricks and links, and returns an `AnalysisResult`.
3. If the sender is in the local known-sender list, +36 is added (capped at 100) and a **REPEAT** stamp is shown.
4. The user can save the sender, prepare a report summary, or write a follow-up complaint. Every output is text to copy plus buttons that **open** official sites. Nothing is posted.

There is no backend, no network call made by the analyzer, and no telemetry. `Analyzer` in `analyzer/types.ts` is the seam for a future model-based analyzer; if text ever leaves the device, the on-screen promise "Stays on this device. Nothing is sent." must change.

## L2 lab

Both lab versions use the same addressing: LAN `10.10.1.0/24` (victim `.10`, dns `.53`, gateway `.1`) and DMZ `10.10.2.0/24` (gateway `.1`, phish `.66`). The filter is switched by two scripts: one rewrites the dnsmasq rule for `jne-paket-tertunda.example`, the other adds or removes the gateway `FORWARD` drop for `10.10.2.66/32`. See [lab-results.md](lab-results.md).
