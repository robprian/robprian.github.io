---
layout: post
title: "Setup VPS Linux dari Nol untuk Menjalankan Web Application"
date: 2026-09-26 13:29:14 +0000
description: "Panduan menyiapkan VPS Linux dari awal untuk menjalankan aplikasi web dengan konfigurasi dasar yang aman dan terstruktur."
categories: []
tags: []
---

# Setup VPS Linux dari Nol untuk Menjalankan Web Application

Menyewa VPS (Virtual Private Server) Linux adalah langkah umum ketika aplikasi web mulai membutuhkan kontrol penuh yang tidak didapat dari shared hosting. Namun VPS kosong yang baru dibuat berada dalam kondisi mentah: login sebagai root, tanpa firewall, tanpa web server, dan tanpa mekanisme SSL. Tanpa setup awal yang benar, aplikasi memang bisa berjalan, tetapi dengan risiko keamanan dan operasional yang tinggi.

Artikel ini memandu proses menyiapkan VPS Linux dari nol untuk menjalankan aplikasi web, mulai dari pembuatan user non-root, pengamanan SSH, firewall, instalasi Nginx, runtime aplikasi, process manager, SSL, domain, logging, backup, hingga checklist production.

## Persiapan Awal dan Akses Pertama

Setelah memesan VPS dari provider, pengguna biasanya menerima alamat IP publik, password root atau key SSH, serta pilihan sistem operasi. Ubuntu LTS versi terbaru adalah pilihan aman untuk pemula karena dokumentasinya melimpah dan dukungan jangka panjangnya jelas.

Login awal sebagai root untuk konfigurasi pertama:

```bash
ssh root@203.0.113.10
```

Perintah ini membuka sesi SSH ke VPS dengan user root. Ganti `203.0.113.10` dengan IP publik VPS yang sebenarnya. Pada koneksi pertama, SSH akan menanyakan konfirmasi fingerprint host. Verifikasi fingerprint tersebut dengan informasi yang diberikan provider sebelum menjawab yes untuk menghindari serangan man-in-the-middle.

Setelah masuk, perbarui seluruh package sistem sebelum menginstal apapun:

```bash
apt update && apt upgrade -y
```

Perintah `apt update` menyegarkan daftar package dari repository, sedangkan `apt upgrade -y` memperbarui package yang sudah terinstal. Langkah ini memastikan patch keamanan terbaru terpasang sejak awal dan mengurangi risiko mengejar kerentanan lama di kemudian hari.

Periksa juga informasi dasar sistem untuk dokumentasi:

```bash
lsb_release -a && uname -r && uptime
```

Rangkaian perintah ini menampilkan versi distribusi, versi kernel, dan lama waktu server menyala. Hasilnya berguna dicatat sebagai baseline environment.

## Membuat Non-Root User dengan Sudo

Bekerja sehari-hari sebagai root sangat berbahaya karena satu salah ketik seperti `rm -rf` di direktori yang keliru bisa menghancurkan sistem tanpa peringatan. Praktik yang benar adalah membuat user biasa dengan hak sudo untuk tugas administratif.

Buat user baru bernama `deploy`:

```bash
adduser deploy
```

Perintah interaktif ini membuat user sekaligus direktori home dan meminta password serta informasi opsional. Ikuti panduannya dan gunakan password yang kuat dan unik.

Berikan hak sudo kepada user tersebut:

```bash
usermod -aG sudo deploy
```

Perintah ini menambahkan user `deploy` ke grup `sudo`. Opsi `-aG` berarti append ke grup tambahan tanpa menghapus keanggotaan grup lain. Mulai titik ini, user `deploy` bisa menjalankan perintah administratif dengan awalan `sudo`.

Uji login sebagai user baru sebelum menutup sesi root:

```bash
ssh deploy@203.0.113.10 "sudo whoami"
```

Perintah ini login sebagai `deploy` lalu menjalankan `whoami` dengan sudo. Hasil yang diharapkan adalah teks `root`, yang membuktikan sudo berfungsi. Selalu pastikan user baru bisa sudo sebelum menonaktifkan login root, agar tidak terkunci keluar dari server sendiri.

## Mengamankan Akses SSH

SSH adalah pintu utama ke VPS sekaligus target favorit serangan brute force otomatis. Beberapa langkah hardening dasar sangat disarankan.

Pertama, siapkan login berbasis key dan nonaktifkan login password. Dari komputer lokal, buat key jika belum ada lalu salin ke VPS:

```bash
ssh-copy-id deploy@203.0.113.10
```

Perintah ini mendaftarkan public key lokal ke file `authorized_keys` milik user `deploy` di server. Setelah berhasil, login seharusnya tidak meminta password lagi.

Kedua, sesuaikan konfigurasi daemon SSH di file `/etc/ssh/sshd_config`. Beberapa pengaturan yang umum direkomendasikan:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
```

Penjelasan tiap opsi: `PermitRootLogin no` melarang login langsung sebagai root, `PasswordAuthentication no` memaksa semua login memakai key, `PubkeyAuthentication yes` memastikan metode key tetap aktif, dan `MaxAuthTries 3` membatasi percobaan login per koneksi untuk mempersulit brute force.

Setelah mengedit file, uji sintaks dan restart service:

```bash
sudo sshd -t
```

Perintah ini memeriksa sintaks konfigurasi tanpa me-restart. Jika tidak ada output, berarti konfigurasi valid. Lanjutkan dengan restart:

```bash
sudo systemctl restart ssh
```

Perintah ini menerapkan konfigurasi baru. Penting untuk tidak menutup sesi SSH yang sedang berjalan sebelum menguji login di terminal baru. Jika ada kesalahan konfigurasi, sesi lama masih bisa dipakai untuk memperbaikinya.

Pertimbangkan juga mengganti port SSH default 22 ke port tinggi yang tidak umum, serta membatasi IP yang boleh mengakses SSH melalui firewall atau security group provider. Langkah ini tidak menggantikan key-based auth, tetapi signifikan mengurangi noise serangan otomatis di log.

## Firewall dengan UFW

Firewall membatasi port apa saja yang bisa diakses dari luar. Di Ubuntu, UFW (Uncomplicated Firewall) menyediakan antarmuka sederhana di atas iptables atau nftables.

Aktifkan aturan dasar secara berurutan:

```bash
sudo ufw default deny incoming
```

Perintah ini menetapkan kebijakan default menolak semua koneksi masuk yang tidak diizinkan eksplisit. Kebijakan default-deny jauh lebih aman dibanding default-allow.

```bash
sudo ufw default allow outgoing
```

Perintah ini mengizinkan semua koneksi keluar agar server tetap bisa mengunduh update, mengakses API eksternal, dan melakukan resolusi DNS.

```bash
sudo ufw allow OpenSSH
```

Perintah ini membuka port SSH berdasarkan profil aplikasi agar akses remote tidak terputus. Langkah ini wajib dijalankan sebelum firewall diaktifkan.

```bash
sudo ufw allow 'Nginx Full'
```

Profil `Nginx Full` membuka port 80 dan 443 sekaligus untuk HTTP dan HTTPS. Jika aplikasi masih tahap setup tanpa SSL, profil `Nginx HTTP` yang hanya membuka port 80 bisa dipakai sementara.

Aktifkan firewall:

```bash
sudo ufw enable
```

Perintah ini mengaktifkan firewall dan memastikan aturannya aktif otomatis setelah reboot. Verifikasi statusnya:

```bash
sudo ufw status verbose
```

Hasilnya kurang lebih menampilkan daftar aturan aktif beserta kebijakan default. Periksa kembali bahwa SSH terdaftar sebagai ALLOW sebelum menutup sesi, karena kesalahan urutan bisa mengunci akses remote.

## Update Sistem dan Tool Dasar

Selain update awal, siapkan tool diagnostik dan keamanan yang hampir selalu dibutuhkan:

```bash
sudo apt install -y curl wget git vim htop fail2ban unattended-upgrades
```

Penjelasan tiap package: `curl` dan `wget` untuk transfer data dan healthcheck, `git` untuk mengambil kode aplikasi, `vim` sebagai editor terminal, `htop` untuk monitoring proses interaktif, `fail2ban` untuk memblokir IP dengan pola brute force, dan `unattended-upgrades` untuk update keamanan otomatis.

Aktifkan update keamanan otomatis agar patch kritis tidak menunggu tindakan manual:

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

Perintah interaktif ini mengaktifkan periodic upgrade. Pilih yes saat ditanya. Konfigurasi tambahannya berada di direktori `/etc/apt/apt.conf.d/` dan bisa disesuaikan untuk me-reboot otomatis pada jam sepi jika dibutuhkan.

Konfigurasi dasar Fail2ban untuk SSH umumnya sudah aktif setelah instalasi. Periksa statusnya:

```bash
sudo fail2ban-client status sshd
```

Hasilnya menampilkan jumlah kegagalan dan daftar IP yang sedang di-ban. Tool ini melengkapi hardening SSH dengan memblokir sementara IP yang berulang kali salah login.

## Instalasi dan Konfigurasi Nginx

Nginx berperan sebagai reverse proxy dan static file server di depan aplikasi. Nginx menerima koneksi HTTPS dari internet, melayani file statis dengan efisien, lalu meneruskan request dinamis ke aplikasi backend.

Instal Nginx dari repository resmi:

```bash
sudo apt install -y nginx
```

Perintah ini menginstal Nginx beserta file service systemd-nya. Verifikasi service berjalan:

```bash
sudo systemctl enable --now nginx
```

Opsi `enable` membuat Nginx otomatis aktif saat boot, sedangkan `--now` langsung menjalankannya. Uji dari browser atau curl bahwa halaman default Nginx tampil melalui IP publik.

Buat konfigurasi virtual host untuk domain aplikasi, misalnya `/etc/nginx/sites-available/myapp`:

```nginx
server {
    listen 80;
    server_name app.contoh.com;

    root /var/www/myapp/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Penjelasan konfigurasi: blok `server` mendengarkan port 80 untuk domain `app.contoh.com`. Direktori `root` melayani file frontend statis dengan fallback ke `index.html` agar routing SPA tetap bekerja. Blok `/api/` meneruskan request ke aplikasi backend di port 3000 beserta header asli client agar aplikasi bisa mencatat IP dan skema yang benar.

Aktifkan site dan uji sintaks:

```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp
```

Perintah ini membuat symlink sesuai konvensi Debian dan Ubuntu. Lanjutkan dengan pengujian:

```bash
sudo nginx -t
```

Perintah ini memeriksa sintaks seluruh konfigurasi Nginx. Hasil yang diharapkan menyatakan sintaks oke dan test sukses. Terapkan perubahan:

```bash
sudo systemctl reload nginx
```

Perintah reload memuat konfigurasi baru tanpa memutus koneksi yang sedang berjalan, lebih aman dibanding restart penuh untuk perubahan rutin.

## Runtime Aplikasi dan Process Manager

Contoh pada artikel ini memakai Node.js, tetapi polanya serupa untuk Python dengan Gunicorn atau Go dengan binary systemd. Instal Node.js LTS melalui repository NodeSource atau metode resmi yang setara agar versinya mutakhir:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

Perintah ini mengunduh script setup dan mendaftarkan repository Node.js versi 20. Opsi `-fsSL` pada curl berarti gagal diam-diam saat error server tetapi tetap menampilkan error nyata, mengikuti redirect, dan bekerja non-interaktif. Lanjutkan instalasi:

```bash
sudo apt install -y nodejs
```

Verifikasi versi yang terinstal:

```bash
node --version && npm --version
```

Kedua perintah ini memastikan runtime dan package manager tersedia. Hasilnya kurang lebih menampilkan nomor versi seperti `v20.x` dan `10.x`.

Siapkan direktori aplikasi dengan kepemilikan yang benar:

```bash
sudo mkdir -p /var/www/myapp
sudo chown -R deploy:deploy /var/www/myapp
```

Perintah pertama membuat direktori, perintah kedua menyerahkan kepemilikannya ke user `deploy` agar proses deployment tidak membutuhkan root.

Agar aplikasi tetap berjalan setelah logout dan otomatis restart saat crash, gunakan service systemd. Contoh file `/etc/systemd/system/myapp.service`:

```ini
[Unit]
Description=Aplikasi Web MyApp
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/myapp
ExecStart=/usr/bin/node /var/www/myapp/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Penjelasan: service berjalan sebagai user `deploy` bukan root, direktori kerja menunjuk ke folder aplikasi, perintah utama menjalankan file server, dan kebijakan `Restart=always` menghidupkan ulang otomatis lima detik setelah crash. Variabel environment menetapkan mode production dan port internal.

Aktifkan service tersebut:

```bash
sudo systemctl daemon-reload
```

Perintah ini memuat definisi service baru. Lanjutkan:

```bash
sudo systemctl enable --now myapp
```

Perintah ini mengaktifkan auto-start saat boot sekaligus menjalankan service sekarang. Periksa statusnya:

```bash
sudo systemctl status myapp --no-pager
```

Hasilnya menampilkan status aktif, PID, dan beberapa baris log terakhir. Jika status gagal, baca log detail dengan `journalctl -u myapp -e` untuk melihat pesan error aplikasi.

Alternatif populer adalah PM2, process manager khusus Node.js dengan fitur clustering dan monitoring bawaan. Systemd umumnya cukup dan sudah terintegrasi dengan sistem, sedangkan PM2 unggul untuk deployment multi-proses cepat tanpa menulis file service manual. Pilih salah satu secara konsisten agar operasional tidak membingungkan.

## Domain, DNS, dan SSL dengan Certbot

Agar aplikasi bisa diakses melalui nama domain dengan HTTPS, tiga hal harus disiapkan: record DNS, virtual host Nginx yang sesuai, dan sertifikat SSL.

Di panel DNS provider domain, buat dua record bertipe A yang menunjuk ke IP VPS:

```text
app.contoh.com.     300  IN  A  203.0.113.10
www.app.contoh.com. 300  IN  A  203.0.113.10
```

Penjelasan: record A memetakan nama host ke alamat IPv4. Nilai 300 adalah TTL dalam detik yang menentukan berapa lama resolver boleh meng-cache. Tunggu propagasi beberapa menit lalu verifikasi dari VPS:

```bash
dig +short app.contoh.com
```

Hasil yang diharapkan adalah IP VPS yang sama. Jika masih kosong atau menunjuk IP lama, berarti cache DNS belum kedaluwarsa atau record salah ditulis.

Setelah DNS mengarah benar, pasang Certbot untuk mendapatkan sertifikat gratis dari Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Package kedua adalah plugin Nginx yang otomatis mengubah konfigurasi virtual host untuk HTTPS. Minta dan pasang sertifikat dengan perintah:

```bash
sudo certbot --nginx -d app.contoh.com -d www.app.contoh.com
```

Perintah interaktif ini memverifikasi kepemilikan domain melalui tantangan HTTP, mengunduh sertifikat, memperbarui konfigurasi Nginx, dan mengatur redirect HTTP ke HTTPS. Ikuti prompt email dan persetujuan TOS yang muncul.

Uji pembaruan otomatis sertifikat:

```bash
sudo certbot renew --dry-run
```

Perintah ini mensimulasikan proses renewal tanpa benar-benar mengganti sertifikat. Hasil sukses menandakan timer systemd Certbot akan mampu memperpanjang sertifikat sebelum kedaluwarsa 90 hari. Verifikasi timer aktif dengan `systemctl list-timers | grep certbot`.

## Log dan Monitoring Dasar

Log adalah sumber utama saat troubleshooting. Biasakan mengetahui lokasi tiga jenis log berikut.

Log aplikasi systemd dibaca dengan journalctl:

```bash
journalctl -u myapp -f
```

Opsi `-f` mengikuti log secara live seperti `tail -f`. Tambahkan `-e` untuk lompat ke akhir atau `--since "1 hour ago"` untuk membatasi rentang waktu.

Log akses dan error Nginx berada di `/var/log/nginx/access.log` dan `/var/log/nginx/error.log`. Contoh memantau error secara live:

```bash
sudo tail -f /var/log/nginx/error.log
```

Perintah ini menampilkan baris baru yang masuk secara realtime. Pola 502 atau 504 di log ini sering berpasangan dengan aplikasi backend yang down atau timeout.

Untuk kesehatan sistem umum, perintah berikut memberikan gambaran cepat tanpa tool tambahan:

```bash
df -h / && free -h && uptime
```

Rangkaian ini menampilkan ruang disk, penggunaan memori, dan load average. Jika disk root di atas 85 persen atau load jauh melebihi jumlah CPU dalam waktu lama, saatnya investigasi lanjutan sebelum menambah kapasitas. Untuk monitoring berkelanjutan, pertimbangkan Node Exporter dan Prometheus atau layanan monitoring bawaan provider cloud.

Aktifkan juga rotasi log agar disk tidak penuh oleh log yang membengkak. Paket `logrotate` umumnya sudah terinstal dan memiliki konfigurasi default untuk Nginx dan syslog. Pastikan aplikasi sendiri menulis log ke stdout agar dikelola journald, bukan ke file manual tanpa rotasi.

## Dasar Backup

Backup yang tidak pernah diuji sama berbahayanya dengan tidak punya backup. Minimal ada tiga hal yang dicadangkan: file aplikasi, file konfigurasi, dan database.

Contoh backup file dan konfigurasi:

```bash
sudo tar -czf /var/backups/myapp-$(date +%F).tar.gz -C /var/www myapp -C /etc/nginx/sites-available myapp
```

Perintah ini membuat arsip bertaanggal berisi kode aplikasi dan virtual host Nginx. Simpan hasilnya di direktori backup khusus, idealnya disinkronkan pula ke object storage atau server lain agar tidak hilang bersama VPS yang sama saat bencana.

Contoh backup database PostgreSQL:

```bash
pg_dump -U appuser -h localhost appdb | gzip > /var/backups/db-$(date +%F).sql.gz
```

Perintah ini mengekspor database lalu mengompresinya. Jadwalkan kedua backup di atas melalui cron harian dan uji restore berkala ke environment staging. Backup yang belum pernah di-restore belum bisa dianggap valid.

Dokumentasikan lokasi backup, jadwal, retensi, dan prosedur restore dalam satu halaman runbook agar siapa pun di tim bisa mengeksekusinya saat insiden tanpa menebak-nebak.

## Keamanan Dasar Tambahan

Selain SSH dan firewall, beberapa lapisan keamanan dasar berikut layak diterapkan sejak awal.

Pertama, buat user database dan sistem dengan prinsip least privilege. Aplikasi web sebaiknya memakai akun database yang hanya punya akses ke satu database, bukan superuser. Begitu pula user sistem untuk aplikasi tidak perlu sudo.

Kedua, aktifkan fail2ban untuk SSH dan, jika perlu, untuk Nginx dengan filter rate limiting. Tinjau log auth secara berkala:

```bash
sudo grep "Failed password" /var/log/auth.log | tail -n 20
```

Perintah ini menampilkan 20 upaya login gagal terakhir. Pola serangan dari satu IP berulang menandakan fail2ban bekerja atau perlu tuning.

Ketiga, batasi akses port internal. Port aplikasi seperti 3000 seharusnya hanya didengar di `127.0.0.1` dan diakses publik melalui Nginx, bukan dibuka ke internet. Verifikasi dengan `ss -tuln` bahwa tidak ada port sensitif seperti database yang terekspos.

Keempat, jaga update keamanan otomatis tetap aktif dan jadwalkan jendela maintenance untuk update mayor. Aktifkan juga autentikasi dua faktor di panel provider cloud, karena siapa pun yang menguasai panel tersebut effectively menguasai VPS-nya.

## Production Checklist

Sebelum mengumumkan aplikasi siap production, telusuri checklist berikut satu per satu.

- [ ] Login root via password dimatikan, SSH hanya dengan key, dan user `deploy` bisa sudo.
- [ ] Firewall UFW aktif dengan kebijakan default-deny dan hanya port 22, 80, 443 yang terbuka sesuai kebutuhan.
- [ ] Nginx terinstal, virtual host lolos `nginx -t`, dan reload berjalan tanpa downtime.
- [ ] Aplikasi berjalan sebagai service systemd dengan user non-root dan restart otomatis.
- [ ] DNS domain mengarah ke IP VPS dan sertifikat SSL aktif dengan renewal otomatis teruji.
- [ ] Healthcheck endpoint merespons 200 dan dimonitor dari luar.
- [ ] Log aplikasi, Nginx, dan sistem mudah diakses dan terotasi.
- [ ] Backup file dan database terjadwal dan sudah diuji restore minimal satu kali.
- [ ] Port internal tidak terekspos ke publik dan kredensial tersimpan aman, bukan di kode.
- [ ] Rencana rollback dan kontak on-call terdokumentasi dan diketahui tim.

Checklist ini sebaiknya disimpan sebagai dokumen hidup di repository atau wiki tim, bukan sekadar diingat. Setiap perubahan infrastruktur besar harus memperbarui checklist agar tetap relevan.

## Kesimpulan

Menyiapkan VPS Linux dari nol pada dasarnya adalah menyusun lapisan demi lapisan: akses aman, firewall, runtime, reverse proxy, domain, SSL, observabilitas, dan backup. Setiap lapisan saling melengkapi. SSH yang aman percuma jika firewall terbuka lebar, dan aplikasi yang cepat percuma jika tanpa backup dan monitoring.

Mulailah dari setup minimal yang aman untuk satu aplikasi, dokumentasikan setiap perintah dan keputusan konfigurasi, lalu kembangkan bertahap sesuai kebutuhan seperti CI/CD deployment, monitoring Prometheus, dan backup offsite. Dengan fondasi yang terstruktur sejak awal, VPS akan jauh lebih mudah dirawat, di-scale, dan di-troubleshoot ketika trafik dan kompleksitas aplikasi bertambah.

