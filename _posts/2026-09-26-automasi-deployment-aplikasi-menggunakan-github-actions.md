---
layout: post
title: "Automasi Deployment Aplikasi Menggunakan GitHub Actions"
date: 2026-09-26 13:29:16 +0000
description: "Membangun workflow deployment otomatis menggunakan GitHub Actions agar perubahan kode dapat diproses secara konsisten menuju environment production."
categories: []
tags: []
---

# Automasi Deployment Aplikasi Menggunakan GitHub Actions

Banyak tim sudah terbiasa menggunakan Git untuk version control, tetapi proses deployment-nya masih manual: pull kode di VPS lewat SSH, menjalankan build, restart service, lalu berdoa tidak ada yang terlewat. Cara ini rawan lupa langkah, sulit direproduksi, dan tidak meninggalkan jejak audit yang jelas tentang siapa mendeploy apa dan kapan.

GitHub Actions memungkinkan proses delivery ke VPS diotomatisasi langsung dari repository. Setiap push atau tag dapat memicu alur build, test, dan deploy yang konsisten. Artikel ini berfokus pada sudut deployment delivery ke VPS, bukan sekadar pengenalan CI/CD secara umum: bagaimana workflow dipicu, bagaimana artefak dibangun dan dikirim, bagaimana rahasia dikelola, serta bagaimana deployment dibuat aman dengan healthcheck, backup, dan strategi rollback.

## Rekap Singkat Git Workflow dan CI/CD

Dalam alur Git modern, kode dikembangkan di branch fitur, di-review melalui pull request, lalu digabungkan ke branch utama seperti `main`. Branch `main` dianggap selalu dalam kondisi dapat di-deploy. Setiap penggabungan seharusnya melewati automated check agar regresi tertangkap lebih awal.

CI (Continuous Integration) memastikan setiap perubahan terintegrasi dan teruji otomatis. CD bisa berarti Continuous Delivery (artefak selalu siap di-deploy dengan persetujuan manual) atau Continuous Deployment (setiap perubahan yang lolos otomatis terkirim ke production). Fokus artikel ini adalah varian kedua dalam skala VPS: perubahan yang lolos build dan test otomatis dikirim ke server production melalui SSH.

Perbedaan sudut pandang ini penting. Artikel pengantar CI/CD biasanya berhenti pada pipeline build dan test. Di sini pipeline diperpanjang sampai ke langkah delivery: koneksi ke VPS, transfer artefak, migrasi, restart service, verifikasi kesehatan, dan rencana kembali jika gagal.

## Konsep Workflow, Job, dan Runner

GitHub Actions tersusun dari beberapa konsep inti. Workflow adalah file YAML di direktori `.github/workflows/` yang mendefinisikan automation. Event adalah pemicu seperti push, pull request, pembuatan tag, atau jadwal cron. Job adalah unit kerja yang berjalan di runner, dan setiap job berisi urutan step. Step bisa berupa perintah shell langsung atau action yang dibuat komunitas maupun internal tim.

Runner adalah mesin eksekutor. GitHub menyediakan hosted runner Ubuntu, Windows, dan macOS, tetapi pengguna juga bisa memasang self-hosted runner di infrastruktur sendiri. Untuk skenario deploy ke VPS, pola paling umum adalah memakai hosted runner untuk build dan test, lalu dari runner tersebut membuka koneksi SSH ke VPS untuk melakukan deployment. Dengan pola ini VPS tidak perlu menginstal agen tambahan.

File workflow minimal selalu memiliki tiga blok utama: `name` sebagai nama tampilan, `on` sebagai daftar pemicu, dan `jobs` sebagai daftar pekerjaan. Setiap job menentukan `runs-on` untuk memilih sistem operasi runner serta `steps` untuk urutan eksekusinya.

## Pemicu Workflow untuk Deployment

Pemilihan pemicu menentukan seberapa agresif automation berjalan. Beberapa pola umum:

- **Deploy saat push ke `main`:** setiap merge yang lolos otomatis terkirim. Cocok untuk tim kecil dengan test yang solid.
- **Deploy saat tag `v*` dibuat:** rilis versi eksplisit seperti `v1.2.0` menjadi penanda deployment. Cocok ketika dibutuhkan kontrol versi dan catatan rilis.
- **Deploy manual dengan `workflow_dispatch`:** deployment dijalankan dari tombol di UI GitHub dengan input parameter seperti pilihan environment. Cocok untuk production yang butuh persetujuan manusia.
- **Deploy terjadwal:** jarang dipakai untuk production, tetapi berguna untuk sinkronisasi data atau rebuild image berkala.

Contoh blok pemicu gabungan:

```yaml
on:
  push:
    branches: ["main"]
    paths-ignore:
      - "**.md"
  workflow_dispatch:
    inputs:
      environment:
        description: "Target deployment"
        required: true
        default: "production"
        type: choice
        options:
          - staging
          - production
```

Penjelasan konfigurasi: workflow berjalan otomatis setiap ada push ke branch `main`, kecuali jika perubahan hanya menyentuh file dokumentasi Markdown. Selain itu workflow bisa dipicu manual dengan pilihan environment. Pola ini menggabungkan automation dan kontrol manusia dalam satu file.

Untuk deployment berbasis tag, gunakan pola berikut:

```yaml
on:
  push:
    tags:
      - "v*.*.*"
```

Konfigurasi ini hanya berjalan ketika tag dengan format versi di-push, misalnya `v2.1.0`. Setiap tag umumnya diasosiasikan dengan GitHub Release sehingga artefak dan catatan perubahan terdokumentasi rapi.

## Tahap Build dan Test Sebelum Deploy

Deployment yang aman tidak pernah melompati tahap build dan test. Runner men-checkout kode, menyiapkan runtime, menginstal dependensi dengan cache, lalu menjalankan test dan build artefak. Hanya jika semua langkah sukses, job deploy dijalankan.

Contoh job build dan test untuk aplikasi Node.js:

```yaml
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Instal dependensi
        run: npm ci

      - name: Jalankan test
        run: npm test -- --ci

      - name: Build artefak production
        run: npm run build
```

Penjelasan tiap step:

- `actions/checkout` mengunduh kode repository ke runner.
- `actions/setup-node` menyiapkan Node.js versi 20 sekaligus mengaktifkan cache npm agar instalasi berikutnya lebih cepat.
- `npm ci` menginstal dependensi persis sesuai lockfile, lebih deterministik dibanding `npm install` untuk environment automation.
- Test dijalankan dengan flag CI agar output-nya non-interaktif dan gagal cepat saat ada assertion yang tidak terpenuhi.
- Build menghasilkan direktori artefak seperti `dist/` atau `.next/` yang siap dikirim ke VPS.

Hasil build bisa diteruskan antar job melalui artefak GitHub agar job deploy tidak perlu me-rebuild dari nol:

```yaml
      - name: Upload artefak build
        uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: dist/
          retention-days: 7
```

Step ini menyimpan direktori `dist/` sebagai artefak bernama `web-dist` dengan retensi tujuh hari. Job deploy kemudian mengunduhnya kembali. Pola ini memastikan artefak yang diuji adalah artefak yang persis sama dengan yang di-deploy, menghindari perbedaan akibat rebuild ganda.

## Konsep Deployment via SSH ke VPS

Ada dua strategi umum untuk mengirim aplikasi ke VPS. Strategi pertama adalah SSH command deployment: runner terhubung ke VPS lalu menjalankan `git pull` dan restart service langsung di server. Strategi kedua adalah artifact transfer: runner membangun artefak lalu mengunggahnya melalui `rsync` atau `scp`, kemudian menjalankan perintah restart.

Strategi `git pull` di server lebih sederhana tetapi membuat server membutuhkan akses baca ke repository dan proses build berjalan di server yang sumber dayanya terbatas. Strategi transfer artefak memisahkan beban build ke runner GitHub yang powerful, sementara VPS hanya menerima file jadi. Untuk aplikasi frontend statis atau binary Go dan Rust, strategi kedua umumnya lebih bersih.

Komunitas menyediakan action siap pakai seperti `appleboy/ssh-action` untuk eksekusi perintah remote dan `appleboy/scp-action` untuk transfer file. Action ini membungkus koneksi SSH sehingga workflow tidak perlu menulis script koneksi manual yang panjang.

Contoh step deployment dengan SSH action:

```yaml
  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy ke VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          script: |
            set -e
            cd /var/www/myapp
            git fetch origin
            git checkout main
            git pull origin main
            npm ci --omit=dev
            npm run build
            sudo systemctl restart myapp
```

Penjelasan:

- `needs: build-and-test` memastikan job deploy hanya berjalan jika job sebelumnya sukses.
- Kredensial diambil dari secrets agar tidak tertulis di file workflow.
- Blok `script` dijalankan baris per baris di VPS. Perintah `set -e` membuat script berhenti saat ada perintah yang gagal, mencegah restart service dengan kode setengah ter-update.
- Alur di server meliputi sinkronisasi kode, instalasi dependensi production saja, build, lalu restart service systemd.

Contoh transfer artefak dengan rsync melalui SSH juga populer untuk file statis:

```bash
rsync -avz --delete -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=yes" dist/ deploy@203.0.113.10:/var/www/myapp/
```

Penjelasan perintah: opsi `-a` mempertahankan permission dan struktur, `-v` menampilkan progres, `-z` mengompresi selama transfer, `--delete` menghapus file di tujuan yang sudah tidak ada di sumber agar tidak menumpuk file usang, dan `-e` menentukan perintah SSH dengan key khusus dan verifikasi host key yang ketat.

## Mengelola Secrets dan Environment

Kredensial seperti private key SSH, password database, dan token API tidak boleh ditulis langsung di file workflow karena repository bisa dibaca banyak orang dan terekam dalam histori Git. GitHub menyediakan Secrets dan Variables di level repository atau environment.

Secrets diakses dengan sintaks `${{ secrets.NAMA_SECRET }}` dan nilainya disamarkan di log. Untuk deployment VPS, minimal dibutuhkan tiga secret: `VPS_HOST`, `VPS_USER`, dan `VPS_SSH_KEY`. Private key sebaiknya dibuat khusus untuk automation dengan akses terbatas, bukan memakai key pribadi administrator.

Contoh penggunaan secret untuk login SSH manual tanpa action pihak ketiga:

```bash
mkdir -p ~/.ssh
echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=yes ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} "uptime"
```

Penjelasan: key ditulis ke file dengan permission ketat `600`, lalu dipakai untuk koneksi uji `uptime`. Opsi `StrictHostKeyChecking=yes` mencegah serangan man-in-the-middle dengan menolak host yang fingerprint-nya belum dikenal. Untuk pengalaman pertama, fingerprint VPS perlu didaftarkan sebagai known hosts melalui secret `SSH_KNOWN_HOSTS` atau langkah khusus.

Fitur Environments di GitHub melangkah lebih jauh: setiap environment seperti `staging` dan `production` bisa memiliki secret berbeda, protection rule yang mewajibkan reviewer, dan batasan branch. Contoh referensi environment di workflow:

```yaml
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.contoh.com
    steps:
      - run: echo "Mendeploy ke production"
```

Dengan konfigurasi ini, job hanya berjalan setelah reviewer menyetujui di UI GitHub, dan URL aplikasi ditampilkan di halaman deployment untuk akses cepat. Pola ini sangat membantu memisahkan kredensial staging dan production agar tidak tertukar.

## Contoh Workflow Lengkap: Build, Test, Deploy ke VPS

Berikut contoh workflow lengkap yang menggabungkan semua konsep di atas untuk aplikasi Node.js sederhana:

```yaml
name: Deploy Web ke VPS

on:
  push:
    branches: ["main"]
  workflow_dispatch:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Instal dependensi
        run: npm ci

      - name: Jalankan linter dan test
        run: |
          npm run lint
          npm test -- --ci

      - name: Build production
        run: npm run build

      - name: Upload artefak
        uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: dist/

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.contoh.com
    steps:
      - name: Unduh artefak
        uses: actions/download-artifact@v4
        with:
          name: web-dist
          path: dist/

      - name: Kirim artefak dan restart service
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          script: |
            set -e
            TIMESTAMP=$(date +%Y%m%d-%H%M%S)
            APP_DIR=/var/www/myapp
            BACKUP_DIR=/var/backups/myapp
            mkdir -p "$BACKUP_DIR"
            tar -czf "$BACKUP_DIR/release-$TIMESTAMP.tar.gz" -C "$APP_DIR" .
            echo "Backup tersimpan sebagai release-$TIMESTAMP.tar.gz"
```

Penjelasan tambahan: job deploy mengunduh artefak yang sudah diuji, lalu di dalam server membuat backup arsip bertaanggal sebelum menimpa file lama. Setelah backup, langkah berikutnya biasanya menyalin file baru, menjalankan migrasi database jika ada, dan me-restart service. Struktur dua job dengan `needs` menjamin artefak yang di-deploy selalu yang sudah lolos test.

Langkah restart dan verifikasi bisa ditambahkan di blok script yang sama, misalnya restart Nginx atau service aplikasi, menunggu beberapa detik, lalu memeriksa endpoint health dengan `curl`. Jika healthcheck gagal, script keluar dengan status error sehingga GitHub menandai deployment sebagai gagal.

## Keamanan Deployment: Healthcheck dan Backup Sebelum Deploy

Deployment tanpa verifikasi ibarat lepas landas tanpa checklist. Minimal ada tiga pengaman yang sebaiknya selalu ada.

Pertama, backup sebelum deploy. Arsipkan direktori aplikasi atau buat snapshot sesuai jenis aplikasi. Untuk aplikasi stateless, arsip tar bertaanggal sudah cukup. Untuk aplikasi dengan database, jalankan dump database terlebih dahulu dan simpan di lokasi terpisah. Contoh perintah backup database PostgreSQL:

```bash
pg_dump -U appuser -h localhost appdb | gzip > /var/backups/myapp/db-20260301-120000.sql.gz
```

Perintah ini mengekspor seluruh database lalu mengompresinya. Hasilnya kurang lebih berupa file arsip bertaanggal yang bisa dipakai untuk restore jika migrasi baru merusak data.

Kedua, healthcheck otomatis setelah restart. Contoh perintah yang dijalankan di VPS sesaat setelah service di-restart:

```bash
sleep 5
curl -fsS --max-time 10 https://app.contoh.com/health -o /dev/null
```

Penjelasan: perintah menunggu lima detik agar aplikasi sempat boot, lalu meminta endpoint `/health`. Opsi `-f` membuat curl gagal jika status HTTP error, `-sS` menyembunyikan progres tetapi tetap menampilkan error, dan `--max-time` membatasi waktu tunggu. Jika healthcheck gagal, deployment ditandai gagal dan tim segera menyelidiki sebelum pengguna terdampak luas.

Ketiga, migrasi database yang aman. Jalankan migrasi dengan mode transaksional jika didukung framework, selalu backup dulu, dan hindari migrasi destruktif seperti drop kolom dalam satu langkah. Pola expand-migrate-contract, yaitu menambah kolom baru dulu, memindahkan data, baru menghapus kolom lama di rilis berikutnya, jauh lebih aman untuk deployment tanpa downtime.

## Strategi Rollback

Rollback adalah rencana kembali ke versi sebelumnya ketika rilis baru bermasalah. Tanpa strategi yang jelas, proses kembali justru bisa lebih lama daripada proses maju dan memperparah downtime.

Tiga strategi rollback yang praktis untuk VPS:

1. **Rollback arsip rilis:** karena setiap deploy menyimpan arsip `release-TIMESTAMP.tar.gz`, proses kembali cukup mengekstrak arsip terakhir yang sehat lalu restart service. Cepat dan tidak bergantung pada GitHub.
2. **Rollback Git:** menjalankan `git checkout` ke tag atau commit sebelumnya lalu rebuild dan restart. Cocok untuk strategi `git pull`, tetapi lebih lambat karena perlu build ulang.
3. **Blue-green sederhana:** siapkan dua direktori, misalnya `myapp-blue` dan `myapp-green`, dengan Nginx menunjuk ke salah satu melalui symlink. Rilis baru dipasang di direktori pasif, diuji lewat port internal, lalu symlink dialihkan. Jika gagal, symlink dikembalikan dalam hitungan detik.

Contoh perintah rollback arsip:

```bash
sudo tar -xzf /var/backups/myapp/release-20260301-120000.tar.gz -C /var/www/myapp
sudo systemctl restart myapp
curl -fsS --max-time 10 https://app.contoh.com/health
```

Rangkaian ini mengekstrak backup, me-restart service, dan langsung memverifikasi kesehatan. Dokumentasikan perintah rollback di runbook tim agar saat insiden terjadi tidak ada yang perlu menebak langkahnya dari nol.

Untuk database, rollback lebih sensitif. Downgrade migrasi hanya aman jika skrip down sudah diuji. Jika tidak yakin, lebih baik forward-fix dengan rilis perbaikan kecil daripada memaksa rollback skema yang berisiko kehilangan data.

## Troubleshooting Workflow yang Gagal

Kegagalan workflow hampir selalu meninggalkan jejak di log GitHub Actions. Beberapa pola umum:

**Job gagal di langkah SSH dengan pesan permission denied.** Penyebabnya biasanya private key tidak cocok dengan public key di VPS, username salah, atau permission file key terlalu longgar. Pastikan public key terdaftar di `~/.ssh/authorized_keys` milik user tujuan dan private key tersimpan utuh di secret termasuk header dan footer-nya.

**Artefak tidak ditemukan antar job.** Nama artefak pada upload dan download harus sama persis, termasuk huruf besar dan kecil. Periksa juga path direktori build, karena perbedaan kecil seperti `dist` versus `build` membuat job deploy mengunduh direktori kosong.

**Deployment sukses tetapi aplikasi error 502.** Kemungkinan service aplikasi belum selesai boot saat reverse proxy sudah meneruskan trafik, atau port internal berubah. Periksa status service dengan `systemctl status`, baca log dengan `journalctl -u`, dan pastikan healthcheck menunggu cukup lama sebelum dinyatakan gagal.

**Secret terbaca kosong.** Nama secret sensitif terhadap huruf besar dan kecil. Secret di level environment tidak terbaca oleh job yang tidak mendeklarasikan environment tersebut. Pindahkan secret ke level repository jika memang dipakai lintas environment, atau tambahkan deklarasi environment yang sesuai.

Aktifkan log debug dengan secret `ACTIONS_STEP_DEBUG` bernilai `true` untuk melihat eksekusi yang lebih detail saat investigasi buntu. Nonaktifkan kembali setelah selesai agar log tidak terlalu verbose.

## Kesimpulan

Automasi deployment dengan GitHub Actions mengubah proses rilis yang manual dan rapuh menjadi alur yang konsisten dan teraudit. Kuncinya bukan sekadar bisa push lalu ter-deploy, melainkan membangun rantai pengaman lengkap: pemicu yang tepat, build dan test yang deterministik, transfer artefak yang terverifikasi, secret yang terisolasi per environment, backup otomatis sebelum setiap rilis, healthcheck sesudah restart, dan strategi rollback yang sudah terdokumentasi.

Mulailah dari workflow kecil untuk environment staging, uji kegagalan secara sengaja untuk memastikan alert dan rollback berfungsi, lalu terapkan pola yang sama ke production dengan protection rule dan reviewer. Dengan fondasi tersebut, setiap perubahan kode dapat diproses menuju VPS secara andal tanpa drama deployment manual di tengah malam.

