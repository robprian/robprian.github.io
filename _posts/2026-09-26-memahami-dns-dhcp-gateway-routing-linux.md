---
layout: post
title: "Memahami DNS, DHCP, Gateway, dan Routing pada Jaringan Linux"
date: 2026-09-26 13:29:20 +0000
description: "Memahami komponen dasar networking seperti DNS, DHCP, gateway, routing, dan cara melakukan troubleshooting jaringan pada Linux."
categories: []
tags: []
---

# Memahami DNS, DHCP, Gateway, dan Routing pada Jaringan Linux

Ketika sebuah aplikasi web tiba-tiba tidak bisa diakses atau server gagal melakukan update package, penyebabnya sering kali bukan pada aplikasinya sendiri, melainkan pada lapisan jaringan. Administrator Linux yang memahami konsep dasar seperti alamat IP, gateway, DNS, DHCP, dan routing akan jauh lebih cepat menemukan akar masalah dibanding yang hanya mengandalkan restart service.

Artikel ini membahas komponen dasar networking pada Linux, perintah-perintah penting untuk inspeksi jaringan, alur troubleshooting yang sistematis, serta contoh kasus nyata penyelesaian masalah jaringan.

## Dasar Alamat IP dan Subnet

Setiap perangkat dalam jaringan diidentifikasi melalui alamat IP. Pada IPv4 yang masih dominan di banyak environment, alamat terdiri dari 32 bit yang ditulis dalam empat oktet desimal, misalnya `192.168.1.10`.

Alamat IP selalu berpasangan dengan subnet mask atau notasi CIDR yang menentukan bagian mana yang merupakan network dan bagian mana yang merupakan host. Contoh `192.168.1.10/24` berarti 24 bit pertama adalah network (`192.168.1.0`) dan sisanya untuk host (dari `192.168.1.1` sampai `192.168.1.254`).

Subnet penting karena menentukan apakah dua host bisa berkomunikasi langsung atau harus melalui router. Jika dua alamat berada dalam subnet yang sama, paket dikirim langsung melalui ARP. Jika berbeda subnet, paket harus dikirim ke gateway.

Melihat konfigurasi IP di Linux modern menggunakan perintah:

```bash
ip addr show
```

Perintah ini menampilkan semua interface jaringan beserta alamat IP, status interface (UP atau DOWN), MTU, dan alamat MAC. Keluaran perintah ini lebih detail dan direkomendasikan dibanding perintah lawas `ifconfig` yang sudah tidak terinstal secara default di banyak distribusi.

Contoh potongan keluaran berikut ini:

```text
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 192.168.1.10/24 brd 192.168.1.255 scope global eth0
```

Penjelasan: interface `eth0` berstatus UP, memiliki alamat `192.168.1.10` dengan prefix `/24`, dan broadcast address `192.168.1.255`. Jika tidak ada baris `inet`, berarti interface belum mendapatkan alamat IP, yang mengarah ke masalah DHCP atau konfigurasi statis.

Untuk melihat ringkasan yang lebih ringkas:

```bash
ip -brief addr show
```

Perintah ini menampilkan satu baris per interface sehingga cocok untuk pengecekan cepat di server dengan banyak interface atau VLAN.

Konsep netmask juga berkaitan dengan perencanaan kapasitas. Prefix `/24` menyediakan 254 alamat host yang usable, `/25` menyediakan 126, dan `/16` menyediakan lebih dari 65 ribu. Pemilihan prefix yang terlalu besar menyebabkan broadcast domain membengkak, sedangkan yang terlalu kecil cepat habis dan menyulitkan ekspansi.

## Apa Itu Gateway

Gateway, atau lebih tepatnya default gateway, adalah alamat router yang menjadi pintu keluar ketika host ingin berkomunikasi ke jaringan lain, termasuk internet. Tanpa gateway yang benar, server hanya bisa berkomunikasi di dalam subnet lokalnya sendiri.

Analoginya sederhana: jika subnet adalah sebuah komplek perumahan, gateway adalah gerbang utama menuju jalan raya. Paket yang tujuannya di luar komplek harus melewati gerbang tersebut.

Melihat gateway yang sedang aktif:

```bash
ip route show
```

Perintah ini menampilkan tabel routing. Baris yang diawali `default via` menunjukkan default gateway. Contoh keluaran berikut ini:

```text
default via 192.168.1.1 dev eth0 proto dhcp metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10
```

Penjelasan: semua trafik ke tujuan yang tidak dikenal akan diteruskan ke `192.168.1.1` melalui interface `eth0`. Baris kedua adalah rute langsung ke jaringan lokal yang dibuat otomatis oleh kernel ketika interface mendapatkan alamat IP.

Menambahkan default gateway secara manual, misalnya untuk pengujian sementara:

```bash
sudo ip route add default via 192.168.1.1 dev eth0
```

Perintah ini menambahkan rute default baru. Perubahan melalui perintah `ip route` bersifat sementara dan hilang setelah reboot, sehingga cocok untuk pengujian. Untuk konfigurasi permanen, gunakan Netplan, NetworkManager, atau systemd-networkd sesuai distribusi yang dipakai.

Menghapus rute yang salah:

```bash
sudo ip route del default via 192.168.1.99
```

Perintah ini menghapus entri gateway yang keliru tanpa mengganggu rute lokal lainnya.

## Peran DNS dalam Jaringan

DNS (Domain Name System) menerjemahkan nama domain yang mudah diingat manusia seperti `example.com` menjadi alamat IP yang dimengerti mesin. Hampir semua aktivitas server, mulai dari `apt update` hingga koneksi database berbasis hostname, bergantung pada DNS yang sehat.

Alur resolusi DNS secara garis besar: aplikasi bertanya ke resolver lokal, resolver meneruskan ke DNS server yang dikonfigurasi, DNS server melakukan pencarian rekursif dari root hingga authoritative server, lalu hasilnya dikembalikan dan di-cache sementara sesuai nilai TTL.

Melihat konfigurasi DNS resolver:

```bash
cat /etc/resolv.conf
```

File ini berisi daftar nameserver yang digunakan sistem. Contoh isinya:

```text
nameserver 8.8.8.8
nameserver 1.1.1.1
```

Setiap baris `nameserver` adalah alamat DNS server. Sistem akan mencoba berurutan dari atas ke bawah. Pada sistem modern dengan systemd-resolved, file ini sering kali berupa symlink ke stub resolver `127.0.0.53`, dan konfigurasi sebenarnya dilihat melalui perintah lain.

Memeriksa status resolver systemd:

```bash
resolvectl status
```

Perintah ini menampilkan DNS server per interface, domain pencarian, dan protokol yang digunakan seperti DNSOverTLS jika diaktifkan. Hasilnya kurang lebih menampilkan daftar link, server saat ini, dan statistik cache.

Menguji resolusi nama dengan `dig`:

```bash
dig example.com
```

Perintah `dig` menampilkan jawaban lengkap termasuk waktu query, server yang menjawab, dan record yang ditemukan. Bagian `ANSWER SECTION` menunjukkan hasil resolusi, sedangkan `Query time` mengindikasikan latensi DNS. Waktu yang sangat besar atau status `SERVFAIL` menandakan masalah pada DNS server.

Query tipe record tertentu:

```bash
dig example.com MX +short
```

Opsi `+short` menampilkan hanya hasil tanpa header verbose, cocok untuk script. Contoh di atas menanyakan MX record yang menunjukkan server email domain tersebut.

Alternatif yang lebih sederhana:

```bash
nslookup example.com
```

Perintah `nslookup` tersedia di Linux, Windows, dan macOS sehingga berguna untuk perbandingan lintas platform. Hasilnya menampilkan server yang menjawab dan alamat IP hasil resolusi. Meskipun praktis, `dig` umumnya memberikan informasi diagnostik yang lebih lengkap.

Untuk memeriksa dari DNS server tertentu, misalnya membandingkan resolver lokal dengan resolver publik:

```bash
dig @8.8.8.8 example.com +short
```

Simbol `@` menentukan server DNS yang ditanya secara eksplisit. Teknik ini membantu memastikan apakah masalah ada di resolver lokal atau memang domainnya yang bermasalah secara global.

## Peran DHCP dalam Jaringan

DHCP (Dynamic Host Configuration Protocol) mengotomatisasi pemberian alamat IP, netmask, gateway, dan DNS server ke perangkat client. Tanpa DHCP, setiap perangkat harus dikonfigurasi manual yang rentan salah ketik dan konflik alamat.

Proses DHCP lazim disingkat DORA: Discover, Offer, Request, Acknowledge. Client menyiarkan permintaan, server DHCP menawarkan alamat, client meminta alamat tersebut secara formal, lalu server mengonfirmasi beserta masa sewa (lease time).

Melihat apakah alamat didapat dari DHCP:

```bash
ip route show | grep "proto dhcp"
```

Jika rute memiliki label `proto dhcp`, besar kemungkinan konfigurasi jaringan berasal dari DHCP. Informasi lease yang lebih detail biasanya tersimpan di direktori `/var/lib/dhcp/` atau dikelola NetworkManager.

Memeriksa lease systemd-networkd:

```bash
networkctl status eth0
```

Perintah ini menampilkan apakah interface dikelola DHCP, alamat yang diterima, gateway, DNS, dan sisa waktu lease. Sangat berguna di server Ubuntu modern yang menggunakan systemd-networkd atau Netplan.

Me-release dan me-renew lease DHCP pada client dhclient klasik:

```bash
sudo dhclient -r eth0
```

Perintah ini melepaskan alamat IP saat ini. Opsi `-r` berarti release. Setelah itu, minta alamat baru:

```bash
sudo dhclient eth0
```

Perintah ini meminta lease baru dari server DHCP. Kombinasi kedua perintah ini sering menyelesaikan masalah alamat kadaluarsa atau konflik IP ringan.

Di server production, alamat statis umumnya lebih disarankan agar alamat tidak berubah tiba-tiba dan mengganggu firewall atau DNS. DHCP lebih cocok untuk workstation, perangkat IoT, atau environment lab yang dinamis.

## Tabel Routing dan Cara Membacanya

Tabel routing adalah peta yang digunakan kernel untuk memutuskan ke mana paket diteruskan. Setiap paket yang keluar akan dicocokkan dengan entri tabel dari prefix paling spesifik ke paling umum (longest prefix match).

Menampilkan tabel routing lengkap:

```bash
ip route show
```

Contoh tabel dengan beberapa rute:

```text
default via 192.168.1.1 dev eth0 metric 100
10.0.5.0/24 via 192.168.1.254 dev eth0
192.168.1.0/24 dev eth0 scope link src 192.168.1.10
```

Penjelasan tiap baris:

- Baris pertama adalah default route untuk semua tujuan yang tidak cocok dengan rute lain.
- Baris kedua adalah static route: trafik menuju `10.0.5.0/24` diteruskan ke router `192.168.1.254`, bukan ke default gateway. Pola ini umum untuk koneksi antar kantor atau VPN.
- Baris ketiga adalah connected route yang dibuat otomatis untuk jaringan lokal.

Menambahkan static route sementara:

```bash
sudo ip route add 10.0.5.0/24 via 192.168.1.254 dev eth0
```

Perintah ini mengarahkan subnet kantor cabang melalui router internal. Parameter `via` menentukan next-hop, sedangkan `dev` menentukan interface keluar.

Melihat tabel routing dalam format numerik tanpa resolusi hostname:

```bash
ip -n route show
```

Opsi `-n` mencegah lookup DNS terbalik sehingga output tampil lebih cepat, penting ketika DNS sedang bermasalah dan setiap lookup justru menambah timeout.

## Perintah Diagnostik Esensial

Selain perintah di atas, beberapa tool berikut wajib dikuasai untuk diagnosis sehari-hari.

### ping

```bash
ping -c 4 8.8.8.8
```

Perintah `ping` mengirim paket ICMP Echo Request untuk menguji konektivitas dasar. Opsi `-c 4` membatasi hanya empat paket agar perintah berhenti otomatis. Dari hasilnya, perhatikan packet loss dan rata-rata round-trip time. Loss 0 persen dengan latensi stabil menandakan jalur sehat di level IP.

Menguji ping ke gateway lokal terlebih dahulu membantu memisahkan masalah lokal dan masalah internet:

```bash
ping -c 4 192.168.1.1
```

Jika gateway lokal tidak menjawab tetapi kabel dan interface terlihat UP, kemungkinan ada masalah ARP, firewall, atau gateway salah alamat.

### traceroute

```bash
traceroute 8.8.8.8
```

Perintah `traceroute` menampilkan setiap hop yang dilalui paket beserta latensinya. Baris pertama seharusnya gateway lokal, diikuti router ISP, hingga tujuan akhir. Tanda bintang `* * *` berarti hop tersebut tidak menjawab ICMP, yang bisa normal karena banyak router mematikan respons ICMP demi keamanan.

Pada sistem yang belum menginstal traceroute, alternatif modern adalah:

```bash
tracepath 8.8.8.8
```

Perintah `tracepath` tidak membutuhkan hak akses root dan otomatis mendeteksi MTU jalur, sehingga praktis untuk pemeriksaan cepat.

### ss

```bash
ss -tuln
```

Perintah `ss` menggantikan `netstat` untuk melihat socket yang terbuka. Opsi `-t` berarti TCP, `-u` berarti UDP, `-l` berarti hanya yang listening, dan `-n` berarti tampilkan numerik tanpa resolusi nama. Hasilnya menunjukkan port apa saja yang didengarkan server, misalnya port 22 untuk SSH, 80 dan 443 untuk web.

Melihat koneksi yang sedang aktif beserta prosesnya:

```bash
sudo ss -tupn
```

Opsi `-p` menampilkan nama proses pemilik socket, sedangkan `-u` dan `-t` mencakup TCP dan UDP. Perintah ini membutuhkan sudo agar informasi proses milik user lain bisa terlihat. Hasilnya membantu memastikan aplikasi benar-benar terikat ke alamat dan port yang diharapkan.

### Kombinasi ping dan DNS

Untuk membedakan masalah DNS dan masalah routing, lakukan dua tes berurutan:

```bash
ping -c 2 8.8.8.8
```

Jika perintah di atas berhasil tetapi perintah berikut gagal:

```bash
ping -c 2 example.com
```

Maka konektivitas IP sehat dan masalah hampir pasti ada di resolusi DNS. Pola perbandingan sederhana ini menghemat banyak waktu dibanding langsung mengubah konfigurasi firewall.

## Alur Troubleshooting yang Sistematis

Troubleshooting jaringan paling efektif dilakukan dari lapisan terbawah ke atas. Urutan yang disarankan:

1. **Link dan interface:** pastikan kabel terhubung, interface UP, dan alamat IP terpasang. Gunakan `ip addr` dan `ip link`.
2. **Konektivitas lokal:** ping gateway dan tetangga satu subnet. Jika gagal, periksa netmask, VLAN, dan firewall lokal.
3. **Routing:** periksa tabel routing dengan `ip route` dan pastikan default gateway benar. Uji `ping 8.8.8.8` untuk validasi konektivitas internet di level IP.
4. **DNS:** uji `dig` dan `nslookup`. Pastikan `/etc/resolv.conf` berisi nameserver yang bisa dijangkau.
5. **Port dan aplikasi:** gunakan `ss` untuk memastikan service listening, lalu uji koneksi TCP dengan `curl` atau `telnet` ke port tujuan.
6. **Firewall dan NAT:** periksa `iptables`, `nft`, `ufw`, atau security group cloud jika paket hilang di tengah jalan.

Pendekatan berlapis ini mencegah tebakan acak seperti langsung mengubah DNS padahal masalahnya ada di gateway yang salah.

## Contoh Kasus: Server Tidak Bisa Update

Misalkan sebuah VPS Ubuntu gagal menjalankan `apt update` dengan error tidak bisa me-resolve `archive.ubuntu.com`. Langkah diagnosis yang tepat adalah sebagai berikut.

Pertama, periksa alamat IP:

```bash
ip addr show eth0
```

Hasilnya menunjukkan interface memiliki alamat `192.168.1.10/24`, jadi lapisan IP lokal terlihat normal.

Kedua, uji gateway:

```bash
ping -c 4 192.168.1.1
```

Hasilnya kurang lebih menunjukkan balasan normal tanpa packet loss, berarti konektivitas lokal sehat.

Ketiga, uji konektivitas internet mentah:

```bash
ping -c 4 8.8.8.8
```

Hasilnya juga berhasil, yang berarti routing dan NAT berfungsi. Masalah bukan di gateway atau firewall level IP.

Keempat, uji DNS:

```bash
dig archive.ubuntu.com +short
```

Perintah ini timeout tanpa jawaban. Pemeriksaan lanjutan menunjukkan isi `/etc/resolv.conf` menunjuk ke alamat DNS lama yang sudah tidak aktif.

Solusinya adalah memperbaiki konfigurasi resolver ke DNS yang valid, misalnya DNS internal perusahaan atau DNS publik yang diizinkan firewall, lalu menguji ulang dengan `dig` sebelum menjalankan `apt update` kembali. Kasus seperti ini menegaskan pentingnya memisahkan gejala (gagal update) dari penyebab (resolver salah) melalui pengujian berlapis.

Kasus lain yang sering terjadi adalah service web berjalan tetapi tidak bisa diakses dari luar. Hasil `ss -tuln` menunjukkan aplikasi hanya listening di `127.0.0.1:8080`, bukan `0.0.0.0:8080`. Artinya aplikasi hanya menerima koneksi lokal. Solusinya adalah mengubah bind address di konfigurasi aplikasi, bukan membuka firewall lebih lebar.

## Kesimpulan

DNS, DHCP, gateway, dan routing adalah empat pilar yang membuat komunikasi jaringan Linux berjalan. IP dan subnet menentukan identitas dan batas komunikasi langsung, gateway menjadi jembatan antar jaringan, DNS menerjemahkan nama menjadi alamat, DHCP mengotomatisasi distribusi konfigurasi, dan tabel routing menjadi peta penentu arah paket.

Dengan menguasai perintah seperti `ip addr`, `ip route`, `ping`, `traceroute`, `dig`, `nslookup`, dan `ss`, proses diagnosis menjadi jauh lebih terarah. Kuncinya adalah selalu bekerja secara sistematis dari lapisan terbawah ke atas dan membandingkan hasil tes IP mentah dengan tes berbasis nama untuk memisahkan masalah routing dan DNS. Kebiasaan ini membuat penyelesaian masalah jaringan lebih cepat, terdokumentasi, dan tidak bergantung pada tebakan.

