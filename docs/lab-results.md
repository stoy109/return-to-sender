# L2 lab results

Two runs of the same Layer 2 lab (DNS filter plus gateway firewall) on a Fedora laptop with rootful Podman. The test domain is `jne-paket-tertunda.example`. Filter ON means two controls together:

- DNS: dnsmasq returns NXDOMAIN for `jne-paket-tertunda.example`.
- Firewall on the gateway:

  ```
  iptables -A FORWARD -d 10.10.2.66/32 -j DROP
  ```

## Setup (both runs)

| Node | Address |
| --- | --- |
| victim | 10.10.1.10 |
| gw | 10.10.1.1 (LAN) / 10.10.2.1 (DMZ) |
| dns (dnsmasq) | 10.10.1.53 |
| phish (static DEMO page) | 10.10.2.66 |
| sw-lan (GNS3 only) | Linux bridge `br0`, no IP |

## Containerlab — 16 November 2026

Run at about 15:30 WIB (UTC+7). Captured with Wireshark on the lab links.

### Results

| Check | Filter OFF | Filter ON |
| --- | --- | --- |
| DNS for `jne-paket-tertunda.example` | A record `10.10.2.66` | NXDOMAIN ("No such name") |
| `curl` by name | `HTTP/1.1 200 OK` (DEMO page) | `Could not resolve host` |
| `curl` to `10.10.2.66` | Page opens (`200 OK`) | Timed out after 5000 ms |
| Wireshark | Packets 6–38: DNS A answer, then `GET /` and `HTTP/1.1 200 OK` | Packets 39–57: DNS NXDOMAIN; only TCP SYN retransmissions to the IP, never answered |

Useful display filter: `dns || http || tcp.flags.syn==1`.

## GNS3 — 23 November 2026

Verified end-to-end at about 14:56 WIB (UTC+7) on GNS3 2.2.61 with Podman 6.1.3 via `docker.sock`. All five nodes started (green): victim, sw-lan (Linux bridge `br0`), dns, gw and phish, plus the LAN `10.10.1.0/24` and DMZ `10.10.2.0/24` zones. Screenshot of the running topology: [`../lab/gns3/topology-running.png`](../lab/gns3/topology-running.png). Before the image was added to the repository, the home-directory path in the GNS3 console warning and the hostname in Servers Summary were painted out.

### Results (`./scripts/demo.sh`)

| Check | Filter OFF | Filter ON |
| --- | --- | --- |
| `ping -c 2 -W 2 10.10.1.1` | 2 received, 0% loss (0.373 / 0.957 ms) | — |
| `dig jne-paket-tertunda.example @10.10.1.53` | `NOERROR`, `A 10.10.2.66` | `NXDOMAIN` |
| `curl` by name | `HTTP/1.1 200 OK` from nginx/1.31.8, DEMO page | `Could not resolve host` (`curl: (6)`) |
| `curl` to `10.10.2.66` | — (not required after the name already opened the page) | `Connection timed out after 5003 milliseconds` (`curl: (28)`) |
| iptables on `gw` | `-P FORWARD ACCEPT` (no DROP rule) | `-P FORWARD ACCEPT` and `-A FORWARD -d 10.10.2.66/32 -j DROP` |

### Wireshark captures (about 15:00 WIB)

Display filter: `dns || http || tcp.flags.syn==1`. MAC addresses in the ARP rows and in the packet details/hex pane were masked before these screenshots were added to the repository.

- [`../lab/gns3/capture-victim-sw.png`](../lab/gns3/capture-victim-sw.png) — link victim↔sw-lan. Filter OFF: DNS A answer for `jne-paket-tertunda.example` and `HTTP/1.1 200 OK`. Filter ON: DNS "No such name" (NXDOMAIN) and TCP SYN retransmissions to `10.10.2.66` that are never answered.
- [`../lab/gns3/capture-gw-phish.png`](../lab/gns3/capture-gw-phish.png) — link gw↔phish. Filter OFF: the HTTP session reaches the phishing node (`GET /`, `HTTP/1.1 200 OK`). Filter ON: no packets arrive at the phishing server, which is the evidence that the gateway DROP rule is working.

### Gotchas

- The GNS3 GUI must be started with `docker` group membership (fresh graphical login, or `sg docker -c gns3`). A new terminal can already be in the group while a GNS3 process started from the old desktop session cannot open `docker.sock`.
- Node consoles are type `none`. Open a shell with `./scripts/shell.sh <node>`.

## What it proves

With the filter off, the victim reaches the phishing page. With the filter on, the name never resolves, and a victim who already has the IP (for example from a link that uses the raw address) cannot complete a TCP handshake, because the gateway drops the packets. This is the Layer 2 "block it before the click" evidence. The GNS3 run reproduces the Containerlab result on a visible canvas.

## Limits

- One laptop, one demo domain. A real deployment would be an ISP, campus or company DNS filter fed by a blocklist (for example a TrustPositif-style list), plus egress rules on the network edge.
- A brand-new phishing domain that is not on the list is not blocked; that is why layers L3 and L4 exist.
- The phishing node is a static page marked DEMO. It has no form and collects no credentials.
- The raw capture file is not published in this repository.
