---
layout: post
title: "Automasi Maintenance Server Linux dengan Bash Script"
date: 2026-09-26 13:28:58 +0000
description: "Membuat automation sederhana menggunakan Bash untuk membantu pekerjaan maintenance server Linux secara rutin."
categories: []
tags: []
---

# Automasi Maintenance Server Linux dengan Bash Script

Maintenance server Linux sering terdiri dari pekerjaan yang repetitif tetapi penting. Mengecek ruang disk, membersihkan log lama, memverifikasi backup, me-restart service yang gagal, dan memastikan update keamanan terpasang adalah contoh tugas yang harus dilakukan secara rutin. Jika dikerjakan manual, tugas-tugas ini memakan waktu, mudah terlewat, dan hasilnya tidak konsisten antar engineer.

Bash script adalah solusi sederhana dan efektif untuk mengotomatisasi pekerjaan tersebut. Bash tersedia hampir di semua distribusi Linux tanpa instalasi tambahan, mudah dipelajari untuk kebutuhan operasional, dan cukup powerful untuk menggabungkan berbagai command line tool. Artikel ini membahas dasar Bash yang relevan untuk maintenance, teknik logging, contoh script monitoring disk, cleanup, backup, penjadwalan cron, error handling, contoh maintenance script yang utuh, serta praktik aman dalam automasi.

## Kenapa Automasi Itu Penting?

Automasi bukan sekadar menghemat waktu mengetik perintah. Nilai utamanya adalah konsistensi dan keterlihatan. Ketika pengecekan dilakukan oleh script yang sama setiap hari, hasilnya dapat dibandingkan dari waktu ke waktu dan tidak bergantung pada siapa yang sedang bertugas. Script juga dapat mencatat hasilnya ke log terpusat sehingga audit menjadi lebih mudah.

Contoh sederhana adalah pengecekan disk. Engineer yang sibuk mungkin lupa mengecek disk selama berminggu-minggu, lalu tiba-tiba aplikasi gagal karena partisi penuh. Script monitoring yang berjalan setiap jam dan mengirim peringatan ketika penggunaan di atas 80 persen akan mencegah skenario tersebut. Biaya membuat script jauh lebih kecil dibanding biaya downtime.

Automasi juga mengurangi risiko human error. Perintah cleanup yang diketik manual berisiko salah menentukan direktori atau menghapus file yang masih dibutuhkan. Script yang sudah direview dan diuji akan menjalankan perintah yang sama setiap kali dengan parameter yang sudah benar.

## Dasar Bash untuk Kebutuhan Operasional

Bagian ini merangkum sintaks Bash yang paling sering digunakan dalam script maintenance. Pemahaman dasar ini cukup untuk membaca dan menulis sebagian besar script operasional.

### Variables

Variable di Bash didefinisikan tanpa spasi di sekitar tanda sama dengan. Untuk mengambil nilainya, gunakan tanda dolar. Praktik yang baik adalah menggunakan huruf kapital untuk konstanta dan memberi nilai default agar script tidak gagal ketika variable kosong.

```bash
#!/usr/bin/env bash

# Direktori backup dan retensi dalam hari
BACKUP_DIR="/var/backups/myapp"
RETENTION_DAYS="14"
APP_NAME="myapp"

# Membuat direktori jika belum ada, opsi -p mencegah error jika sudah ada
mkdir -p "$BACKUP_DIR"

# Menampilkan nilai variable
echo "Backup direktori: $BACKUP_DIR"
echo "Retensi: $RETENTION_DAYS hari"
```

Penggunaan tanda kutip ganda di sekitar `"$BACKUP_DIR"` penting agar path yang mengandung spasi tetap diperlakukan sebagai satu argumen. Tanpa kutip, path dengan spasi akan pecah menjadi beberapa argumen dan menyebabkan error.

Nilai default dapat didefinisikan dengan sintaks parameter expansion. Contohnya `${RETENTION_DAYS:-14}` berarti gunakan nilai variable jika ada, jika tidak gunakan 14. Sintaks `${LOG_FILE:?LOG_FILE belum di-set}` akan menghentikan script dengan pesan error jika variable belum di-set, sehingga kesalahan konfigurasi cepat terdeteksi.

### Conditions

Percabangan `if` digunakan untuk mengambil keputusan berdasarkan kondisi, misalnya apakah disk penuh atau apakah service berjalan. Untuk perbandingan numerik, gunakan operator seperti `-gt` untuk lebih besar, `-lt` untuk lebih kecil, dan `-eq` untuk sama dengan. Untuk string, gunakan `=` atau `!=`.

```bash
#!/usr/bin/env bash
DISK_USAGE=$(df -P / | awk 'NR==2 {print $5}' | tr -d '%')

# Mengecek apakah penggunaan disk melebihi threshold
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "Peringatan: penggunaan disk ${DISK_USAGE}% melebihi 80%"
else
  echo "Disk aman: ${DISK_USAGE}%"
fi

# Mengecek apakah file konfigurasi ada dan dapat dibaca
CONFIG="/etc/myapp/app.conf"
if [ -f "$CONFIG" ] && [ -r "$CONFIG" ]; then
  echo "Konfigurasi ditemukan: $CONFIG"
else
  echo "Konfigurasi tidak ditemukan atau tidak dapat dibaca"
  exit 1
fi
```

Baris pertama mengambil persentase penggunaan disk root. Perintah `df -P /` menampilkan informasi filesystem dalam format portable. Pipe ke `awk 'NR==2 {print $5}'` mengambil kolom kelima dari baris kedua yaitu kolom Use%. Pipe ke `tr -d '%'` menghapus karakter persen sehingga hasilnya berupa angka. Angka tersebut kemudian dibandingkan dengan threshold 80.

### Functions

Function membantu memecah script besar menjadi bagian kecil yang mudah diuji dan digunakan ulang. Setiap function sebaiknya melakukan satu hal dengan jelas, misalnya mengirim notifikasi, mencatat log, atau melakukan backup database.

```bash
#!/usr/bin/env bash

# Fungsi logging sederhana dengan timestamp
log() {
  local level="$1"
  shift
  printf '[%s] [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$level" "$*"
}

# Fungsi pengecekan service systemd
check_service() {
  local service="$1"
  if systemctl is-active --quiet "$service"; then
    log "INFO" "Service $service berjalan normal"
    return 0
  else
    log "ERROR" "Service $service tidak berjalan"
    return 1
  fi
}

log "INFO" "Memulai pengecekan"
check_service "nginx"
check_service "postgresql"
```

Keyword `local` memastikan variable hanya berlaku di dalam function sehingga tidak mengotori scope global. Perintah `shift` membuang argumen pertama yaitu level log, sehingga sisa argumen dapat digabung sebagai pesan. Fungsi `check_service` mengembalikan status 0 untuk sukses dan 1 untuk gagal, mengikuti konvensi Unix.

## Logging yang Rapi

Script maintenance tanpa logging yang baik akan sulit di-debug ketika gagal di tengah malam melalui cron. Minimal, setiap script harus mencatat waktu mulai, waktu selesai, langkah penting, dan error yang terjadi. Log sebaiknya ditulis ke file sekaligus ke output standar agar terlihat saat dijalankan manual maupun otomatis.

Contoh pola logging ke file dan console secara bersamaan:

```bash
#!/usr/bin/env bash
LOG_FILE="/var/log/maintenance.log"

# Fungsi log yang menulis ke file dan stdout
log() {
  local level="$1"
  shift
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*"
  echo "$msg" | tee -a "$LOG_FILE"
}

log "INFO" "Maintenance dimulai"
# ... langkah maintenance ...
log "INFO" "Maintenance selesai"
```

Perintah `tee -a` membaca dari stdin dan menulis ke file sekaligus ke stdout. Opsi `-a` berarti append sehingga log lama tidak tertimpa. Pola ini membuat script tetap informatif saat dijalankan manual dan tetap tercatat saat dijalankan cron.

Untuk rotasi log agar file tidak membesar tanpa batas, gunakan `logrotate`. Contoh konfigurasi `/etc/logrotate.d/maintenance` adalah sebagai berikut:

```text
/var/log/maintenance.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
    create 0640 root adm
}
```

Konfigurasi tersebut berarti log dirotasi setiap minggu, menyimpan delapan arsip terakhir, mengompresi arsip lama, tidak error jika file hilang, tidak merotasi jika file kosong, dan membuat file baru dengan permission yang aman.

## Script Monitoring Disk

Penuhnya disk adalah penyebab klasik kegagalan aplikasi. Script berikut memeriksa penggunaan disk dan inode, lalu mengirim peringatan jika melewati threshold. Pengecekan inode penting karena partisi bisa kehabisan inode meskipun ruang disk masih tersedia, terutama pada workload dengan banyak file kecil.

```bash
#!/usr/bin/env bash
set -euo pipefail

THRESHOLD=80
RECIPIENT="ops@example.com"
HOSTNAME=$(hostname)

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a /var/log/disk-check.log
}

# Memeriksa penggunaan disk per filesystem, mengabaikan tmpfs dan overlay
df -P -x tmpfs -x overlay | awk 'NR>1 {print $5, $6}' | while read -r usage mount; do
  pct=${usage%\%}
  if [ "$pct" -gt "$THRESHOLD" ]; then
    msg="Peringatan disk di $HOSTNAME: $mount terpakai $usage"
    log "WARNING $msg"
    echo "$msg" | mail -s "[ALERT] Disk $mount $usage di $HOSTNAME" "$RECIPIENT"
  else
    log "INFO $mount terpakai $usage (aman)"
  fi
done

# Memeriksa penggunaan inode
df -iP -x tmpfs -x overlay | awk 'NR>1 {print $5, $6}' | while read -r usage mount; do
  pct=${usage%\%}
  if [ "$pct" -gt "$THRESHOLD" ]; then
    log "WARNING inode $mount terpakai $usage"
  fi
done
```

Penjelasan tiap bagian adalah sebagai berikut. Baris `set -euo pipefail` mengaktifkan error handling ketat yang dibahas lebih detail di bagian tersendiri. Variable `THRESHOLD` menentukan batas peringatan. Perintah `df -P -x tmpfs -x overlay` menampilkan filesystem nyata dan mengabaikan filesystem virtual. Pipe ke `awk` mengambil kolom persentase dan mount point. Sintaks `${usage%\%}` menghapus karakter persen di akhir string. Jika persentase melebihi threshold, script mencatat peringatan dan mengirim email. Loop kedua melakukan hal serupa untuk inode dengan opsi `df -i`.

Hasilnya kurang lebih seperti ini di file log ketika kondisi normal:

```text
[2026-03-10 08:00:01] INFO / terpakai 42% (aman)
[2026-03-10 08:00:01] INFO /data terpakai 61% (aman)
```

## Script Cleanup Aman

File sementara, cache, dan log lama dapat memenuhi disk jika tidak dibersihkan. Namun perintah hapus otomatis harus sangat hati-hati. Kesalahan satu karakter dalam perintah `rm -rf` dapat berakibat fatal. Prinsip amannya adalah selalu membatasi direktori target, menggunakan filter waktu dan pola nama yang spesifik, melakukan dry-run terlebih dahulu, dan mencatat setiap file yang dihapus.

```bash
#!/usr/bin/env bash
set -euo pipefail

CACHE_DIR="/var/cache/myapp"
TMP_DIR="/tmp/myapp"
LOG_DIR="/var/log/myapp"
DAYS_OLD=30

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a /var/log/cleanup.log
}

# Validasi direktori agar tidak kosong dan benar-benar ada
for dir in "$CACHE_DIR" "$TMP_DIR"; do
  if [ -z "${dir:-}" ] || [ "$dir" = "/" ]; then
    log "ERROR direktori tidak valid: $dir, dibatalkan"
    exit 1
  fi
  if [ ! -d "$dir" ]; then
    log "INFO direktori tidak ada, dilewati: $dir"
    continue
  fi
done

# Menghapus file cache lebih lama dari 30 hari, hanya file biasa
log "INFO membersihkan cache di $CACHE_DIR lebih lama dari $DAYS_OLD hari"
find "$CACHE_DIR" -type f -mtime +"$DAYS_OLD" -print -delete >> /var/log/cleanup.log 2>&1

# Menghapus file sementara lebih lama dari 7 hari
find "$TMP_DIR" -type f -mtime +7 -print -delete >> /var/log/cleanup.log 2>&1

# Mengompresi log lama alih-alih langsung menghapus
find "$LOG_DIR" -type f -name "*.log.*" -mtime +14 -exec gzip {} \; 2>/dev/null || true

log "INFO cleanup selesai"
```

Setiap perintah memiliki penjelasan. Blok validasi memastikan script tidak pernah berjalan dengan direktori root atau variable kosong. Perintah `find ... -type f` memastikan hanya file biasa yang dihapus, bukan direktori. Opsi `-mtime +30` memilih file yang dimodifikasi lebih dari 30 hari lalu. Opsi `-print -delete` mencatat nama file sebelum menghapus sehingga ada audit trail. Untuk log, script memilih mengompresi alih-alih menghapus agar data masih tersedia jika dibutuhkan.

Sebelum mengaktifkan mode hapus otomatis, jalankan dulu dalam mode dry-run dengan mengganti `-delete` menjadi `-print` dan periksa daftar file yang akan terkena. Langkah kecil ini mencegah kecelakaan besar.

## Script Backup Sederhana

Backup yang baik memenuhi tiga kriteria: berjalan otomatis, diverifikasi, dan dapat di-restore. Script berikut membuat arsip terkompresi dari direktori aplikasi, memberi nama berbasis tanggal, menyimpan checksum, menghapus backup yang terlalu lama, dan mencatat setiap langkah.

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/srv/myapp"
BACKUP_DIR="/var/backups/myapp"
RETENTION_DAYS=14
DATE=$(date '+%Y%m%d-%H%M%S')
BACKUP_FILE="$BACKUP_DIR/myapp-$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a /var/log/backup.log
}

log "INFO memulai backup $APP_DIR ke $BACKUP_FILE"

# Membuat arsip terkompresi dari direktori aplikasi
tar -czf "$BACKUP_FILE" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")"

# Membuat checksum untuk verifikasi integritas
sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"

# Memverifikasi arsip dapat dibaca
tar -tzf "$BACKUP_FILE" > /dev/null
log "INFO verifikasi arsip sukses"

# Menghapus backup lebih lama dari masa retensi
find "$BACKUP_DIR" -type f -name "myapp-*.tar.gz" -mtime +"$RETENTION_DAYS" -print -delete >> /var/log/backup.log 2>&1
find "$BACKUP_DIR" -type f -name "myapp-*.sha256" -mtime +"$RETENTION_DAYS" -delete >> /var/log/backup.log 2>&1

log "INFO backup selesai: $BACKUP_FILE"
ls -lh "$BACKUP_FILE" >> /var/log/backup.log
```

Penjelasan perintah kunci adalah sebagai berikut. Perintah `tar -czf` membuat arsip gzip dari direktori aplikasi. Opsi `-C` pindah ke parent direktori terlebih dahulu agar struktur arsip rapi. Perintah `sha256sum` menghasilkan checksum yang dapat digunakan untuk memastikan file tidak korup saat dipindah atau di-restore. Perintah `tar -tzf` mengetes arsip tanpa mengekstrak, sehingga korupsi langsung terdeteksi. Perintah `find` membersihkan backup lama sesuai retensi.

Untuk database, tambahkan dump sebelum pengarsipan. Contoh untuk PostgreSQL:

```bash
# Membuat dump database sebelum diarsipkan
pg_dump -U myapp -h localhost myapp_db > "/tmp/myapp_db-$DATE.sql"
tar -czf "$BACKUP_FILE" -C /tmp "myapp_db-$DATE.sql" -C / srv/myapp
rm -f "/tmp/myapp_db-$DATE.sql"
```

Backup lokal saja tidak cukup. Salin hasil backup ke storage offsite seperti S3, NFS terpisah, atau server backup khusus menggunakan `rsync` atau `rclone`. Jadwalkan juga uji restore berkala karena backup yang belum pernah di-restore tidak bisa dianggap andal.

## Penjadwalan dengan Cron

Script yang sudah jadi perlu dijadwalkan agar berjalan otomatis. Cron adalah scheduler standar di Linux. Setiap baris crontab terdiri dari lima kolom waktu diikuti perintah yang dijalankan: menit, jam, tanggal, bulan, dan hari dalam seminggu.

Contoh jadwal maintenance yang umum:

```bash
# Melihat crontab user saat ini
crontab -l

# Mengedit crontab
crontab -e
```

```cron
# Cek disk setiap jam
0 * * * * /usr/local/bin/disk-check.sh

# Cleanup setiap Minggu jam 02:30
30 2 * * 0 /usr/local/bin/cleanup.sh

# Backup setiap hari jam 01:00
0 1 * * * /usr/local/bin/backup.sh

# Update keamanan otomatis dengan log, setiap hari jam 03:00
0 3 * * * /usr/bin/apt-get update && /usr/bin/apt-get -y upgrade >> /var/log/auto-update.log 2>&1
```

Setiap baris memiliki arti sebagai berikut. Baris pertama menjalankan cek disk setiap jam tepat menit nol. Baris kedua menjalankan cleanup setiap hari Minggu pukul 02.30. Baris ketiga menjalankan backup setiap hari pukul 01.00. Baris keempat melakukan update package setiap hari pukul 03.00 dan mencatat output ke file log.

Beberapa catatan penting untuk cron. Selalu gunakan path absolut karena environment cron sangat minimal. Definisikan variable seperti `PATH`, `SHELL`, dan `MAILTO` di awal crontab jika diperlukan. Arahkan output ke log agar tidak hilang. Contoh header crontab yang rapi:

```cron
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=ops@example.com

0 * * * * /usr/local/bin/disk-check.sh >> /var/log/disk-check.log 2>&1
```

Untuk tugas yang membutuhkan presisi, dependensi antar job, atau retry otomatis, pertimbangkan systemd timer sebagai alternatif cron. Systemd timer memberi fitur logging terintegrasi melalui journalctl, kontrol resource, dan status yang lebih mudah dimonitor.

## Error Handling dengan set -euo pipefail

Banyak script Bash gagal secara diam-diam karena error tidak terdeteksi. Script tetap lanjut ke baris berikutnya meskipun perintah sebelumnya gagal, sehingga kerusakan baru disadari di akhir. Baris berikut adalah standar minimum untuk script yang serius:

```bash
set -euo pipefail
```

Masing-masing opsi memiliki fungsi. Opsi `-e` membuat script berhenti segera ketika ada perintah yang gagal dan mengembalikan status non-nol. Opsi `-u` membuat script berhenti ketika ada variable yang belum di-set, sehingga typo nama variable langsung ketahuan. Opsi `-o pipefail` membuat pipeline mengembalikan status gagal jika ada salah satu perintah di dalamnya yang gagal, bukan hanya perintah terakhir.

Contoh pola trap untuk cleanup saat script berhenti:

```bash
#!/usr/bin/env bash
set -euo pipefail

TMP_WORK=$(mktemp -d)

# Memastikan direktori sementara selalu dibersihkan
cleanup() {
  rm -rf "$TMP_WORK"
}
trap cleanup EXIT

# Jika ada error, catat baris yang gagal
trap 'echo "ERROR di baris $LINENO, perintah: $BASH_COMMAND" >&2' ERR

echo "Bekerja di $TMP_WORK"
# ... proses utama ...
```

Fungsi `cleanup` yang dipasang pada trap `EXIT` memastikan direktori sementara selalu dihapus baik script sukses maupun gagal. Trap `ERR` mencatat baris dan perintah yang gagal sehingga debugging lebih cepat.

## Contoh Maintenance Script Utuh

Berikut contoh script gabungan yang merangkum banyak konsep di atas. Script ini melakukan cek disk, cek service, cleanup ringan, dan merangkum hasilnya.

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_NAME="myapp"
THRESHOLD=80
LOG_FILE="/var/log/weekly-maintenance.log"
REPORT="/tmp/maintenance-report.txt"

log() {
  local level="$1"
  shift
  printf '[%s] [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$level" "$*" | tee -a "$LOG_FILE"
}

check_disk() {
  log "INFO === Cek disk ==="
  df -P -x tmpfs -x overlay | awk 'NR>1 {print $5, $6}' | while read -r usage mount; do
    pct=${usage%\%}
    if [ "$pct" -gt "$THRESHOLD" ]; then
      log "WARNING $mount terpakai $usage"
      echo "WARNING disk $mount $usage" >> "$REPORT"
    else
      log "INFO $mount terpakai $usage"
    fi
  done
}

check_services() {
  log "INFO === Cek service ==="
  for svc in nginx postgresql redis-server; do
    if systemctl is-active --quiet "$svc"; then
      log "INFO $svc aktif"
    else
      log "ERROR $svc tidak aktif, mencoba restart"
      systemctl restart "$svc"
      sleep 3
      if systemctl is-active --quiet "$svc"; then
        log "INFO $svc berhasil di-restart"
      else
        log "ERROR $svc gagal di-restart, perlu investigasi manual"
        echo "ERROR service $svc gagal restart" >> "$REPORT"
      fi
    fi
  done
}

cleanup_tmp() {
  log "INFO === Cleanup sementara ==="
  find /tmp/myapp -type f -mtime +7 -print -delete >> "$LOG_FILE" 2>&1 || true
  log "INFO cleanup selesai"
}

main() {
  : > "$REPORT"
  log "INFO maintenance $APP_NAME dimulai"
  check_disk
  check_services
  cleanup_tmp
  log "INFO maintenance selesai"
  if [ -s "$REPORT" ]; then
    log "WARNING ditemukan masalah, isi laporan:"
    cat "$REPORT" >> "$LOG_FILE"
  else
    log "INFO tidak ada masalah kritis"
  fi
}

main "$@"
```

Fungsi `main` mengatur alur eksekusi agar mudah dibaca. Perintah `: > "$REPORT"` mengosongkan file laporan di awal. Setiap tahap mencatat hasilnya ke log dan menambahkan temuan penting ke laporan. Di akhir, script merangkum apakah ada masalah yang perlu perhatian manual. Pola ini membuat script mudah diperluas dengan tahap baru tanpa mengacaukan alur utama.

## Praktik Automasi yang Aman

Automasi yang ceroboh bisa lebih berbahaya daripada pekerjaan manual. Berikut prinsip aman yang perlu dipegang. Pertama, selalu uji di environment staging atau server non-produksi sebelum menjalankan di production. Kedua, gunakan mode dry-run untuk perintah destruktif dan review daftar file yang akan terkena. Ketiga, buat backup sebelum cleanup besar. Keempat, batasi permission script dan file kredensial, misalnya mode 750 untuk script dan 600 untuk file berisi password. Kelima, jangan menyimpan password langsung di script, gunakan file environment terpisah atau secret manager.

Contoh pengelolaan permission yang aman:

```bash
# Script hanya dapat dibaca dan dieksekusi owner dan grup ops
chown root:ops /usr/local/bin/backup.sh
chmod 0750 /usr/local/bin/backup.sh

# File kredensial hanya dapat dibaca owner
chmod 0600 /etc/myapp/backup.env

# Menggunakan file environment di dalam script
set -a
source /etc/myapp/backup.env
set +a
```

Perintah `chown` dan `chmod` membatasi siapa yang dapat membaca dan menjalankan script. File environment dimuat dengan `source` sehingga kredensial tidak tertulis langsung di script. Opsi `set -a` mengekspor semua variable yang dimuat agar tersedia untuk perintah anak.

## Troubleshooting Umum

Masalah pertama adalah script berjalan manual tetapi gagal di cron. Penyebab paling umum adalah perbedaan environment, terutama `PATH` yang minimal dan working directory yang berbeda. Solusinya adalah menggunakan path absolut untuk semua perintah dan file, mendefinisikan `PATH` di crontab, dan mencatat output cron ke file log untuk diperiksa.

Masalah kedua adalah script berhenti tanpa pesan jelas. Aktifkan mode debug sementara dengan menambahkan `set -x` di awal script atau menjalankan dengan `bash -x script.sh`. Opsi ini menampilkan setiap perintah sebelum dieksekusi beserta hasil ekspansi variable, sehingga alur kegagalan mudah dilacak.

```bash
# Menjalankan script dalam mode debug
bash -x /usr/local/bin/backup.sh
```

Masalah ketiga adalah error `unbound variable` setelah menambahkan `set -u`. Ini biasanya karena variable opsional belum di-set. Solusinya adalah memberi nilai default dengan sintaks `${VAR:-default}` atau memeriksa keberadaan variable sebelum digunakan.

Masalah keempat adalah pipeline menyembunyikan kegagalan, misalnya `pg_dump ... | gzip > backup.gz` tetap sukses meskipun `pg_dump` gagal. Opsi `pipefail` mengatasi hal ini, tetapi pastikan juga memeriksa status backup dengan verifikasi arsip dan checksum seperti contoh sebelumnya.

## Kesimpulan

Bash script adalah alat yang sederhana tetapi sangat efektif untuk automasi maintenance server Linux. Dengan menguasai variable, kondisi, function, logging, penjadwalan cron, dan error handling yang ketat, engineer dapat membangun automasi yang andal untuk monitoring disk, cleanup, backup, dan pengecekan service rutin. Kunci keberhasilannya bukan pada kecanggihan script, melainkan pada kedisiplinan: menguji sebelum production, mencatat setiap langkah ke log, memverifikasi backup dapat di-restore, dan menerapkan permission yang aman. Mulailah dari satu tugas kecil yang paling sering dilakukan manual, otomatiskan dengan baik, lalu perluas secara bertahap ke tugas lainnya.

