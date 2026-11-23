# Return to Sender

**Stop. Check. Report.** A layered anti-phishing and anti-scam defence for Indonesian users, built as the final project of Group 2 in the Network Security course at President University.

## What it is

Phishing and scam messages (fake courier SMS, fake bank OTP requests, "you won a prize, just pay the fee", hijacked friends sending malicious game mods) are a daily problem in Indonesia. No single tool stops them, so this project combines four layers:

| Layer | Focus | What is in this repo |
| --- | --- | --- |
| **L1 – Laws & habits** | UU ITE / UU PDP duties for providers, a shared-responsibility proposal, and the Stop-Check-Report habit | [`docs/layers.md`](docs/layers.md) |
| **L2 – Network** | DNS filtering plus a gateway firewall that blocks the phishing site before the click | [`lab/containerlab`](lab/containerlab), [`lab/gns3`](lab/gns3), [`docs/lab-results.md`](docs/lab-results.md) |
| **L3 – Accounts & apps** | Passkeys, session revoke, breached-password screening, Enhanced Safe Browsing by policy, application control | [`docs/layers.md`](docs/layers.md) |
| **L4 – Assistant** | The Stop-Check-Report web app: paste a message, get a risk score, prepare a report you submit yourself | [`app`](app) |

See [`docs/architecture.md`](docs/architecture.md) for how the pieces fit together.

## What the name means

"Return to Sender" means **handing the scam back to the party responsible for stopping it**: the platform or email provider, the Indonesia Anti-Scam Centre (IASC, OJK), and the cyber police (Polri Patroli Siber). It does **not** mean replying to the scammer, sending anything back to them, or attacking them.

## Repository layout

```
app/                 L4 Stop-Check-Report assistant (Vite + TypeScript + Preact, runs fully in the browser)
lab/containerlab/    L2 lab: victim, gateway/firewall, DNS filter, fake phishing server (Containerlab + Podman)
lab/gns3/            The same L2 lab as a GNS3 project (Docker nodes via Podman's Docker-compatible API)
slides/week12/       Week 12 progress deck (single HTML file) and speaker script
docs/                Architecture, the four layers, and the 16 Nov / 23 Nov 2026 lab results
```

## Quickstart

### App (L4)

Requires Node.js 22 or newer.

```bash
cd app
npm install
npm run dev      # http://127.0.0.1:4317
npm test         # 57 analyzer unit tests
npm run build    # typecheck + production build
```

No API key and no backend are needed. See [`app/README.md`](app/README.md) for the scoring rules and a two-minute demo script.

### Containerlab lab (L2)

Requires Linux, rootful Podman, Containerlab and Wireshark.

```bash
cd lab/containerlab
sudo systemctl enable --now podman.socket
./build-images.sh
sudo containerlab deploy --runtime podman -t rts-lab.clab.yml
./scripts/demo.sh          # runs the filter OFF / ON comparison
./scripts/capture.sh       # optional: live Wireshark on the gateway
sudo containerlab destroy --runtime podman -t rts-lab.clab.yml --cleanup
```

Details: [`lab/containerlab/README.md`](lab/containerlab/README.md).

### GNS3 lab (L2, visual)

Requires GNS3 2.2 and rootful Podman with the Docker-compatible socket.

```bash
cd lab/gns3
sudo ./host/setup-podman-for-gns3.sh   # then log out and back in
./build-images.sh
./host/check-setup.sh
```

Then in GNS3: **File → Import portable project** → `lab/gns3/project/rts-gns3.gns3project`, press ▶, and run `./scripts/demo.sh`. The GNS3 GUI must be started with `docker` group membership (fresh login, or `sg docker -c gns3`). Verified end-to-end on 23 November 2026. Details: [`lab/gns3/README.md`](lab/gns3/README.md).

### Slides

Open `slides/week12/index.html` in a browser (arrow keys to move between slides).

## Safety and privacy

- **No auto-sending.** The app never submits a report, email or complaint. It prepares text you copy, and buttons that only open the official sites (IASC, CekRekening.id, Patroli Siber, provider abuse forms). You stay in control, which also keeps the project clear of sending other people's personal data under UU PDP.
- **Nothing is collected.** Checks run in the browser. History and the known-sender list live in `localStorage` on your device only. There is no server, account, analytics or tracking.
- **The lab is isolated and harmless.** The "phishing" node serves a static page marked **DEMO** on the reserved domain `jne-paket-tertunda.example`. It has no form and collects no credentials. All lab traffic stays between local containers.
- **Sample data is fictional.** Example messages, domains and the phone number `0812-3456-7890` are made up for the class demo.
- The analyzer is an automated rule engine and can be wrong. This is a student project, not legal advice, and is not affiliated with OJK, IASC, Komdigi or Polri.

## Team

**Group 2** – Network Security, President University (lecturer: **Tjong Wan Sen**)

- Casey Heraldo Isaac Pinontoan
- Alfa
- Ferisca

## License

[MIT](LICENSE)
