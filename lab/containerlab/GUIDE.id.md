# Return to Sender — lab Layer 2 (Containerlab + Podman)

Lab kecil buat demo pertahanan jaringan di final project **Return to Sender** (Group 2). Ada klien, gateway/firewall, filter DNS, dan server phishing palsu. Semuanya container, traffic-nya internal di laptop — bukan ke internet.

Cocok dijalankan di Fedora 44 pakai **Podman rootful**. Perintah di bawah ini aman buat fish (shell default kamu). Script di `scripts/` sendiri pakai bash, jadi tinggal dijalankan, jangan di-`source`.

```
        LAN 10.10.1.0/24                         DMZ 10.10.2.0/24

 ┌──────────┐         ┌────────────────────┐         ┌──────────┐
 │  victim  │         │         gw         │         │  phish   │
 │ .10      │──eth1───│ br-lan .1          │──eth3───│  .66     │
 └──────────┘         │ iptables firewall  │         │ nginx    │
                      │                    │         │ (DEMO)   │
 ┌──────────┐         │                    │         └──────────┘
 │   dns    │──eth1───│                    │
 │  .53     │         └────────────────────┘
 │ dnsmasq  │
 └──────────┘
```

Domain palsu: `jne-paket-tertunda.example` (TLD cadangan RFC 2606, bukan domain beneran). Halaman phish **statis**, tertulis DEMO, **tidak ada form** dan **tidak mengumpulkan kredensial**.

Kalau filter **OFF**: DNS mengarah ke 10.10.2.66, curl dari victim dapat halaman DEMO.
Kalau filter **ON**: DNS jawab NXDOMAIN, plus iptables di gw `DROP` ke 10.10.2.66 (jadi akses by IP juga mentok).

## 0. Prasyarat

- Fedora, Podman sudah terpasang.
- Wireshark sudah terpasang.
- Akses sudo.

Containerlab **belum** perlu terpasang — langkah 1 di bawah.

Pakai **rootful** Podman (`sudo podman` / `sudo containerlab --runtime podman`). Image yang di-pull tanpa sudo (rootless) **tidak kelihatan** sama lab ini.

## 1. Install Containerlab

Jangan pakai script `containerlab.dev/setup` dengan argumen `all`. Script itu menginstall Docker, padahal kita mau tetap di Podman.

**Opsi A — installer resmi** (paling gampang):

```
bash -c "$(curl -sL https://get.containerlab.dev)"
```

**Opsi B — repo RPM resmi**, pakai file `containerlab.repo` yang ikut di folder ini:

```
sudo cp return-to-sender/lab/containerlab/containerlab.repo /etc/yum.repos.d/containerlab.repo
sudo dnf install containerlab
```

Cek:

```
containerlab version
```

Dokumentasi install: https://containerlab.dev/install/

Kalau SELinux enforcing dan binary `containerlab` error `Segmentation fault` (kadang terjadi karena binary di-compress UPX), perbaiki dengan:

```
sudo setsebool -P selinuxuser_execmod 1
```

atau ikut langkah `semanage fcontext` di halaman install di atas.

## 2. Nyalakan API Podman (rootful)

Containerlab bicara ke Podman lewat socket API, bukan cuma CLI. Di Fedora:

```
sudo systemctl enable --now podman.socket
```

Kalau `/run/podman/podman.sock` belum muncul:

```
sudo systemctl enable --now podman
```

Cek socket-nya ada:

```
ls -l /run/podman/podman.sock
```

Catatan runtime Podman (halaman khusus `/manual/podman/` sudah 404, ini dirangkum dari docs + release notes resmi, termasuk v0.83):

- Runtime dipilih **untuk seluruh lab**, jangan per-node. Pakai flag `--runtime podman` atau env `CLAB_RUNTIME`.
- Belum semua fitur Containerlab selengkap Docker, tapi linux node, veth, exec, inspect, destroy, dan `containerlab capture` sudah didukung.
- Campur Docker + Podman dalam satu lab tidak didukung.
- Deploy, destroy, dan capture tetap butuh privilege (jadi di sini kita pakai `sudo`).
- Bind mount di Fedora/SELinux sudah dikasih opsi `:z` di file topologi.

## 3. Build image, lalu deploy

Clone repo ini, lalu masuk ke folder lab:

```
cd return-to-sender/lab/containerlab
```

Lalu build image dan deploy:

```
cd return-to-sender/lab/containerlab
./build-images.sh
sudo containerlab deploy --runtime podman -t rts-lab.clab.yml
```

`build-images.sh` akan `sudo podman pull` netshoot + nginx + alpine, lalu build `localhost/rts-dns:latest` (dnsmasq, image-nya kecil).

Cek node:

```
sudo containerlab inspect --runtime podman -t rts-lab.clab.yml
./scripts/status.sh
```

## 4. Jalankan demo

```
cd return-to-sender/lab/containerlab
./scripts/demo.sh
```

Script ini, berurutan:

1. `filter-off.sh` → `ping` gateway, `dig` nama palsu (harus dapat `10.10.2.66`), `curl` halaman DEMO (harus sukses).
2. `filter-on.sh` → `dig` jadi NXDOMAIN, `curl` by name gagal, `curl` by IP ke `10.10.2.66` juga gagal (iptables DROP, biasanya nunggu timeout ~5 detik).

Toggle manual kapan saja:

```
./scripts/filter-on.sh
./scripts/filter-off.sh
```

Masuk ke konsol klien:

```
sudo podman exec -it clab-rts-lab-victim bash
```

## 5. Capture ke Wireshark

Cara paling gampang (Containerlab 0.83+, didukung Podman, tidak perlu tcpdump di dalam node):

```
cd return-to-sender/lab/containerlab
./scripts/capture.sh
```

Sama aja dengan:

```
sudo containerlab capture --runtime podman -t rts-lab.clab.yml --target victim:eth1 --target gw:eth3 -w - | wireshark -k -i -
```

Biarkan Wireshark kebuka, di terminal lain jalankan `./scripts/demo.sh`. Di Wireshark, filter yang berguna: `dns or http or icmp`.

Simpan ke file:

```
./scripts/capture.sh --pcap captures/demo.pcapng
```

List interface yang bisa di-capture:

```
./scripts/capture.sh --list
```

**Fallback** kalau `containerlab capture` error — pakai netns + tcpdump (Wireshark tetap di host):

```
./scripts/capture.sh --tcpdump
```

atau langsung:

```
sudo ip netns exec clab-rts-lab-gw tcpdump -U -nni eth3 -w - | wireshark -k -i -
```

Kalau `ip netns list` tidak memuat `clab-rts-lab-gw`, Containerlab/Podman kadang belum pasang symlink netns. Pakai cara resmi `containerlab capture`, atau tulis pcap dari dalam node:

```
sudo podman exec clab-rts-lab-gw tcpdump -nni eth3 -w /lab/captures/gw-eth3.pcap
```

File itu muncul di `return-to-sender/lab/containerlab/captures/` (folder ini di-bind ke gw). Ctrl+C di tcpdump, lalu buka filenya di Wireshark.

## 6. Matikan lab

```
cd return-to-sender/lab/containerlab
sudo containerlab destroy --runtime podman -t rts-lab.clab.yml --cleanup
```

## Cloudflare WARP

WARP di laptop **tidak usah dimatikan** hanya untuk traffic lab. Veth, bridge `br-lan`, dan IP 10.10.1.0/24 serta 10.10.2.0/24 semuanya internal antar container, tidak lewat tunnel WARP.

WARP **bisa** mengganggu langkah yang butuh internet host, misalnya:

- `podman pull` / `podman build` (ambil image dari docker.io, `apk` saat build `rts-dns`)
- `curl` installer Containerlab, atau `dnf install containerlab`

Kalau pull/build/install gagal aneh (timeout DNS, TLS error, registry tidak ketemu), pause WARP sebentar, ulang perintah itu, lalu WARP boleh dinyalakan lagi. Setelah imagenya sudah lokal, demo dan capture tidak butuh internet.

## Troubleshooting singkat

- **Image `localhost/rts-dns:latest` tidak ketemu** — jalankan `./build-images.sh` (harus `sudo podman`, bukan rootless).
- **`Cannot connect to Podman` / socket error** — `sudo systemctl enable --now podman.socket`, cek `/run/podman/podman.sock`.
- **Permission denied di bind mount (SELinux)** — topologi sudah pakai `:z`. Kalau masih mentok: `sudo chcon -Rt container_file_t return-to-sender/lab/containerlab`.
- **Victim masih resolve pakai DNS lain** — `./scripts/demo.sh` menulis ulang `/etc/resolv.conf` ke `10.10.1.53`. Cek dengan `./scripts/status.sh`.
- **curl filter-off gagal** — tunggu 2–3 detik setelah deploy (init script butuh interface siap), lalu `./scripts/status.sh` dan ulang `./scripts/demo.sh`.

## File yang penting

| File | Isi |
| --- | --- |
| `rts-lab.clab.yml` | Topologi Containerlab |
| `build-images.sh` | Pull + build image |
| `scripts/demo.sh` | Demo filter off/on |
| `scripts/filter-on.sh` / `filter-off.sh` | Toggle DNS + iptables |
| `scripts/capture.sh` | Wireshark / pcapng |
| `config/phish/html/index.html` | Halaman DEMO (statis) |
| `images/dns/Dockerfile` | Image dnsmasq lokal |
| `containerlab.repo` | Repo RPM Containerlab |
