---
layout: post
title: "Deploy Aplikasi dengan Docker: Dari Local Development ke Production"
date: 2026-09-26 13:29:30 +0000
description: "Panduan memahami workflow deployment aplikasi menggunakan Docker mulai dari development hingga production."
categories: []
tags: []
---

# Deploy Aplikasi dengan Docker: Dari Local Development ke Production

Perbedaan environment antara laptop developer dan server production adalah sumber masalah klasik dalam software development. Aplikasi berjalan lancar di local, tetapi gagal saat di-deploy karena versi Node.js berbeda, environment variable tidak lengkap, atau dependency sistem tidak terpasang. Docker hadir untuk mengurangi masalah tersebut dengan mengemas aplikasi beserta runtime dan dependency-nya ke dalam unit yang konsisten dan portabel.

Artikel ini membahas alur deployment aplikasi menggunakan Docker, mulai dari konsep image dan container, penulisan Dockerfile, perintah build dan run, pengelolaan environment variable, port mapping, volumes, hingga Docker Compose. Semua contoh menggunakan aplikasi Node.js sederhana agar mudah diikuti, dan bagian akhir membahas pertimbangan production yang sering terlewat.

## Mengapa Menggunakan Docker

Tanpa container, proses setup environment biasanya dilakukan manual. Developer memasang Node.js versi tertentu, menjalankan `npm install`, mengatur environment variable, dan berharap server production memiliki konfigurasi yang sama. Semakin banyak server dan semakin banyak developer, semakin besar peluang terjadinya perbedaan kecil yang berdampak besar.

Docker menyelesaikan masalah ini dengan tiga manfaat utama. Pertama, konsistensi. Image yang sama bisa dijalankan di laptop, di server staging, dan di server production dengan perilaku yang sama. Kedua, isolasi. Setiap container memiliki filesystem, process, dan network namespace sendiri sehingga tidak saling mengganggu. Ketiga, portabilitas dan kemudahan distribusi. Image bisa disimpan di registry seperti Docker Hub atau GitHub Container Registry, lalu ditarik ke server mana pun yang membutuhkan.

Hal ini tidak berarti Docker menghilangkan semua masalah deployment. Konfigurasi yang buruk, secret yang bocor, atau image yang membengkak tetap bisa terjadi. Namun, Docker memberikan fondasi yang jelas untuk standardisasi, dan fondasi inilah yang membuat proses deployment lebih mudah diulang dan diaudit.

## Image vs Container: Konsep Dasar yang Wajib Dipahami

Dua istilah yang paling sering tertukar adalah image dan container. Image adalah template read-only yang berisi aplikasi, runtime, library, dan konfigurasi. Image dibangun dari Dockerfile dan disimpan dalam layer yang bertingkat. Container adalah instance yang berjalan dari sebuah image. Satu image bisa dijalankan menjadi banyak container dengan konfigurasi berbeda.

Analoginya, image seperti file installer atau cetakan, sedangkan container seperti program yang sedang berjalan hasil dari installer tersebut. Menghapus container tidak menghapus image, dan mengubah file di dalam container yang sedang berjalan tidak otomatis mengubah image kecuali dilakukan commit yang sebenarnya tidak disarankan untuk alur kerja normal.

Pemahaman ini penting karena berimplikasi pada cara deployment dilakukan. Praktik yang benar adalah membangun image baru setiap kali ada perubahan kode, memberi tag versi yang jelas, lalu menjalankan container dari image tersebut. Mengubah kode langsung di dalam container yang sedang berjalan membuat sistem sulit direproduksi dan rentan kehilangan perubahan saat container dihapus.

## Contoh Aplikasi Node.js Sederhana

Sebagai bahan praktik, gunakan aplikasi Express minimal berikut. Struktur proyeknya hanya terdiri dari tiga file.

```text
node-docker-demo/
├── package.json
├── server.js
└── Dockerfile
```

Isi `package.json`:

```json
{
  "name": "node-docker-demo",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
```

File ini mendefinisikan dependency Express dan perintah `npm start` untuk menjalankan aplikasi. Pada proyek nyata, daftar dependency tentu lebih panjang, tetapi prinsipnya sama.

Isi `server.js`:

```javascript
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Halo dari Docker!",
    env: process.env.APP_ENV || "development"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server berjalan pada port ${PORT}`);
});
```

Ada dua detail penting pada kode di atas. Pertama, aplikasi membaca port dan nama environment dari environment variable sehingga perilaku container bisa diubah tanpa mengubah kode. Kedua, aplikasi melakukan bind ke `0.0.0.0`, bukan `localhost`, agar bisa diakses dari luar container. Ini adalah kesalahan umum yang menyebabkan aplikasi berjalan tetapi tidak bisa diakses melalui port mapping.

## Menulis Dockerfile

Dockerfile adalah resep untuk membangun image. Berikut contoh Dockerfile yang cocok untuk development sekaligus menjadi dasar untuk production.

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Penjelasan tiap instruksi:

- `FROM node:20-alpine` menentukan base image, yaitu Node.js versi 20 dengan basis Alpine Linux yang ringan. Pemilihan versi yang eksplisit lebih baik daripada tag `latest` karena hasilnya lebih dapat diprediksi.
- `WORKDIR /app` menentukan direktori kerja di dalam image. Semua perintah berikutnya dijalankan dari direktori ini.
- `COPY package.json package-lock.json* ./` hanya menyalin file dependency terlebih dahulu. Tujuannya agar layer `npm install` bisa di-cache oleh Docker selama file dependency tidak berubah, sehingga build berikutnya lebih cepat.
- `RUN npm install --omit=dev` memasang dependency production. Opsi `--omit=dev` melewatkan dev dependency agar image lebih kecil.
- `COPY . .` menyalin sisa source code ke dalam image.
- `EXPOSE 3000` adalah dokumentasi bahwa container memakai port 3000. Instruksi ini tidak otomatis mempublikasikan port, publikasi tetap dilakukan melalui opsi `-p` atau konfigurasi Compose.
- `CMD ["npm", "start"]` menentukan perintah default saat container dijalankan.

Untuk production, praktik yang lebih baik adalah menggunakan multi-stage build agar tools build tidak ikut terbawa ke image final, serta menjalankan aplikasi dengan user non-root. Contoh penyederhanaan multi-stage untuk aplikasi yang membutuhkan proses build:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

Penjelasan tambahan:

- Tahap `builder` dipakai untuk memasang semua dependency dan menjalankan proses build.
- Tahap `runtime` hanya menyalin hasil build dan dependency production, sehingga image final lebih kecil dan permukaannya lebih sempit dari sisi keamanan.
- `USER node` menjalankan container sebagai user non-root yang sudah tersedia pada base image Node, sehingga risiko keamanan berkurang.

## Build dan Run: Dari Source Code ke Container

Setelah Dockerfile siap, langkah berikutnya adalah membangun image.

```bash
docker build -t node-docker-demo:1.0.0 .
```

Penjelasan perintah:

- `docker build` membangun image dari Dockerfile.
- Opsi `-t` memberi nama dan tag pada image. Kebiasaan yang baik adalah memakai tag versi seperti `1.0.0`, bukan selalu `latest`, agar rollback dan audit lebih mudah.
- Tanda `.` menunjukkan konteks build, yaitu direktori saat ini yang dikirim ke Docker daemon.

Contoh keluaran yang dipersingkat kurang lebih seperti ini:

```text
[+] Building 12.4s (10/10) FINISHED
 => [internal] load build definition from Dockerfile
 => [runtime 3/4] RUN npm ci --omit=dev
 => exporting to image
 => naming to docker.io/library/node-docker-demo:1.0.0
```

Setelah image jadi, jalankan sebagai container.

```bash
docker run -d --name demo-app -p 8080:3000 node-docker-demo:1.0.0
```

Penjelasan opsi:

- `-d` menjalankan container di background (detached).
- `--name demo-app` memberi nama agar mudah dikelola.
- `-p 8080:3000` memetakan port 3000 di dalam container ke port 8080 di host. Formatnya adalah `host:container`.
- Argumen terakhir adalah nama image beserta tag-nya.

Untuk memverifikasi, buka `http://localhost:8080/` di browser atau gunakan `curl`.

```bash
curl http://localhost:8080/health
```

Perintah tersebut meminta endpoint health check. Jika responsnya `{"status":"healthy"}`, berarti port mapping dan aplikasi berjalan dengan benar.

Perintah pengelolaan dasar yang perlu dikenal:

```bash
docker ps
docker logs demo-app
docker stop demo-app
docker rm demo-app
```

Penjelasan masing-masing:

- `docker ps` menampilkan container yang sedang berjalan.
- `docker logs demo-app` menampilkan log stdout dan stderr dari container bernama `demo-app`.
- `docker stop` menghentikan container secara graceful.
- `docker rm` menghapus container yang sudah berhenti.

## Environment Variable dan Port Mapping

Aplikasi modern tidak menyimpan konfigurasi sensitif di dalam kode. Nilai seperti URL database, API key, dan port dibaca dari environment variable. Docker mendukung beberapa cara untuk memberikannya.

Cara pertama adalah opsi `-e` untuk satu atau dua variabel.

```bash
docker run -d --name demo-app \
  -p 8080:3000 \
  -e PORT=3000 \
  -e APP_ENV=production \
  node-docker-demo:1.0.0
```

Penjelasan:

- `-e PORT=3000` mengisi variabel `PORT` yang dibaca oleh `server.js`.
- `-e APP_ENV=production` menandai environment aktif sehingga respons API bisa menyesuaikan perilaku.

Cara kedua adalah file env untuk konfigurasi yang lebih banyak.

```bash
docker run -d --name demo-app \
  -p 8080:3000 \
  --env-file .env.production \
  node-docker-demo:1.0.0
```

Isi `.env.production` kurang lebih seperti ini:

```text
PORT=3000
APP_ENV=production
DATABASE_URL=postgres://app:secret@db:5432/appdb
```

Keuntungan file env adalah konfigurasi lebih rapi dan tidak terlihat di history shell. Namun, file tersebut tetap harus dijaga, jangan di-commit ke repository publik jika berisi secret, dan gunakan permission file yang ketat di server.

Terkait port mapping, format `-p` selalu `HOST:CONTAINER`. Port container mengikuti apa yang di-listen aplikasi, sedangkan port host mengikuti kebutuhan server, misalnya 80, 443, atau port acak di balik reverse proxy. Jika aplikasi melakukan bind ke `localhost` di dalam container, mapping tidak akan berfungsi. Karena itu, pastikan aplikasi mendengarkan pada `0.0.0.0` seperti pada contoh `server.js` di atas.

## Volumes: Menyimpan Data yang Persisten

Container bersifat ephemeral. File yang ditulis ke dalam layer container akan hilang saat container dihapus. Untuk data yang harus bertahan seperti upload, database, atau log, gunakan volume.

```bash
docker run -d --name demo-app \
  -p 8080:3000 \
  -v app-uploads:/app/uploads \
  node-docker-demo:1.0.0
```

Penjelasan:

- `-v app-uploads:/app/uploads` membuat named volume bernama `app-uploads` dan me-mount-nya ke direktori `/app/uploads` di dalam container.
- Data di direktori tersebut bertahan meskipun container dihapus dan diganti dengan versi baru.

Untuk development, bind mount sering dipakai agar perubahan kode di laptop langsung terlihat di container tanpa rebuild.

```bash
docker run --rm -it \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  node:20-alpine sh
```

Penjelasan:

- `-v $(pwd):/app` memetakan direktori proyek host ke `/app` di container.
- `-v /app/node_modules` adalah anonymous volume agar `node_modules` di dalam container tidak tertimpa oleh direktori host yang mungkin memakai OS berbeda.
- `--rm` menghapus container otomatis setelah keluar, cocok untuk sesi development sementara.

Aturan praktisnya, gunakan bind mount untuk development dan named volume untuk data production. Jangan menyimpan data penting hanya di dalam layer container tanpa volume.

## Docker Compose untuk Multi-Container

Aplikasi nyata jarang berdiri sendiri. Umumnya ada database, cache, atau reverse proxy. Menjalankan semuanya dengan perintah `docker run` satu per satu menjadi rumit. Docker Compose menyederhanakan hal ini melalui satu file YAML.

Berikut contoh `docker-compose.yml` untuk aplikasi Node.js dan PostgreSQL.

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "8080:3000"
    env_file:
      - .env.production
    environment:
      - APP_ENV=production
    volumes:
      - app-uploads:/app/uploads
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=change-me
      - POSTGRES_DB=appdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  app-uploads:
  pgdata:
```

Penjelasan tiap bagian:

- `services.app.build: .` berarti image aplikasi dibangun dari Dockerfile di direktori saat ini.
- `ports` melakukan port mapping yang sama seperti opsi `-p`.
- `env_file` dan `environment` menyediakan environment variable. Nilai di `environment` akan menimpa nilai dari file jika kuncinya sama.
- `volumes` me-mount named volume agar data tidak hilang.
- `depends_on` mengatur urutan startup. Perlu dicatat bahwa ini hanya mengatur urutan, bukan menunggu database benar-benar siap, sehingga aplikasi tetap perlu logika retry koneksi.
- `restart: unless-stopped` membuat container otomatis berjalan lagi setelah reboot atau crash, kecuali dihentikan manual.
- Service `db` memakai image PostgreSQL resmi dengan volume `pgdata` untuk persistensi.

Perintah utama Compose:

```bash
docker compose up -d --build
docker compose logs -f app
docker compose down
```

Penjelasan:

- `docker compose up -d --build` membangun ulang image jika ada perubahan lalu menjalankan semua service di background.
- `docker compose logs -f app` mengikuti log service `app` secara real-time.
- `docker compose down` menghentikan dan menghapus container serta network, tetapi tidak menghapus volume sehingga data tetap aman. Tambahkan `-v` hanya jika memang ingin menghapus data.

## Pertimbangan Production: Logs, Restart Policy, dan Keamanan

Berpindah dari local ke production bukan sekadar mengganti tag image. Ada beberapa aspek operasional yang perlu disiapkan.

Pertama, logging. Secara default, `docker logs` membaca stdout dan stderr container. Pastikan aplikasi menulis log penting ke stdout, bukan hanya ke file di dalam container yang sulit diakses dan hilang saat container diganti. Untuk skala lebih besar, teruskan log ke sistem terpusat seperti Loki, Elasticsearch, atau layanan log managed agar mudah dicari dan dianalisis.

Kedua, restart policy. Tanpa kebijakan restart, container yang crash akan tetap mati hingga ada yang menyalakan manual. Opsi `unless-stopped` cocok untuk kebanyakan service production karena container akan bangkit setelah reboot atau kegagalan. Opsi `always` mirip tetapi akan menjalankan kembali container bahkan setelah dihentikan manual saat daemon restart, sehingga perlu dipilih sesuai kebutuhan. Untuk orkestrasi yang lebih kompleks, healthcheck juga penting agar platform tahu kapan container benar-benar siap menerima traffic.

Ketiga, keamanan. Beberapa praktik yang disarankan adalah menjalankan container sebagai non-root, memakai tag image yang spesifik, meminimalkan layer dan dependency, tidak menyimpan secret di dalam image, serta memindai image dengan `docker scout` atau scanner lain sebelum deploy. Secret sebaiknya diberikan melalui file env yang aman, secret manager, atau fitur secret milik platform orkestrasi, bukan di-commit ke repository.

Keempat, resource limit. Tanpa batas, satu container yang bermasalah bisa menghabiskan RAM host dan mengganggu container lain. Pada `docker run`, batas bisa dipasang seperti berikut.

```bash
docker run -d --name demo-app \
  --memory="512m" \
  --cpus="1.0" \
  -p 8080:3000 \
  node-docker-demo:1.0.0
```

Opsi `--memory` membatasi RAM, sedangkan `--cpus` membatasi porsi CPU. Pada Compose, batas yang setara bisa didefinisikan melalui blok `deploy.resources` atau opsi yang didukung versi Compose yang dipakai. Nilai batas sebaiknya ditentukan berdasarkan hasil load test, bukan tebakan.

Kelima, strategi update. Hindari menimpa container production dengan build manual tanpa versi. Alur yang lebih aman adalah membangun image dengan tag versi baru, mendorong ke registry, menarik image tersebut di server, lalu menjalankan container baru sebelum menghentikan yang lama. Pada setup tunggal, jeda sesaat masih dapat diterima, tetapi untuk layanan kritis, gunakan reverse proxy atau orchestrator agar pergantian berjalan tanpa downtime yang terasa.

## Kesimpulan

Alur deployment dengan Docker mengikuti pola yang konsisten. Tulis Dockerfile yang jelas dan efisien, bangun image dengan tag versi, jalankan container dengan environment variable dan port mapping yang tepat, gunakan volume untuk data persisten, dan rangkai multi-service dengan Docker Compose. Setelah itu, lengkapi dengan kebutuhan production seperti logging terpusat, restart policy, user non-root, secret management, dan resource limit.

Dengan pola ini, perbedaan antara local development dan production menjadi jauh lebih kecil. Image yang diuji di staging adalah image yang sama dengan yang berjalan di production, sehingga deployment menjadi lebih dapat diprediksi dan lebih mudah di-troubleshoot ketika terjadi masalah.

