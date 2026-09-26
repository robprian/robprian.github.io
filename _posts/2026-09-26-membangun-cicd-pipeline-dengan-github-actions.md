---
layout: post
title: "Membangun CI/CD Pipeline Sederhana dengan GitHub Actions"
date: 2026-09-26 13:29:25 +0000
description: "Panduan membangun pipeline CI/CD sederhana menggunakan GitHub Actions untuk melakukan build, test, dan deployment aplikasi secara otomatis."
categories: []
tags: []
---

# Membangun CI/CD Pipeline Sederhana dengan GitHub Actions

Proses deployment manual terlihat sederhana pada awalnya. Developer menjalankan test di laptop, membangun aplikasi, lalu mengunggah file ke server melalui SSH. Namun seiring bertambahnya anggota tim dan frekuensi rilis, cara manual menjadi rapuh. Ada langkah yang terlewat, ada test yang lupa dijalankan, dan ada konfigurasi server yang berbeda dari local. CI/CD hadir untuk mengotomatisasi rangkaian tersebut sehingga setiap perubahan melewati proses build, test, dan deployment yang konsisten.

Artikel ini membahas konsep CI/CD, konsep dasar GitHub Actions seperti workflow YAML, trigger, job, step, dan secret, serta contoh pipeline untuk aplikasi Node.js yang mencakup build, testing, dan deployment. Bagian akhir membahas pertimbangan keamanan dan troubleshooting yang sering ditemui saat pipeline gagal.

## Apa Itu CI/CD

CI adalah singkatan dari Continuous Integration, sedangkan CD bisa berarti Continuous Delivery atau Continuous Deployment. Ketiganya berkaitan tetapi memiliki arti berbeda.

Continuous Integration berarti setiap perubahan kode yang di-push ke repository otomatis melewati proses build dan automated test. Tujuannya adalah menemukan error sedini mungkin, bukan sehari sebelum rilis. Jika ada test yang gagal, tim langsung mendapat notifikasi dan bisa memperbaiki sebelum kode menyebar ke branch lain.

Continuous Delivery berarti setelah kode lolos CI, artefak rilis disiapkan dan siap di-deploy ke production kapan saja, tetapi deployment final masih membutuhkan persetujuan manual. Pendekatan ini cocok untuk tim yang ingin otomatisasi tetapi tetap ingin kontrol manusia sebelum menyentuh production.

Continuous Deployment melangkah lebih jauh. Setiap perubahan yang lolos seluruh pipeline otomatis di-deploy ke production tanpa intervensi manual. Pendekatan ini membutuhkan test yang kuat dan monitoring yang baik, tetapi memberikan kecepatan rilis tertinggi.

Untuk tim kecil atau proyek pribadi, kombinasi CI dengan deployment otomatis ke staging dan deployment semi-otomatis ke production biasanya menjadi titik awal yang realistis. GitHub Actions menyediakan fondasi untuk semua pola tersebut tanpa server tambahan.

## Konsep Dasar GitHub Actions

GitHub Actions adalah layanan otomasi yang terintegrasi dengan repository GitHub. Pipeline didefinisikan sebagai file YAML di direktori `.github/workflows/`. Setiap kali event tertentu terjadi, misalnya push atau pull request, GitHub menjalankan pipeline tersebut pada virtual machine yang disebut runner.

Ada lima konsep yang perlu dipahami sebelum menulis workflow.

Pertama, workflow adalah keseluruhan pipeline yang didefinisikan dalam satu file YAML. Satu repository bisa memiliki banyak workflow, misalnya satu untuk CI, satu untuk deployment staging, dan satu untuk rilis production.

Kedua, trigger atau event adalah pemicu workflow. Contoh umum adalah `push` ke branch tertentu, `pull_request`, pembuatan tag, jadwal cron, atau pemicu manual melalui tombol di dashboard GitHub.

Ketiga, job adalah unit kerja besar yang berjalan pada runner. Satu workflow bisa memiliki banyak job, misalnya job `test` dan job `build`. Secara default job berjalan paralel, kecuali didefinisikan ketergantungan dengan `needs`.

Keempat, step adalah langkah kecil di dalam job. Step bisa berupa perintah shell langsung atau action yang dipakai ulang dari marketplace, misalnya action untuk checkout kode atau setup Node.js.

Kelima, secret adalah variabel sensitif seperti API key, token deployment, atau password server yang disimpan terenkripsi di pengaturan repository. Secret tidak ditulis langsung di file YAML, melainkan diakses melalui konteks `secrets.NAMA_SECRET`.

Runner GitHub menyediakan environment Ubuntu, Windows, dan macOS dengan banyak tools bawaan. Untuk kebutuhan sederhana, runner berbasis Ubuntu sudah mencukupi dan dokumentasinya paling lengkap.

## Struktur Workflow YAML

Berikut kerangka minimal sebuah workflow agar struktur umumnya jelas sebelum masuk ke contoh lengkap.

```yaml
name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout kode
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install dependency
        run: npm ci
      - name: Jalankan test
        run: npm test
```

Penjelasan tiap bagian:

- `name` adalah nama workflow yang tampil di tab Actions pada GitHub.
- Blok `on` mendefinisikan trigger. Contoh di atas berjalan saat ada push ke branch `main` dan saat ada pull request yang menargetkan `main`.
- Blok `jobs` berisi daftar job. Contoh di atas hanya memiliki satu job bernama `test`.
- `runs-on: ubuntu-latest` berarti job dijalankan pada runner Ubuntu versi stabil terbaru.
- Setiap step memiliki `name` sebagai label, lalu `uses` untuk memakai action publik atau `run` untuk menjalankan perintah shell.
- `actions/checkout@v4` mengunduh kode repository ke runner agar bisa di-build dan di-test.
- `actions/setup-node@v4` memasang Node.js versi 20 pada runner.
- `npm ci` memasang dependency secara bersih berdasarkan `package-lock.json`, sehingga hasilnya lebih konsisten daripada `npm install` untuk pipeline.

File workflow harus disimpan dengan ekstensi `.yml` atau `.yaml`, misalnya `.github/workflows/ci.yml`. Setiap perubahan pada file tersebut langsung berlaku pada eksekusi berikutnya.

## Contoh Pipeline: Build, Test, dan Deploy Aplikasi Node.js

Sebagai contoh nyata, bayangkan aplikasi Express sederhana dengan skrip berikut pada `package.json`.

```json
{
  "name": "ci-demo-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "test": "node --test tests/",
    "lint": "eslint ."
  }
}
```

Penjelasan skrip:

- `npm start` menjalankan aplikasi.
- `npm test` menjalankan test bawaan Node.js dari direktori `tests/`.
- `npm run lint` menjalankan linter untuk menjaga kualitas kode.

Berikut contoh workflow lengkap yang melakukan build, lint, test, lalu deploy ke server staging melalui SSH. Simpan sebagai `.github/workflows/ci-cd.yml`.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]
  workflow_dispatch:

env:
  NODE_VERSION: "20"
  APP_DIR: "/var/www/ci-demo-app"

jobs:
  build-and-test:
    name: Build dan Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependency
        run: npm ci

      - name: Jalankan linter
        run: npm run lint

      - name: Jalankan test
        run: npm test

      - name: Verifikasi build
        run: |
          npm run build --if-present
          node --check server.js

  deploy-staging:
    name: Deploy ke Staging
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Deploy melalui SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          port: ${{ secrets.STAGING_PORT }}
          script: |
            set -e
            cd ${{ env.APP_DIR }}
            git pull origin main
            npm ci --omit=dev
            npm run build --if-present
            pm2 reload ecosystem.config.js --env staging || pm2 start ecosystem.config.js --env staging
```

Penjelasan job pertama `build-and-test`:

- Job ini berjalan untuk push maupun pull request, sehingga error bisa tertangkap sebelum kode di-merge.
- Opsi `cache: npm` mempercepat instalasi dengan menyimpan cache dependency antar eksekusi.
- `npm ci` memastikan dependency sesuai lockfile.
- Linter dijalankan sebelum test agar masalah gaya kode dan potensi bug sederhana tertangkap lebih awal.
- `node --check server.js` memeriksa sintaks tanpa menjalankan aplikasi, berguna sebagai verifikasi cepat.
- Perintah `npm run build --if-present` hanya berjalan jika skrip `build` tersedia, sehingga workflow tetap kompatibel dengan proyek yang belum memiliki tahap build.

Penjelasan job kedua `deploy-staging`:

- `needs: build-and-test` berarti deploy hanya berjalan jika job build dan test sukses.
- Kondisi `if` memastikan deploy hanya terjadi pada push ke `main`, bukan pada pull request. Ini mencegah kode yang belum di-review ter-deploy otomatis.
- `environment: staging` mengaitkan job dengan environment GitHub bernama staging, sehingga bisa dipasangi aturan proteksi dan secret khusus.
- Action `appleboy/ssh-action` menjalankan perintah deployment di server melalui SSH tanpa perlu menulis skrip SSH manual.
- Blok `script` berpindah ke direktori aplikasi, menarik kode terbaru, memasang dependency production, menjalankan build jika ada, lalu me-reload process manager PM2. Perintah `set -e` memastikan skrip berhenti pada error pertama agar kegagalan tidak tertutup.

Contoh ini memakai deployment berbasis `git pull` karena sederhana dan mudah dipahami. Untuk skala lebih besar, pola yang umum dipakai adalah membangun artefak atau image Docker pada pipeline, mendorongnya ke registry, lalu menarik versi tersebut di server. Pola artefak lebih konsisten karena server tidak perlu membangun ulang dependency.

## Deployment dengan Docker Image sebagai Alternatif

Untuk tim yang sudah memakai Docker, pipeline bisa membangun dan mendorong image ke GitHub Container Registry. Berikut potongan job alternatif sebagai gambaran.

```yaml
  build-and-push:
    name: Build dan Push Image
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Login ke GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build dan push image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest,ghcr.io/${{ github.repository }}:${{ github.sha }}
```

Penjelasan:

- Blok `permissions` memberikan hak minimal yang dibutuhkan, yaitu membaca kode dan menulis package container.
- `docker/login-action` melakukan autentikasi ke registry memakai token bawaan GitHub.
- `docker/build-push-action` membangun image dari Dockerfile lalu mendorong dua tag, yaitu `latest` dan hash commit. Tag hash commit memudahkan rollback ke versi spesifik.

Server production kemudian cukup menarik image dengan tag tersebut dan menjalankan container baru. Pola ini memisahkan tahap build dan tahap run secara bersih dan menghindari perbedaan dependency antara runner dan server.

## Mengelola Secret dengan Aman

Secret adalah bagian paling sensitif dalam pipeline. Kebocoran SSH key atau API token bisa memberikan akses penuh ke server dan layanan pihak ketiga.

Praktik yang disarankan:

- Simpan semua kredensial sebagai GitHub Secrets pada level repository atau environment, jangan pernah menulisnya langsung di file YAML.
- Bedakan secret staging dan production. Gunakan environment GitHub agar setiap environment memiliki nilai dan aturan persetujuan sendiri.
- Berikan hak akses minimal pada token. Jika pipeline hanya perlu membaca repository dan mendorong image, jangan berikan hak admin.
- Gunakan SSH key khusus deployment dengan pembatasan command atau IP jika memungkinkan, bukan memakai key pribadi developer.
- Aktifkan log masking secara alami dengan memakai konteks `secrets`, dan jangan mencetak nilai secret ke log melalui `echo` untuk debugging.
- Rotasi secret secara berkala dan segera cabut secret yang pernah terekspos, termasuk yang tidak sengaja ter-commit ke history Git.

Contoh penggunaan secret yang benar sudah terlihat pada workflow di atas, yaitu `${{ secrets.STAGING_HOST }}`, `${{ secrets.STAGING_USER }}`, dan `${{ secrets.STAGING_SSH_KEY }}`. Nilai aslinya hanya tersimpan di pengaturan GitHub dan tidak terlihat di file repository maupun di log eksekusi.

Selain secret, perhatikan juga permission workflow. Secara default, berikan permission minimal pada tiap job melalui blok `permissions`, lalu tambahkan hak hanya jika dibutuhkan. Untuk workflow yang hanya menjalankan test, permission baca saja biasanya sudah cukup.

## Troubleshooting Pipeline yang Gagal

Kegagalan pipeline adalah hal normal, terutama saat pertama kali disiapkan. Berikut masalah umum dan cara mendiagnosisnya.

Kegagalan pertama adalah workflow tidak berjalan sama sekali. Penyebab umum adalah salah indentasi YAML, salah nama branch pada trigger, atau file workflow tidak berada di direktori `.github/workflows/` pada branch yang di-push. Cara memeriksanya adalah membuka tab Actions pada repository dan memastikan workflow terdaftar. Untuk validasi sintaks, gunakan perintah berikut di local sebelum push.

```bash
python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/ci-cd.yml')); print('YAML valid')"
```

Perintah tersebut memuat file workflow sebagai YAML dan memastikan tidak ada kesalahan struktur dasar. Penjelasan opsi, modul `yaml` membutuhkan package PyYAML terpasang, sedangkan pesan `YAML valid` berarti parsing berhasil. Untuk pemeriksaan lebih mendalam, GitHub menyediakan pesan error langsung pada halaman eksekusi yang gagal.

Kegagalan kedua adalah `npm ci` gagal di runner padahal `npm install` berhasil di local. Penyebab umum adalah `package-lock.json` tidak di-commit atau tidak sinkron dengan `package.json`. Solusinya adalah menjalankan `npm install` di local, memastikan tidak ada error, lalu commit lockfile terbaru. Pipeline memakai `npm ci` justru agar perbedaan semacam ini tertangkap lebih awal.

Kegagalan ketiga adalah test lolos di local tetapi gagal di runner. Perbedaan umum meliputi versi Node.js, timezone, variabel environment yang hanya ada di laptop, dan test yang bergantung pada urutan eksekusi atau timing. Cara mendiagnosisnya adalah menyamakan versi Node.js antara local dan workflow, memeriksa apakah test membutuhkan service tambahan seperti database atau Redis, dan menjalankan test berulang di local dengan cache bersih.

Kegagalan keempat adalah deployment SSH gagal dengan pesan permission denied atau host key verification failed. Untuk masalah permission, pastikan username, host, dan private key pada secret sudah benar dan key tersebut terdaftar pada `authorized_keys` server. Untuk masalah host key, tambahkan known hosts yang benar atau gunakan opsi konfigurasi SSH yang disediakan oleh action yang dipakai, jangan menonaktifkan verifikasi secara membabi buta pada production.

Kegagalan kelima adalah job deploy berjalan pada pull request dari fork dan membocorkan error akses secret. Ini adalah perilaku keamanan GitHub. Secret tidak diberikan pada workflow yang dipicu oleh fork demi mencegah eksfiltrasi. Solusinya adalah membatasi job deploy hanya untuk event push ke branch utama seperti pada contoh `if` di atas, dan menjalankan build serta test saja untuk pull request.

Untuk semua kasus, log tiap step pada halaman Actions adalah titik awal investigation. Baca dari step pertama yang gagal, bukan dari akhir log, karena kegagalan awal sering memicu error lanjutan yang membingungkan.

## Checklist Pipeline yang Sehat

Berikut checklist praktis sebelum pipeline dianggap siap dipakai tim.

- Workflow tersimpan di `.github/workflows/` dengan nama jelas dan trigger yang tepat untuk CI dan deployment.
- Versi runtime seperti Node.js didefinisikan eksplisit dan sama antara local, pipeline, dan server.
- Tahap instalasi memakai lockfile agar dependency konsisten.
- Ada tahap lint dan automated test yang wajib lolos sebelum deploy.
- Job deploy bergantung pada job test melalui `needs` dan dibatasi hanya untuk branch atau tag tertentu.
- Secret disimpan di GitHub Secrets atau environment, dibedakan antara staging dan production, dan memiliki permission minimal.
- Log pipeline mudah dibaca karena setiap step memiliki nama yang jelas.
- Ada strategi rollback, misalnya tag image per commit atau rilis GitHub yang bisa di-deploy ulang cepat.
- Notifikasi kegagalan aktif agar tim tahu saat pipeline merah tanpa harus membuka dashboard terus-menerus.
- Pipeline diuji dengan skenario gagal, misalnya test sengaja digagalkan, untuk memastikan deploy benar-benar terhenti.

Checklist ini tidak harus sempurna sejak hari pertama. Mulailah dari pipeline kecil yang hanya menjalankan instalasi dan test, lalu tambahkan lint, build artefak, deployment staging, dan deployment production secara bertahap.

## Kesimpulan

Pipeline CI/CD yang sederhana sudah memberikan nilai besar. Setiap push melewati instalasi dependency yang konsisten, pemeriksaan kualitas kode, automated test, dan deployment terkontrol ke staging. Dengan GitHub Actions, semua itu didefinisikan sebagai file YAML yang terversioning bersama kode, sehingga mudah di-review, mudah diubah, dan mudah diaudit.

Kunci keberhasilan bukan pada kompleksitas workflow, melainkan pada disiplin dasar. Jaga trigger tetap tepat, pisahkan job build, test, dan deploy dengan ketergantungan yang jelas, kelola secret dengan prinsip hak minimal, dan siapkan cara rollback sejak awal. Setelah fondasi ini stabil, pipeline bisa dikembangkan lebih jauh ke arah matrix testing, deployment multi-environment, canary release, atau publikasi Docker image otomatis.

