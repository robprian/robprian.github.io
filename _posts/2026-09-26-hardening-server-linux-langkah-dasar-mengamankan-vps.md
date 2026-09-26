---
layout: post
title: "Hardening Server Linux: Langkah Dasar Mengamankan VPS"
date: 2026-09-26 13:29:12 +0000
description: "Langkah-langkah dasar untuk meningkatkan keamanan server Linux dan VPS sebelum digunakan untuk production."
categories: []
tags: []
---

# Hardening Server Linux: Langkah Dasar Mengamankan VPS

Virtual Private Server (VPS) yang baru dibuat pada umumnya berada dalam kondisi instalasi bawaan yang cukup terbuka. Port SSH terbuka ke internet, user root aktif, dan belum ada firewall yang dikonfigurasi secara spesifik. Kondisi seperti ini wajar untuk kemudahan instalasi awal, tetapi tidak ideal jika server sudah mulai digunakan untuk production, staging, atau bahkan sekadar menyimpan data penting. Hardening adalah proses memperkuat konfigurasi server agar permukaan serangan menjadi sekecil mungkin, sekaligus memastikan aktivitas mencurigakan dapat terdeteksi lebih cepat.

Artikel ini membahas langkah dasar hardening server Linux untuk VPS, mulai dari update sistem, penguatan SSH, manajemen user, firewall, hingga backup dan monitoring. Fokus pembahasan bersifat defensif, yaitu bagaimana mengamankan server milik sendiri, bukan bagaimana menyerang sistem pihak lain. Langkah-langkah berikut dapat diterapkan pada distribusi populer seperti Ubuntu dan Debian, dengan penyesuaian kecil untuk distribusi berbasis RHEL seperti AlmaLinux atau Rocky Linux.

## 1. Mulai dengan Update Sistem dan Inventarisasi Awal

Sebelum mengubah konfigurasi keamanan, pastikan sistem berada dalam kondisi terbaru dan administrator memahami apa saja yang berjalan di dalam server. Paket yang usang sering kali mengandung kerentanan yang sudah diketahui publik, sehingga update rutin adalah fondasi yang tidak boleh dilewatkan.

Perintah berikut memperbarui daftar paket dan meng-upgrade paket yang tersedia pada sistem berbasis APT:

```bash
sudo apt update && sudo apt upgrade -y
```

Perintah `apt update` berfungsi untuk menyinkronkan indeks paket dari repository, sedangkan `apt upgrade` menginstal versi terbaru dari paket yang sudah terpasang. Opsi `-y` menjawab konfirmasi secara otomatis agar proses tidak berhenti menunggu input manual.

Setelah update, periksa service apa saja yang sedang berjalan dan port apa saja yang terbuka ke jaringan:

```bash
sudo systemctl list-units --type=service --state=running
```

Perintah di atas menampilkan daftar service systemd yang sedang aktif, sehingga administrator dapat menilai apakah ada service yang tidak dibutuhkan.

```bash
sudo ss -tulpn
```

Perintah `ss -tulpn` menampilkan koneksi TCP dan UDP yang sedang listen, lengkap dengan nomor port, alamat bind, dan nama proses. Opsi `t` berarti TCP, `u` berarti UDP, `l` berarti listen, `p` menampilkan nama proses, dan `n` menonaktifkan resolusi nama agar output lebih cepat dibaca. Dari hasil perintah ini, administrator bisa memutuskan service mana yang perlu dipertahankan dan mana yang sebaiknya dinonaktifkan.

Untuk server production, aktifkan juga update keamanan otomatis agar patch penting tidak tertunda terlalu lama. Pada Ubuntu, paket `unattended-upgrades` dapat digunakan untuk kebutuhan tersebut:

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

Perintah pertama menginstal layanan update otomatis, sedangkan perintah kedua membuka dialog konfigurasi untuk mengaktifkannya. Hasil konfigurasi umumnya cukup untuk update keamanan, tanpa harus mengaktifkan upgrade mayor secara otomatis yang berisiko mengubah perilaku aplikasi.

## 2. Kelola User, Hak Akses, dan Sudo dengan Prinsip Least Privilege

Salah satu kesalahan umum pada VPS baru adalah semua pekerjaan administrasi dilakukan langsung sebagai user `root`. Praktik ini berisiko karena kesalahan kecil dapat berdampak besar, dan jejak audit menjadi kurang jelas ketika beberapa orang berbagi akun yang sama. Pendekatan yang lebih aman adalah membuat user administratif per orang, lalu memberikan hak `sudo` secara selektif.

Contoh pembuatan user baru beserta direktori home-nya:

```bash
sudo adduser deploy
```

Perintah `adduser` bersifat interaktif dan akan meminta password serta informasi tambahan. User `deploy` pada contoh ini dimaksudkan sebagai akun operasional untuk deployment dan administrasi harian.

Selanjutnya, berikan hak `sudo` kepada user tersebut:

```bash
sudo usermod -aG sudo deploy
```

Perintah `usermod -aG sudo deploy` menambahkan user `deploy` ke grup `sudo` tanpa menghapus keanggotaan grup lain yang sudah ada karena adanya opsi `-a` yang berarti append. Pada sistem berbasis RHEL, grup yang setara adalah `wheel`, sehingga perintahnya menjadi `usermod -aG wheel deploy`.

Pastikan konfigurasi `sudo` meminta password dan mencatat setiap eksekusi perintah. Perilaku bawaan `sudo` umumnya sudah mencatat aktivitas ke log sistem, yang dapat diperiksa melalui perintah berikut:

```bash
sudo grep sudo /var/log/auth.log
```

Perintah tersebut menyaring log autentikasi untuk menemukan riwayat penggunaan `sudo`, termasuk user yang menjalankannya, waktu eksekusi, dan perintah yang dijalankan. Informasi ini penting untuk audit, terutama ketika server dikelola oleh lebih dari satu orang.

Terapkan prinsip least privilege, yaitu setiap user hanya memiliki hak akses minimum yang dibutuhkan untuk pekerjaannya. Akun aplikasi sebaiknya tidak memiliki hak `sudo` sama sekali, dan akun manusia sebaiknya tidak digunakan untuk menjalankan service aplikasi secara langsung.

## 3. Hardening SSH: Kunci Autentikasi dan Konfigurasi Aman

SSH adalah pintu utama administrasi VPS sekaligus target pemindaian otomatis yang paling sering terlihat di log. Oleh karena itu, penguatan SSH memberikan dampak keamanan yang signifikan. Tiga langkah utama yang direkomendasikan adalah menggunakan key-based authentication, menonaktifkan login password dan login root langsung, serta mempertimbangkan ulang konfigurasi port dan akses jaringan.

### 3.1 Menggunakan SSH Key Authentication

Autentikasi berbasis kunci SSH jauh lebih tahan terhadap brute force dibandingkan password, karena private key memiliki entropi yang jauh lebih besar dan tidak dapat ditebak melalui kamus password. Langkah umumnya adalah membuat key pair di komputer lokal, lalu menempatkan public key di server.

Contoh pembuatan key pair dengan algoritma Ed25519 di komputer lokal:

```bash
ssh-keygen -t ed25519 -C "deploy@laptop-kerja"
```

Opsi `-t ed25519` memilih algoritma Ed25519 yang modern dan efisien, sedangkan opsi `-C` menambahkan komentar sebagai penanda agar mudah dikenali ketika administrator memiliki banyak key. Hasil perintah ini berupa sepasang file, yaitu private key yang harus dijaga kerahasiaannya dan public key dengan ekstensi `.pub` yang boleh disalin ke server.

Salin public key ke server menggunakan perintah berikut:

```bash
ssh-copy-id deploy@203.0.113.10
```

Perintah `ssh-copy-id` akan menambahkan isi public key ke berkas `~/.ssh/authorized_keys` milik user tujuan di server. Alamat IP di atas hanyalah contoh dan perlu diganti dengan alamat VPS yang sebenarnya. Setelah proses ini berhasil, login berikutnya dapat menggunakan kunci tanpa harus mengetikkan password akun server, kecuali jika private key tersebut diproteksi dengan passphrase, yang justru direkomendasikan.

Pastikan permission direktori dan berkas SSH sudah benar di sisi server:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Permission `700` berarti hanya pemilik yang dapat membaca, menulis, dan masuk ke direktori `.ssh`, sedangkan permission `600` berarti hanya pemilik yang dapat membaca dan menulis berkas `authorized_keys`. Konfigurasi permission yang terlalu longgar dapat menyebabkan SSH menolak autentikasi berbasis kunci demi keamanan.

### 3.2 Menonaktifkan Password Authentication dan Root Login

Setelah key-based authentication dipastikan berfungsi, langkah berikutnya adalah menonaktifkan autentikasi password dan login langsung sebagai root. Kedua opsi ini sering menjadi target brute force otomatis.

Buka berkas konfigurasi SSH daemon:

```bash
sudo nano /etc/ssh/sshd_config
```

Kemudian pastikan parameter berikut sudah diatur:

```bash
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

Parameter `PasswordAuthentication no` menonaktifkan login menggunakan password, `PermitRootLogin no` melarang login langsung sebagai root, dan `PubkeyAuthentication yes` memastikan login menggunakan public key tetap diizinkan. Setelah menyimpan perubahan, uji validitas konfigurasi sebelum me-restart service agar tidak terkunci dari server:

```bash
sudo sshd -t
sudo systemctl restart ssh
```

Perintah `sshd -t` berfungsi untuk menguji sintaks konfigurasi tanpa menerapkan perubahan. Jika tidak ada pesan error, barulah service SSH di-restart dengan aman. Sangat disarankan untuk menjaga satu sesi SSH yang sudah terhubung tetap terbuka saat melakukan perubahan, lalu membuka sesi baru untuk menguji hasil konfigurasi. Dengan cara ini, apabila terjadi kesalahan, administrator masih memiliki sesi aktif untuk memperbaikinya.

### 3.3 Pertimbangan Mengganti Port SSH

Mengganti port bawaan SSH dari 22 ke port non-standar, misalnya 2222 atau port tinggi lainnya, dapat mengurangi volume log brute force dari bot otomatis yang hanya memindai port bawaan. Namun penting untuk dipahami bahwa langkah ini bukan pengamanan utama, melainkan hanya mengurangi noise. Keamanan sesungguhnya tetap berasal dari key authentication, konfigurasi yang benar, dan pembatasan akses jaringan.

Apabila port diubah, pastikan firewall dan security group cloud sudah disesuaikan, karena kesalahan pada langkah ini adalah penyebab umum administrator terkunci dari servernya sendiri. Bagian firewall akan dibahas lebih lanjut pada seksi berikutnya.

## 4. Menonaktifkan Service yang Tidak Diperlukan

Setiap service tambahan yang berjalan berarti tambahan potensi kerentanan dan kerumitan operasional. Prinsipnya sederhana, yaitu hanya jalankan apa yang benar-benar dibutuhkan oleh aplikasi. Hasil perintah `ss -tulpn` sebelumnya dapat dijadikan acuan untuk menentukan service mana yang membuka port ke jaringan.

Contoh menonaktifkan dan menghentikan service yang tidak digunakan:

```bash
sudo systemctl stop telnet
sudo systemctl disable telnet
```

Perintah `stop` menghentikan service yang sedang berjalan, sedangkan `disable` mencegah service tersebut berjalan otomatis saat boot. Nama service di atas hanyalah contoh, karena Telnet memang sebaiknya tidak digunakan lagi untuk administrasi jarak jauh akibat lalu lintasnya tidak terenkripsi.

Untuk melihat service yang aktif saat boot:

```bash
sudo systemctl list-unit-files --state=enabled
```

Output perintah ini membantu administrator meninjau kembali daftar service yang akan berjalan otomatis. Jika VPS hanya digunakan sebagai web server, umumnya cukup menjalankan SSH, firewall, web server atau reverse proxy, dan agen monitoring. Database, mail server, atau panel kontrol tambahan sebaiknya tidak diinstal apabila tidak dibutuhkan.

## 5. Mengaktifkan Firewall dengan UFW

Firewall berfungsi membatasi lalu lintas jaringan hanya pada port dan sumber yang memang diperlukan. Pada Ubuntu, `ufw` atau Uncomplicated Firewall menyediakan antarmuka yang relatif mudah digunakan di atas `iptables` atau `nftables`.

Contoh konfigurasi dasar untuk web server:

```bash
sudo apt install ufw -y
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw enable
```

Penjelasan tiap perintah cukup lugas. Perintah pertama memastikan `ufw` terinstal. Perintah kedua menolak semua koneksi masuk secara bawaan, sedangkan perintah ketiga mengizinkan semua koneksi keluar agar server tetap dapat mengunduh update dan berkomunikasi dengan layanan eksternal. Perintah keempat membuka port SSH agar akses administrasi tidak terputus, dan perintah terakhir mengaktifkan firewall. Apabila SSH menggunakan port kustom, ganti `22` dengan nomor port yang sesuai.

Untuk web server, tambahkan aturan HTTP dan HTTPS:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Port `80` digunakan untuk HTTP, sedangkan port `443` digunakan untuk HTTPS. Setelah aturan ditambahkan, periksa status firewall:

```bash
sudo ufw status verbose
```

Output perintah ini menampilkan daftar aturan aktif beserta kebijakan bawaan. Kebiasaan yang baik adalah meninjau ulang aturan firewall setiap kali ada aplikasi baru yang di-deploy, agar tidak ada port yang terbuka lebih lebar dari yang seharusnya.

Pada penyedia cloud, umumnya terdapat lapisan firewall tambahan berupa security group. Pastikan aturan security group selaras dengan aturan `ufw`, misalnya hanya membuka port database untuk alamat internal dan bukan untuk seluruh internet.

## 6. Memasang Fail2ban untuk Mengurangi Brute Force

Fail2ban adalah utilitas yang memantau log sistem dan secara otomatis memblokir alamat IP yang menunjukkan perilaku mencurigakan, seperti terlalu banyak percobaan login SSH yang gagal dalam periode tertentu. Fail2ban bukan pengganti autentikasi yang kuat, tetapi membantu mengurangi beban log dan percobaan otomatis yang terus-menerus.

Instalasi dan aktivasi dasar pada Ubuntu:

```bash
sudo apt install fail2ban -y
sudo systemctl enable --now fail2ban
```

Perintah pertama menginstal fail2ban, sedangkan perintah kedua mengaktifkan dan langsung menjalankan servicenya. Konfigurasi bawaan umumnya sudah menyertakan proteksi untuk SSH, tetapi administrator dapat membuat berkas override lokal agar perubahan tidak tertimpa saat update paket:

```bash
sudo nano /etc/fail2ban/jail.local
```

Contoh isi minimal untuk proteksi SSH:

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
```

Parameter `maxretry` menentukan jumlah kegagalan yang ditoleransi, `findtime` menentukan jendela waktu pengamatan, dan `bantime` menentukan durasi pemblokiran. Pada contoh di atas, alamat IP yang gagal login lima kali dalam sepuluh menit akan diblokir selama satu jam. Hasilnya kurang lebih seperti entri log ban yang tercatat pada `fail2ban.log`, beserta alamat IP yang masuk daftar blokir sementara.

Untuk memeriksa status jail SSH:

```bash
sudo fail2ban-client status sshd
```

Perintah ini menampilkan jumlah kegagalan yang terdeteksi dan daftar IP yang sedang diblokir. Perlu diingat agar tidak memblokir alamat kantor atau CI/CD sendiri secara tidak sengaja. Jika diperlukan, tambahkan parameter `ignoreip` berisi alamat IP tepercaya yang tidak boleh diblokir.

## 7. File Permission, Ownership, dan Secrets Handling

Banyak insiden keamanan bermula dari permission berkas yang terlalu longgar atau kredensial yang tersimpan sembarangan. Pada server Linux, permission dan ownership adalah mekanisme kontrol akses utama yang harus dipahami dengan baik.

Periksa permission berkas sensitif secara berkala:

```bash
ls -l /etc/shadow /etc/ssh/sshd_config
```

Berkas `/etc/shadow` menyimpan hash password dan seharusnya hanya dapat dibaca oleh root, sedangkan berkas konfigurasi SSH tidak boleh dapat ditulis oleh user biasa. Apabila ditemukan permission yang janggal, perbaiki dengan `chmod` dan `chown` sesuai kebutuhan aplikasi.

Untuk direktori web, hindari permission `777` karena memberikan hak tulis kepada semua user di sistem. Pendekatan yang lebih aman adalah memberikan kepemilikan kepada user aplikasi dan hak baca kepada web server, misalnya:

```bash
sudo chown -R deploy:www-data /var/www/aplikasi
sudo find /var/www/aplikasi -type d -exec chmod 755 {} \;
sudo find /var/www/aplikasi -type f -exec chmod 644 {} \;
```

Perintah pertama mengubah ownership rekursif ke user `deploy` dan grup `www-data`. Perintah kedua mengatur direktori menjadi `755` agar dapat dibaca dan dilalui oleh proses lain, sedangkan perintah ketiga mengatur berkas menjadi `644` agar dapat dibaca tetapi hanya dapat ditulis oleh pemilik. File yang memang harus dapat ditulis oleh aplikasi, seperti direktori upload, perlu ditangani secara khusus dan terisolasi, bukan dengan melonggarkan seluruh permission.

Terkait secrets handling, jangan menyimpan password, API key, atau token langsung di dalam source code maupun di histori Git. Gunakan environment variable atau file konfigurasi terpisah dengan permission ketat:

```bash
sudo nano /etc/aplikasi/.env
sudo chmod 600 /etc/aplikasi/.env
sudo chown deploy:deploy /etc/aplikasi/.env
```

Permission `600` memastikan hanya pemilik berkas yang dapat membaca secrets tersebut. Untuk kebutuhan yang lebih besar, pertimbangkan secret manager dari penyedia cloud atau solusi seperti HashiCorp Vault, agar rotasi kredensial dan kontrol akses dapat dikelola secara terpusat.

## 8. Logging, Backup, dan Monitoring Dasar

Server yang aman belum tentu server yang mudah didiagnosis ketika terjadi masalah. Oleh karena itu, logging, backup, dan monitoring perlu disiapkan sejak awal, bukan setelah insiden terjadi.

Untuk log autentikasi dan sistem, perintah berikut sangat membantu saat investigasi:

```bash
sudo tail -n 100 /var/log/auth.log
sudo journalctl -u ssh -n 50 --no-pager
```

Perintah pertama menampilkan seratus baris terakhir log autentikasi, tempat tercatat login sukses, login gagal, dan penggunaan `sudo`. Perintah kedua menampilkan log khusus service SSH melalui `journalctl`, dengan opsi `-n 50` untuk membatasi jumlah baris dan `--no-pager` agar output langsung tampil tanpa paging interaktif.

Pastikan waktu server akurat karena timestamp log sangat bergantung padanya:

```bash
timedatectl status
```

Jika waktu tidak sinkron, investigasi lintas sistem akan menjadi sulit. Pada umumnya layanan sinkronisasi waktu seperti `systemd-timesyncd` atau `chrony` sudah aktif secara bawaan pada image cloud modern, tetapi statusnya tetap layak diperiksa.

Untuk backup, minimal pastikan ada salinan data aplikasi, database, dan berkas konfigurasi penting seperti konfigurasi Nginx dan SSH. Backup perlu diuji restore-nya secara berkala, karena backup yang belum pernah diuji sering kali baru diketahui rusak pada saat paling dibutuhkan. Simpan backup di lokasi terpisah dari VPS utama, misalnya object storage, agar tetap tersedia ketika VPS mengalami gangguan besar.

Monitoring dasar dapat dimulai dari hal sederhana, seperti pemantauan penggunaan CPU, memori, disk, dan status service penting. Notifikasi ketika disk hampir penuh atau service berhenti sering kali mencegah gangguan kecil berkembang menjadi downtime yang panjang.

## 9. Checklist Keamanan Praktis Sebelum Go-Live

Checklist berikut dapat digunakan sebagai pemeriksaan terakhir sebelum VPS digunakan untuk production. Setiap poin sebaiknya diverifikasi satu per satu dan didokumentasikan.

- Sistem sudah di-update dan update keamanan otomatis sudah aktif.
- Login menggunakan SSH key, login password sudah dinonaktifkan.
- Login langsung sebagai root sudah dinonaktifkan.
- Hanya ada satu atau sedikit akun dengan hak `sudo`, dan setiap akun dimiliki oleh orang yang jelas.
- Service yang tidak dibutuhkan sudah dihentikan dan dinonaktifkan.
- Firewall aktif dengan kebijakan default deny untuk koneksi masuk.
- Hanya port yang dibutuhkan yang terbuka, seperti SSH, HTTP, dan HTTPS.
- Fail2ban terinstal dan jail SSH dalam kondisi aktif.
- Permission berkas sensitif dan direktori aplikasi sudah benar, tidak ada `777` yang tersisa.
- Secrets tidak tersimpan di repository, melainkan di environment variable atau berkas dengan permission `600`.
- Log autentikasi dapat dibaca dan waktu server sudah sinkron.
- Backup sudah berjalan dan prosedur restore sudah pernah diuji.
- Monitoring dasar untuk resource dan status service sudah aktif.

Apabila salah satu poin belum terpenuhi, sebaiknya selesaikan terlebih dahulu sebelum aplikasi dibuka ke internet secara luas. Checklist ini juga layak dijalankan ulang secara berkala, misalnya setiap bulan atau setiap kali ada perubahan besar pada server.

## Kesimpulan

Hardening server Linux bukan pekerjaan sekali jalan, melainkan kebiasaan operasional yang berkelanjutan. Langkah dasar seperti update rutin, SSH key authentication, pembatasan hak user, firewall yang ketat, fail2ban, permission yang benar, pengelolaan secrets, serta logging, backup, dan monitoring sudah mampu menutup sebagian besar celah umum pada VPS. Kuncinya adalah mengurangi permukaan serangan seminimal mungkin, mencatat setiap aktivitas penting, dan memastikan ada jalan pemulihan ketika terjadi masalah. Dengan fondasi ini, VPS menjadi jauh lebih siap digunakan untuk production, dan pekerjaan keamanan lanjutan seperti audit berkala, vulnerability scanning, dan peningkatan arsitektur jaringan dapat dilakukan di atas dasar yang kokoh.

