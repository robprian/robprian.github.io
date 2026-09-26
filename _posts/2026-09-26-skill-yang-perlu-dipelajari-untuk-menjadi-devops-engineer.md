---
layout: post
title: "Skill yang Perlu Dipelajari untuk Menjadi DevOps Engineer"
date: 2026-09-26 13:28:28 +0000
description: "Roadmap praktis skill yang dapat dipelajari untuk membangun kemampuan sebagai DevOps Engineer, mulai dari Linux hingga cloud dan automation."
categories: []
tags: []
---

# Skill yang Perlu Dipelajari untuk Menjadi DevOps Engineer

Istilah DevOps Engineer sering menimbulkan kebingungan karena cakupannya luas. Di satu perusahaan, DevOps Engineer fokus pada CI/CD dan cloud. Di perusahaan lain, perannya lebih dekat ke system administrator yang juga menulis automasi. Ada pula yang menggunakannya untuk menyebut Site Reliability Engineer atau Platform Engineer. Keragaman ini membuat banyak pemula bertanya-tanya harus mulai dari mana dan skill apa yang perlu dipelajari.

Artikel ini menyusun peta belajar yang praktis, mulai dari Linux, networking, Git, Bash, Python dasar, Docker, CI/CD, cloud, Infrastructure as Code, monitoring, hingga security dasar. Pembahasan juga mencakup automation mindset, problem solving, roadmap bertahap, dan ide project praktis. Penting untuk dipahami bahwa artikel ini adalah roadmap belajar yang fleksibel, bukan daftar syarat mutlak. Tidak ada jalur tunggal yang berlaku untuk semua orang, dan tidak perlu menguasai semuanya sebelum melamar pekerjaan atau berkontribusi di tim.

## Cara Membaca Roadmap Ini

Anggap roadmap ini sebagai kompas, bukan rel kereta yang kaku. Setiap orang berangkat dari latar belakang berbeda. Lulusan sistem informasi mungkin sudah familiar dengan database dan jaringan tetapi baru di Linux server. Software developer mungkin sudah kuat di Git dan CI tetapi baru di infrastruktur. System administrator mungkin sudah kuat di server dan jaringan tetapi baru di Docker dan pipeline.

Pendekatan yang disarankan adalah menguasai fondasi terlebih dahulu, lalu memperluas ke area yang paling relevan dengan pekerjaan saat ini atau target peran berikutnya. Kemampuan memecahkan masalah dan kemauan belajar berkelanjutan umumnya lebih menentukan keberhasilan jangka panjang dibanding hafalan banyak tool. Tool akan terus berubah, tetapi prinsip Linux, jaringan, automasi, dan observability relatif stabil.

## Fondasi 1: Linux

Linux adalah fondasi hampir semua workload DevOps. Container berjalan di atas kernel Linux, sebagian besar server cloud menggunakan Linux, dan banyak tool DevOps dirancang dengan asumsi environment Linux. Pemahaman Linux yang solid membuat pembelajaran topik lain jauh lebih cepat.

Materi yang disarankan untuk dipelajari antara lain navigasi filesystem dan permission, manajemen package, manajemen service dengan systemd, manajemen user, log sistem, dan dasar troubleshooting. Perintah berikut adalah contoh yang hampir setiap hari digunakan:

```bash
# Melihat penggunaan disk dan memory
df -h
free -h

# Melihat service yang berjalan dan statusnya
systemctl status nginx
journalctl -u nginx --since "1 hour ago"

# Melihat port yang terbuka dan proses pemiliknya
ss -tulpn

# Mengecek permission dan kepemilikan file
ls -l /etc/nginx/nginx.conf
```

Setiap perintah memiliki fungsi yang jelas. Perintah `df -h` menampilkan penggunaan disk dalam format mudah dibaca. Perintah `free -h` menampilkan penggunaan memory. Perintah `systemctl status` dan `journalctl` memeriksa status service dan log systemd. Perintah `ss -tulpn` menampilkan socket TCP dan UDP yang sedang listen beserta prosesnya, berguna untuk memastikan service benar-benar berjalan di port yang diharapkan. Perintah `ls -l` memeriksa permission yang sering menjadi penyebab error permission denied.

Selain perintah, pahami konsep permission oktal seperti 644 dan 755, perbedaan user dan group, serta cara membaca log di `/var/log` dan journald. Biasakan bekerja melalui terminal dan SSH karena sebagian besar operasional server production dilakukan tanpa antarmuka grafis.

## Fondasi 2: Networking

Banyak masalah DevOps pada dasarnya adalah masalah jaringan: service tidak dapat diakses, koneksi database timeout, DNS tidak resolve, atau firewall memblokir port. Tanpa pemahaman jaringan dasar, troubleshooting akan banyak mengandalkan tebakan.

Konsep yang disarankan antara lain model TCP/IP secara umum, alamat IP dan subnetting dasar, DNS, HTTP dan TLS, port dan firewall, serta load balancing dan reverse proxy. Perintah berikut membantu diagnosis sehari-hari:

```bash
# Mengecek resolusi DNS
dig example.com +short
nslookup example.com

# Mengecek konektivitas dan latency
ping -c 4 8.8.8.8
traceroute example.com

# Mengecek koneksi TCP ke port tertentu
curl -v https://example.com/health
telnet db.internal 5432
```

Perintah `dig` dan `nslookup` memeriksa apakah nama domain resolve ke IP yang benar. Perintah `ping` memeriksa konektivitas dasar, sedangkan `traceroute` menunjukkan jalur yang dilalui paket. Perintah `curl -v` menampilkan detail koneksi HTTP termasuk handshake TLS dan response header, sangat berguna untuk membedakan masalah aplikasi dan masalah jaringan. Perintah `telnet` ke port database memastikan konektivitas TCP sebelum menyalahkan kredensial atau query.

Pahami juga cara membaca konfigurasi firewall seperti `iptables`, `ufw`, atau security group cloud. Kesalahan umum adalah aplikasi sudah berjalan tetapi port belum dibuka di firewall sehingga tidak dapat diakses dari luar.

## Fondasi 3: Git

Git adalah alat kolaborasi utama untuk semua artefak DevOps, mulai dari script, konfigurasi, definisi infrastruktur, hingga dokumentasi. Kemampuan Git yang rapi membuat perubahan infrastruktur teraudit dan mudah dikembalikan.

Hal yang perlu dikuasai mencakup clone, branch, commit, push, pull, merge, rebase dasar, pull request, dan penyelesaian konflik. Perintah sehari-hari antara lain:

```bash
# Menyinkronkan branch lokal dengan remote
git pull --rebase origin main

# Membuat branch untuk perubahan baru
git checkout -b feat/tambah-healthcheck

# Menyimpan perubahan dengan pesan yang jelas
git add docker-compose.yml
git commit -m "feat(monitoring): tambah healthcheck untuk api"

# Mengirim branch dan membuat pull request
git push -u origin feat/tambah-healthcheck
```

Perintah `pull --rebase` menjaga history tetap linear. Perintah `checkout -b` membuat ruang kerja terpisah agar eksperimen tidak mengganggu branch stabil. Pesan commit yang jelas membantu reviewer dan memudahkan pelacakan insiden di masa depan.

Selain perintah, biasakan alur review: setiap perubahan melalui pull request, dilengkapi deskripsi dampak dan rencana rollback, lalu direview orang lain sebelum merge. Kebiasaan ini sama pentingnya dengan penguasaan sintaks Git.

## Fondasi 4: Bash untuk Automasi Operasional

Bash adalah bahasa automasi paling tersedia di server Linux. Banyak tugas operasional seperti backup, cleanup, health check, dan deployment sederhana dapat diotomatisasi dengan Bash tanpa dependency tambahan.

Contoh script health check sederhana:

```bash
#!/usr/bin/env bash
set -euo pipefail

URL="https://example.com/health"
LOG="/var/log/healthcheck.log"

# Melakukan request dan mengambil HTTP status code
status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL")

if [ "$status" = "200" ]; then
  echo "[$(date '+%F %T')] OK $URL status $status" >> "$LOG"
else
  echo "[$(date '+%F %T')] ALERT $URL status $status" >> "$LOG"
  echo "Health check gagal: $URL status $status" | mail -s "[ALERT] health check" ops@example.com
fi
```

Penjelasan tiap bagian adalah sebagai berikut. Baris `set -euo pipefail` mengaktifkan error handling ketat agar script berhenti ketika ada kegagalan. Perintah `curl` mengambil status code tanpa mengunduh body, dengan timeout 10 detik agar tidak menggantung. Opsi `-w "%{http_code}"` mencetak status code sebagai output. Blok `if` mencatat hasil ke log dan mengirim email jika status bukan 200.

Contoh penjadwalan cron untuk script tersebut:

```cron
# Health check setiap 5 menit
*/5 * * * * /usr/local/bin/healthcheck.sh
```

Baris cron tersebut menjalankan script setiap lima menit. Kombinasi script kecil yang terjadwal seperti ini adalah fondasi automasi operasional sebelum beranjak ke sistem yang lebih kompleks.

## Python Dasar untuk DevOps

Python bukan keharusan untuk semua peran DevOps, tetapi menjadi nilai tambah yang besar. Python berguna untuk script yang lebih kompleks dari Bash, interaksi dengan API cloud, pengolahan data log, dan custom tooling. Banyak tool DevOps seperti Ansible juga berbasis Python sehingga pemahaman dasar membantu troubleshooting.

Materi yang cukup untuk kebutuhan operasional antara lain tipe data dan struktur kontrol, function, pembacaan file, request HTTP, parsing JSON dan YAML, serta penggunaan virtual environment dan pip. Contoh script Python untuk mengecek API dan parsing JSON:

```python
import json
import sys
import urllib.request

URL = "https://example.com/api/status"
TIMEOUT = 10

try:
    with urllib.request.urlopen(URL, timeout=TIMEOUT) as resp:
        data = json.loads(resp.read().decode("utf-8"))
except Exception as exc:
    print(f"ERROR: gagal mengakses {URL}: {exc}", file=sys.stderr)
    sys.exit(1)

# Mengambil field status dari response JSON
status = data.get("status", "unknown")
print(f"API status: {status}")

if status != "ok":
    sys.exit(2)
```

Kode tersebut melakukan request HTTP dengan timeout, memparsing response JSON, mengambil field status, dan mengembalikan exit code berbeda untuk kondisi sukses, gagal akses, dan status tidak sehat. Exit code yang jelas memudahkan integrasi dengan scheduler, monitoring, atau pipeline.

Tidak perlu menjadi software engineer Python penuh untuk peran DevOps. Fokus pada kemampuan membaca dokumentasi API, menulis script utilitas yang rapi, dan menangani error dengan baik sudah memberikan nilai besar.

## Docker dan Konsep Container

Container telah menjadi unit deployment standar di banyak organisasi. Docker memungkinkan aplikasi dan dependency-nya dikemas menjadi image yang konsisten dari laptop developer hingga production. Pemahaman container membantu menjembatani kebutuhan developer dan operasional.

Konsep yang disarankan adalah perbedaan image dan container, Dockerfile, layer dan caching, volume dan network, registry, serta dasar Docker Compose untuk multi-container. Contoh Dockerfile sederhana untuk aplikasi web:

```dockerfile
FROM python:3.12-slim

# Membuat user non-root untuk keamanan
RUN useradd -m appuser
WORKDIR /app

# Menyalin requirements dulu agar layer caching efektif
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Menyalin kode aplikasi dan mengatur kepemilikan
COPY . .
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

Setiap instruksi memiliki alasan. Base image `slim` mengurangi ukuran dan attack surface. Pembuatan user non-root mengurangi risiko jika container terkompromi. Penyalinan `requirements.txt` terlebih dahulu memanfaatkan layer caching sehingga rebuild lebih cepat ketika hanya kode yang berubah. Perintah `EXPOSE` bersifat dokumentatif, sedangkan port mapping nyata dilakukan saat menjalankan container.

Perintah Docker yang sering digunakan:

```bash
# Membangun image dengan tag versi
docker build -t myapp:1.2.0 .

# Menjalankan container dengan port mapping dan restart policy
docker run -d --name myapp --restart unless-stopped -p 8000:8000 myapp:1.2.0

# Melihat log dan status container
docker logs -f myapp
docker ps
```

Perintah `build` membuat image dari Dockerfile. Perintah `run -d` menjalankan container di background dengan restart otomatis. Perintah `logs` dan `ps` digunakan untuk verifikasi dan troubleshooting.

Contoh Docker Compose untuk kebutuhan development dengan aplikasi dan database:

```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://app:secret@db:5432/appdb
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=appdb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

File tersebut mendefinisikan dua service yang saling terhubung melalui network internal Compose. Service `api` dibangun dari Dockerfile lokal, sedangkan service `db` menggunakan image resmi Postgres. Volume `pgdata` memastikan data database bertahan meskipun container dihapus. Contoh ini memberi gambaran alur kerja multi-service sebelum masuk ke orkestrasi seperti Kubernetes.

## CI/CD dan Automasi Pipeline

Continuous Integration dan Continuous Delivery atau Deployment adalah praktik mengintegrasikan perubahan kode secara sering, menguji otomatis, dan merilis dengan cara yang terkontrol. Bagi DevOps Engineer, kemampuan merancang pipeline yang cepat, andal, dan mudah dipahami adalah skill inti.

Contoh pipeline GitHub Actions untuk aplikasi Python:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest ruff
      - name: Lint
        run: ruff check .
      - name: Test
        run: pytest -q
```

Setiap langkah memiliki fungsi. Checkout mengambil kode, setup Python menyiapkan runtime, instalasi menyiapkan dependency dan tool testing, lint memeriksa kualitas kode, dan test menjalankan unit test. Pipeline gagal jika ada langkah yang gagal, sehingga masalah terdeteksi sebelum merge.

Untuk tahap delivery, pelajari konsep artifact dan versioning, deployment ke staging otomatis, approval manual untuk production, strategi deployment seperti rolling dan blue-green, serta rollback. Pipeline yang baik memberi umpan balik cepat, memisahkan build, test, dan deploy, menyimpan artifact yang dapat di-deploy ulang, dan mencatat siapa men-deploy versi apa dan kapan.

## Cloud dan Infrastructure as Code

Cloud adalah tempat sebagian besar infrastruktur modern berjalan. Tidak perlu menguasai semua layanan cloud sekaligus. Mulailah dari layanan inti: compute, network, storage, database terkelola, identity dan akses, serta billing dan monitoring dasar. Pilih satu provider dulu seperti AWS, Google Cloud, atau Azure, lalu dalami pola umumnya sebelum menambah provider lain.

Infrastructure as Code melengkapi cloud dengan menjadikan infrastruktur sebagai file yang teraudit dan dapat diulang. Terraform adalah titik masuk yang populer. Contoh definisi bucket storage dan output-nya:

```hcl
variable "project" {
  type    = string
  default = "learning-devops"
}

resource "aws_s3_bucket" "assets" {
  bucket = "${var.project}-assets"
  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.assets.bucket
}
```

Blok `variable` membuat nama project dapat diubah tanpa mengedit resource. Blok `resource` mendefinisikan bucket dengan tag yang jelas. Blok `output` menampilkan nama bucket setelah apply. Alur `init`, `plan`, dan `apply` memberi kesempatan review sebelum perubahan nyata dilakukan.

Pahami juga konsep state, remote backend, pemisahan environment staging dan production, serta integrasi IaC ke pipeline. Kombinasi cloud dan IaC membuat provisioning environment baru menjadi cepat dan konsisten.

## Monitoring dan Observability Dasar

Sistem yang tidak termonitor adalah sistem yang tidak siap production. Pelajari tiga pilar observability: metrics untuk tren dan alerting, logs untuk detail peristiwa, dan traces untuk alur request terdistribusi. Untuk awal, fokus pada metrics dan logs karena paling sering digunakan.

Contoh query Prometheus untuk error rate:

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

Query tersebut menghitung rasio request error 5xx terhadap total request selama lima menit. Jika nilainya melewati threshold seperti 2 persen, pipeline alert dapat memberi tahu tim. Pahami perbedaan alert yang actionable dan noise. Alert yang baik menunjuk ke gejala pengguna, memiliki severity jelas, dan dilengkapi runbook.

Untuk log, biasakan format terstruktur JSON dengan correlation ID agar mudah dicari di sistem agregasi seperti Loki atau Elasticsearch. Contoh query Loki untuk mencari error pada service tertentu:

```logql
{service="api", level="error"} |= "timeout"
```

Query tersebut memilih stream log dari service api dengan level error, lalu memfilter baris yang mengandung kata timeout. Kemampuan menulis query sederhana seperti ini mempercepat investigasi insiden.

## Security Dasar untuk DevOps

DevOps Engineer tidak harus menjadi security specialist, tetapi perlu memahami dasar keamanan operasional. Topik yang relevan antara lain manajemen secret, prinsip least privilege, hardening SSH, update keamanan rutin, pemindaian vulnerability pada image dan dependency, serta backup dan recovery.

Contoh praktik SSH yang lebih aman di `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Tiga baris tersebut menonaktifkan login root langsung, menonaktifkan autentikasi password yang rentan brute force, dan mewajibkan key-based authentication. Perubahan kecil seperti ini mengurangi attack surface secara signifikan.

Contoh `.gitignore` untuk mencegah secret ter-commit:

```gitignore
.env
*.pem
*.key
*.tfstate
.terraform/
```

Pola tersebut mengabaikan file environment lokal, private key, dan state Terraform yang sensitif. Secret sebaiknya disimpan di secret manager atau CI/CD secrets, sedangkan repository hanya berisi referensi. Jika secret telanjur ter-commit, segera rotasi karena menghapus dari history saja tidak cukup.

## Automation Mindset dan Problem Solving

Selain tool, pola pikir automasi membedakan DevOps Engineer yang efektif. Biasakan mengidentifikasi pekerjaan repetitif, mengukur waktu dan error yang ditimbulkan, lalu mengotomatisasi mulai dari yang paling sering dan paling berisiko. Dokumentasikan automasi agar dapat digunakan orang lain, bukan hanya pembuatnya.

Problem solving yang sistematis juga penting. Ketika insiden terjadi, ikuti alur: pahami gejala dari metrics dan laporan, batasi scope apakah hanya satu service atau meluas, buat hipotesis berdasarkan data, uji satu perubahan dalam satu waktu, catat hasil, dan susun postmortem tanpa menyalahkan. Kemampuan membaca log, menulis query observability, dan menggunakan Git untuk melacak perubahan terakhir sering lebih menentukan daripada hafalan perintah eksotis.

Contoh alur investigasi sederhana adalah memeriksa dashboard error rate, mengambil contoh trace yang gagal, mencari log dengan correlation ID yang sama, memeriksa perubahan Git terakhir di area terkait, lalu menentukan mitigasi sementara sebelum perbaikan permanen. Alur ini dapat dilatih melalui project dan simulasi insiden.

## Roadmap Belajar Bertahap yang Disarankan

Berikut contoh roadmap yang fleksibel dan dapat disesuaikan dengan latar belakang masing-masing. Roadmap ini bukan syarat mutlak, melainkan urutan belajar yang terbukti membantu banyak orang membangun fondasi secara bertahap.

Fase satu fokus pada fondasi selama satu hingga dua bulan. Pelajari Linux harian, jaringan dasar, dan Git. Target praktisnya adalah nyaman bekerja di terminal, memahami permission dan service, mampu diagnosis DNS dan konektivitas, serta mampu berkolaborasi melalui branch dan pull request.

Fase dua fokus pada scripting dan container selama satu hingga dua bulan. Pelajari Bash untuk automasi operasional, Python dasar untuk script utilitas, dan Docker untuk packaging aplikasi. Target praktisnya adalah memiliki beberapa script terjadwal yang terdokumentasi dan mampu membangun serta menjalankan aplikasi multi-container dengan Compose.

Fase tiga fokus pada CI/CD dan cloud selama dua hingga tiga bulan. Pelajari pipeline otomatis, satu provider cloud, dan dasar Infrastructure as Code. Target praktisnya adalah pipeline yang menjalankan lint dan test otomatis, serta infrastruktur staging yang didefinisikan sebagai kode dan dapat dibuat ulang.

Fase empat fokus pada observability dan operasional selama berkelanjutan. Pelajari metrics, log aggregation, alerting, dan dasar security operasional. Target praktisnya adalah dashboard untuk layanan sendiri, alert yang tidak berisik, dan runbook untuk insiden umum.

Setiap fase sebaiknya diakhiri dengan satu project kecil yang dapat didemonstrasikan, bukan hanya tutorial yang diikuti. Portofolio project sering lebih meyakinkan daripada daftar sertifikasi.

## Ide Project Praktis

Project yang baik mensimulasikan masalah dunia nyata dan menggabungkan beberapa skill sekaligus. Berikut beberapa ide yang dapat dipilih sesuai minat, bukan semuanya wajib dikerjakan.

Project pertama adalah server monitoring dengan Bash dan cron. Buat script pengecekan disk, memory, dan service, catat ke log terstruktur, kirim alert email ketika threshold terlampaui, dan simpan semua script di Git dengan README cara instalasi.

Project kedua adalah aplikasi containerized dengan pipeline. Kemas aplikasi Python sederhana ke Docker image, buat Docker Compose untuk development, lalu buat pipeline CI yang menjalankan lint dan test otomatis. Tambahkan image scanning dasar untuk melihat vulnerability.

Project ketiga adalah infrastruktur staging sebagai kode. Definisikan network, satu compute instance, dan satu database terkelola menggunakan Terraform. Pisahkan variable staging dan production, simpan state di remote backend, dan jalankan plan otomatis di pull request.

Project keempat adalah dashboard observability. Ekspos metrics dari aplikasi, kumpulkan log terpusat, buat dashboard Grafana dengan panel error rate dan latency, lalu buat satu alert dengan runbook. Lakukan simulasi insiden dan catat waktu deteksi hingga mitigasi.

Hasilnya kurang lebih seperti ini untuk struktur repository portofolio yang rapi:

```text
devops-portfolio/
├── bash-monitoring/
│   ├── healthcheck.sh
│   ├── README.md
├── docker-app/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .github/workflows/ci.yml
├── terraform-staging/
│   ├── main.tf
│   ├── variables.tf
│   └── README.md
└── README.md
```

Struktur tersebut menunjukkan kemampuan Linux, scripting, container, CI, IaC, dan dokumentasi dalam satu tempat yang mudah direview perekrut atau calon tim.

## Troubleshooting Perjalanan Belajar

Kendala umum pertama adalah tutorial hell, yaitu terus mengikuti tutorial tanpa membangun sesuatu yang mandiri. Solusinya adalah batasi konsumsi tutorial, lalu alokasikan sebagian besar waktu untuk project dengan masalah yang didefinisikan sendiri. Ubah satu parameter, rusak dengan sengaja di environment latihan, lalu perbaiki sambil mencatat.

Kendala kedua adalah mencoba menghafal semua tool sekaligus. Solusinya adalah pilih satu tool per kategori dan dalami alurnya. Misalnya satu CI, satu cloud, satu IaC, dan satu stack observability. Prinsip antar tool sejenis umumnya mirip sehingga pindah tool di kemudian hari akan lebih mudah.

Kendala ketiga adalah belajar tanpa umpan balik. Solusinya adalah minta review dari komunitas, dokumentasikan proses di blog atau README, dan biasakan membaca dokumentasi resmi. Kemampuan membaca dokumentasi dan log error secara mandiri adalah akselerator belajar jangka panjang.

## Checklist Praktis

Sebagai panduan refleksi, bukan syarat kelulusan, berikut checklist yang dapat digunakan untuk menilai kemajuan. Tandai yang sudah nyaman dilakukan: bekerja di Linux terminal termasuk permission, service, dan log; diagnosis jaringan dasar termasuk DNS, port, dan HTTP; kolaborasi Git melalui branch dan pull request; menulis Bash script dengan error handling dan logging; menulis Python utilitas untuk API dan JSON; membangun dan menjalankan Docker image serta Compose; membuat pipeline CI dengan lint dan test; memprovisioning cloud dasar dengan IaC dan remote state; membuat dashboard metrics dan query log sederhana; menerapkan secret management dasar dan hardening SSH. Jika sebagian besar sudah nyaman dan memiliki project yang mendemonstrasikannya, itu adalah sinyal kesiapan yang baik untuk peran junior atau Associate DevOps.

## Kesimpulan

Menjadi DevOps Engineer adalah perjalanan bertahap, bukan ujian sekali lulus. Fondasi Linux, jaringan, Git, dan scripting memberi daya ungkit untuk semua skill lanjutan seperti Docker, CI/CD, cloud, IaC, monitoring, dan security dasar. Yang lebih penting dari jumlah tool yang dikuasai adalah automation mindset, kemampuan troubleshooting sistematis, dan kebiasaan mendokumentasikan serta berkolaborasi melalui version control. Gunakan roadmap di artikel ini sebagai titik awal yang fleksibel, sesuaikan dengan latar belakang dan target peran, bangun portofolio project kecil yang nyata, dan kembangkan secara berkelanjutan. Tidak perlu menunggu sempurna untuk mulai berkontribusi, karena pemahaman terbaik justru tumbuh dari pengalaman operasional nyata.

