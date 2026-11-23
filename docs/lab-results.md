# L2 lab results – 16 November 2026

Run on a Fedora laptop with Containerlab and rootful Podman, at about 15:30 WIB (UTC+7). Captured with Wireshark on the lab links.

## Setup

| Node | Address |
| --- | --- |
| victim | 10.10.1.10 |
| gw | 10.10.1.1 (LAN) / 10.10.2.1 (DMZ) |
| dns (dnsmasq) | 10.10.1.53 |
| phish (static DEMO page) | 10.10.2.66 |

Test domain: `jne-paket-tertunda.example`.

Filter ON means two controls together:

- DNS: dnsmasq returns NXDOMAIN for `jne-paket-tertunda.example`.
- Firewall on the gateway:

  ```
  iptables -A FORWARD -d 10.10.2.66/32 -j DROP
  ```

## Results

| Check | Filter OFF | Filter ON |
| --- | --- | --- |
| DNS for `jne-paket-tertunda.example` | A record `10.10.2.66` | NXDOMAIN ("No such name") |
| `curl` by name | `HTTP/1.1 200 OK` (DEMO page) | `Could not resolve host` |
| `curl` to `10.10.2.66` | Page opens (`200 OK`) | Timed out after 5000 ms |
| Wireshark | Packets 6–38: DNS A answer, then `GET /` and `HTTP/1.1 200 OK` | Packets 39–57: DNS NXDOMAIN; only TCP SYN retransmissions to the IP, never answered |

Useful display filter: `dns || http || tcp.flags.syn==1`.

## What it proves

With the filter off, the victim reaches the phishing page. With the filter on, the name never resolves, and a victim who already has the IP (for example from a link that uses the raw address) cannot complete a TCP handshake, because the gateway drops the packets. This is the Layer 2 "block it before the click" evidence.

## Limits

- One laptop, one demo domain. A real deployment would be an ISP, campus or company DNS filter fed by a blocklist (for example a TrustPositif-style list), plus egress rules on the network edge.
- A brand-new phishing domain that is not on the list is not blocked; that is why layers L3 and L4 exist.
- The phishing node is a static page marked DEMO. It has no form and collects no credentials.
- The raw capture file is not published in this repository.

The GNS3 version of the lab ([`../lab/gns3`](../lab/gns3)) uses the same addressing and rules; its results have not been recorded separately.
