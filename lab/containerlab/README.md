# L2 lab: DNS filter + gateway firewall (Containerlab + Podman)

A four-container lab that shows Layer 2 of Return to Sender: the phishing site is blocked **before the click**, both by name (DNS) and by IP (firewall). All traffic stays between local containers; nothing goes to the internet.

```
        LAN 10.10.1.0/24                         DMZ 10.10.2.0/24
 ┌──────────┐         ┌────────────────────┐         ┌──────────┐
 │  victim  │──eth1───│ gw  br-lan .1      │──eth3───│  phish   │
 │  .10     │         │ iptables firewall  │         │  .66     │
 └──────────┘         │                    │         │ nginx    │
 ┌──────────┐         │                    │         │ (DEMO)   │
 │   dns    │──eth1───│                    │         └──────────┘
 │  .53     │         └────────────────────┘
 └──────────┘
```

| Node | Role | Address |
| --- | --- | --- |
| victim | client (netshoot) | 10.10.1.10, gateway .1, DNS .53 |
| gw | router + iptables firewall | 10.10.1.1 (LAN) / 10.10.2.1 (DMZ) |
| dns | dnsmasq filter | 10.10.1.53 |
| phish | nginx serving a static **DEMO** page (no form) | 10.10.2.66 |

Fake domain: `jne-paket-tertunda.example` (`.example` is reserved by RFC 2606).

- **Filter OFF:** DNS answers `10.10.2.66`; the victim gets the DEMO page.
- **Filter ON:** DNS answers NXDOMAIN, and the gateway drops traffic to the IP with `iptables -A FORWARD -d 10.10.2.66/32 -j DROP`, so a direct-IP bypass also fails.

## Requirements

Linux (developed on Fedora 44), rootful Podman, [Containerlab](https://containerlab.dev/install/), Wireshark, sudo. Use rootful Podman throughout: images pulled rootless are not visible to the lab.

## Run

```bash
cd lab/containerlab
sudo systemctl enable --now podman.socket
./build-images.sh
sudo containerlab deploy --runtime podman -t rts-lab.clab.yml
./scripts/demo.sh              # OFF vs ON comparison from the victim
./scripts/filter-on.sh         # or ./scripts/filter-off.sh
./scripts/status.sh            # current DNS + firewall state
./scripts/capture.sh           # live Wireshark on the gateway
sudo containerlab destroy --runtime podman -t rts-lab.clab.yml --cleanup
```

Captures saved under `captures/` are git-ignored.

## Troubleshooting

- `containerlab` segfaults on SELinux-enforcing Fedora: `sudo setsebool -P selinuxuser_execmod 1`.
- Image pull or build fails behind a VPN such as Cloudflare WARP: pause it, retry, then turn it back on. The demo itself needs no internet.
- Bind-mount permission errors: the topology already uses `:z`; see the full guide.

The full step-by-step guide (in Bahasa Indonesia) is [`GUIDE.id.md`](GUIDE.id.md). Results from the 16 Nov 2026 run are in [`../../docs/lab-results.md`](../../docs/lab-results.md).
