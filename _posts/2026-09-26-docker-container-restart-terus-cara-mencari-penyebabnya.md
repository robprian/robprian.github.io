---
layout: post
title: "Docker Container Restart Terus? Ini Cara Mencari Penyebabnya"
date: 2026-09-26 13:29:27 +0000
description: "Panduan troubleshooting Docker container yang terus restart, mulai dari membaca logs hingga memeriksa configuration dan resource."
categories: []
tags: []
---

# Docker Container Restart Terus? Ini Cara Mencari Penyebabnya

Salah satu kejadian paling membingungkan bagi pengguna Docker adalah container yang terus restart. Baru saja dijalankan, statusnya langsung berubah menjadi `Restarting`, lalu kembali mencoba menyala, gagal lagi, dan begitu seterusnya. Aplikasi tidak bisa diakses, log terlihat terpotong-potong, dan dashboard monitoring dipenuhi notifikasi.

Kondisi ini disebut restart loop. Penyebabnya bisa berasal dari banyak lapisan, mulai dari aplikasi yang crash, konfigurasi yang salah, port yang bentrok, file yang hilang, hingga memori yang habis. Artikel ini membahas cara mencari penyebabnya secara sistematis menggunakan `docker ps`, `docker logs`, `docker inspect`, tabel exit code, serta pemeriksaan environment variable, mount, dan restart policy. Di bagian akhir terdapat alur troubleshooting langkah demi langkah yang bisa diikuti saat insiden.

## Memahami Konsep Restart Loop

Secara default, container Docker berjalan selama process utama di dalamnya berjalan. Ketika process dengan PID 1 tersebut berhenti, container ikut berhenti. Perilaku setelah berhenti ditentukan oleh restart policy.

Ada empat kebijakan restart yang umum dipakai:

- `no` berarti container tidak otomatis dijalankan ulang. Ini adalah default jika tidak ditentukan.
- `on-failure` berarti container dijalankan ulang hanya jika keluar dengan kode error bukan nol.
- `unless-stopped` berarti container selalu dijalankan ulang kecuali dihentikan secara manual.
- `always` berarti container selalu dijalankan ulang, termasuk setelah Docker daemon restart.

Restart loop terjadi ketika container memakai kebijakan restart otomatis, tetapi penyebab kegagalannya tidak hilang sendiri. Misalnya, aplikasi selalu crash karena environment variable belum diisi, maka setiap restart akan gagal dengan cara yang sama. Hasilnya adalah siklus tanpa akhir.

Penting untuk membedakan restart loop dengan container yang sengaja exit. Container yang menjalankan tugas sekali jalan seperti migrasi database memang dirancang untuk berhenti setelah selesai. Container seperti itu tidak seharusnya diberi restart policy `always`. Sebaliknya, service long-running seperti web server atau worker memang seharusnya memakai `unless-stopped` atau `always` agar tahan terhadap gangguan sementara.

## Langkah 1: Melihat Status dengan docker ps

Langkah pertama saat container bermasalah adalah melihat statusnya.

```bash
docker ps -a
```

Opsi `-a` menampilkan semua container, termasuk yang sudah berhenti, tidak hanya yang sedang berjalan. Contoh baris keluaran untuk container bermasalah kurang lebih seperti ini:

```text
CONTAINER ID   IMAGE          COMMAND        CREATED        STATUS                          NAMES
a1b2c3d4e5f6   demo-app:1.0   "npm start"    5 minutes ago  Restarting (1) 10 seconds ago   demo-app
```

Informasi penting dari baris tersebut adalah kolom `STATUS`. Tulisan `Restarting (1)` berarti container sedang dalam siklus restart dan kode keluar terakhir adalah `1`. Angka dalam kurung adalah exit code yang menjadi petunjuk awal jenis kegagalan. Kolom `NAMES` menunjukkan nama container yang dipakai untuk perintah berikutnya, sedangkan kolom `COMMAND` menunjukkan perintah utama yang dijalankan.

Untuk melihat frekuensi restart secara kuantitatif, gunakan perintah berikut.

```bash
docker inspect -f "{{ .RestartCount }} {{ .State.Status }} {{ .HostConfig.RestartPolicy.Name }}" demo-app
```

Penjelasan perintah:

- `docker inspect` menampilkan detail konfigurasi dan status container dalam format JSON.
- Opsi `-f` memformat keluaran agar hanya menampilkan field tertentu.
- `.RestartCount` menunjukkan berapa kali container sudah di-restart.
- `.State.Status` menunjukkan status saat ini.
- `.HostConfig.RestartPolicy.Name` menunjukkan kebijakan restart yang aktif.

Jika `RestartCount` terus bertambah dalam hitungan menit, dapat dipastikan terjadi restart loop, bukan sekadar satu kali crash.

## Langkah 2: Membaca Log dengan docker logs

Setelah status dikonfirmasi, langkah berikutnya adalah membaca log. Log adalah sumber informasi paling langsung karena biasanya berisi pesan error dari aplikasi.

```bash
docker logs demo-app
```

Perintah tersebut menampilkan stdout dan stderr dari container. Untuk container yang restart terus, tambahkan opsi berikut agar lebih informatif.

```bash
docker logs --tail 100 --timestamps demo-app
```

Penjelasan opsi:

- `--tail 100` hanya menampilkan seratus baris terakhir agar tidak tenggelam dalam log lama.
- `--timestamps` menambahkan waktu pada tiap baris sehingga mudah melihat pola kegagalan berulang.

Contoh pola log restart loop kurang lebih seperti ini:

```text
2026-03-10T08:12:01Z Server berjalan pada port 3000
2026-03-10T08:12:02Z Error: connect ECONNREFUSED 172.18.0.3:5432
2026-03-10T08:12:02Z npm ERR! Lifecycle script failed
2026-03-10T08:12:05Z Server berjalan pada port 3000
2026-03-10T08:12:06Z Error: connect ECONNREFUSED 172.18.0.3:5432
```

Dari contoh tersebut terlihat aplikasi sempat menyala, lalu gagal konek ke database dan mati. Karena restart policy aktif, siklusnya berulang setiap beberapa detik. Tanpa log, kasus seperti ini mudah disangka masalah image, padahal masalahnya ada pada konektivitas database.

Jika log container kosong, kemungkinan penyebabnya adalah aplikasi menulis log hanya ke file di dalam container, bukan ke stdout. Untuk kasus tersebut, jalankan container sementara dengan shell dan periksa file log manual, atau perbaiki aplikasi agar juga menulis ke stdout. Praktik logging ke stdout sangat disarankan agar `docker logs` dan sistem log terpusat bisa bekerja.

Untuk mengikuti log secara real-time saat container restart, gunakan opsi follow.

```bash
docker logs -f demo-app
```

Perintah ini akan terus menampilkan log baru sampai dihentikan dengan `Ctrl+C`. Cara ini berguna untuk melihat urutan kejadian tepat sebelum crash.

## Langkah 3: Memeriksa Detail dengan docker inspect

Jika log belum memberikan jawaban, periksa konfigurasi container dengan `docker inspect`.

```bash
docker inspect demo-app
```

Perintah tersebut menghasilkan dokumen JSON yang cukup panjang. Beberapa bagian yang paling relevan untuk kasus restart loop adalah `State`, `Config`, `HostConfig`, dan `Mounts`.

Untuk membaca bagian penting saja tanpa menelusuri seluruh JSON, gunakan format berikut.

```bash
docker inspect -f "{{ .State.ExitCode }} {{ .State.Error }} {{ .State.OOMKilled }}" demo-app
```

Penjelasan field:

- `.State.ExitCode` adalah kode keluar terakhir. Nilai nol berarti berhenti normal, nilai bukan nol berarti error.
- `.State.Error` berisi pesan error dari Docker daemon jika ada.
- `.State.OOMKilled` bernilai `true` jika container dimatikan karena kehabisan memori.

Contoh lain untuk memeriksa perintah dan environment:

```bash
docker inspect -f "{{ .Config.Cmd }} {{ .Config.Entrypoint }}" demo-app
docker inspect -f "{{ range .Config.Env }}{{ . }}{{ printf \"\\n\" }}{{ end }}" demo-app
```

Perintah pertama menunjukkan perintah utama container, sedangkan perintah kedua menampilkan daftar environment variable. Pemeriksaan ini membantu memastikan tidak ada typo pada command, serta memastikan variabel penting seperti `DATABASE_URL` atau `PORT` benar-benar masuk ke container.

Untuk memeriksa mount dan port:

```bash
docker inspect -f "{{ json .Mounts }}" demo-app | python3 -m json.tool
docker inspect -f "{{ json .HostConfig.PortBindings }}" demo-app | python3 -m json.tool
```

Perintah di atas memformat keluaran JSON agar mudah dibaca. Dari sini bisa terlihat apakah direktori yang dibutuhkan aplikasi benar-benar ter-mount, dan apakah port host yang diminta sudah sesuai rencana.

## Memahami Exit Code: Tabel Petunjuk Awal

Exit code adalah angka yang menunjukkan alasan berhentinya sebuah process. Berikut tabel exit code yang paling sering ditemui pada kasus Docker.

| Exit Code | Arti Umum | Kemungkinan Penyebab |
|-----------|-----------|----------------------|
| 0 | Berhenti normal | Container task sekali jalan selesai, atau aplikasi dimatikan graceful |
| 1 | Error umum aplikasi | Exception tidak tertangani, config salah, koneksi database gagal |
| 2 | Misuse perintah | Argumen command salah, script entrypoint typo |
| 125 | Docker daemon error | Perintah `docker run` salah, image tidak ditemukan, flag tidak valid |
| 126 | Permission denied | File entrypoint tidak executable, masalah permission |
| 127 | File tidak ditemukan | Binary atau script tidak ada di PATH, salah nama file |
| 134 | Abort (SIGABRT) | Aplikasi crash parah, masalah native module, bug runtime |
| 137 | Killed (SIGKILL) | OOMKilled oleh kernel, atau dihentikan paksa dengan `docker kill` |
| 139 | Segmentation fault | Bug native code, ketidakcocokan library C, masalah arsitektur image |
| 143 | Terminated (SIGTERM) | Dihentikan graceful oleh `docker stop` atau orchestrator |

Dua kode yang paling sering muncul pada restart loop adalah `1` dan `137`. Kode `1` menandakan error di level aplikasi sehingga investigation diarahkan ke log aplikasi dan konfigurasi. Kode `137` menandakan container dibunuh dari luar, dan jika field `OOMKilled` bernilai `true`, penyebabnya hampir pasti kehabisan memori.

Perlu dicatat bahwa tabel ini adalah titik awal, bukan vonis akhir. Exit code `1` dari aplikasi Node.js bisa berarti apa saja, sehingga tetap harus dikorelasikan dengan isi log dan hasil `docker inspect`.

## Penyebab Umum dan Cara Memeriksanya

### Environment Variable Hilang atau Salah

Aplikasi modern sangat bergantung pada environment variable. Satu variabel yang hilang, misalnya `DATABASE_URL`, bisa membuat aplikasi langsung exit saat startup.

Cara memeriksa:

```bash
docker exec -it demo-app env | sort
```

Namun perintah tersebut hanya bisa dipakai jika container sempat hidup cukup lama. Jika container langsung mati, gunakan `docker inspect` seperti contoh sebelumnya, atau periksa file Compose dan perintah `docker run` yang dipakai. Bandingkan dengan contoh `.env` atau dokumentasi proyek untuk memastikan tidak ada variabel wajib yang terlewat.

Gejala khas masalah ini adalah log yang berisi pesan seperti `missing environment variable`, `undefined`, `ECONNREFUSED` ke host yang aneh, atau `authentication failed` karena kredensial kosong.

### Port Conflict

Port conflict terjadi ketika dua container atau service berebut port host yang sama. Contohnya, container baru meminta `-p 8080:3000` padahal port 8080 sudah dipakai container lain.

Gejala yang muncul biasanya adalah container langsung exit dengan pesan error bahwa port sudah dialokasikan, atau aplikasi di dalam container gagal bind ke port yang diminta. Cara memeriksa port yang sedang dipakai:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
ss -tulpn | grep -E ":8080|:3000"
```

Perintah pertama menampilkan mapping port semua container, sedangkan perintah kedua memeriksa port pada level host. Penjelasan opsi `ss`, yaitu `-t` untuk TCP, `-u` untuk UDP, `-l` untuk listening, `-p` untuk process, dan `-n` untuk numeric, membantu menemukan process mana yang menahan port tersebut. Solusinya adalah memetakan ke port host lain atau menghentikan service yang bentrok.

### File, Mount, atau Permission Hilang

Aplikasi bisa gagal start karena file konfigurasi tidak ditemukan, direktori upload belum ada, atau permission salah. Masalah ini sering muncul setelah migrasi dari local ke server karena path berbeda, atau setelah mengubah volume tanpa menyesuaikan kode.

Cara memeriksa daftar mount telah dibahas melalui `docker inspect`. Untuk memeriksa isi mount dari dalam container yang masih hidup sesaat, gunakan:

```bash
docker exec -it demo-app ls -la /app
docker exec -it demo-app ls -la /app/uploads
```

Jika container terlalu cepat mati untuk di-exec, jalankan image yang sama dengan entrypoint override untuk inspeksi manual.

```bash
docker run --rm -it --entrypoint sh demo-app:1.0 -c "ls -la /app && id"
```

Penjelasan perintah:

- `--entrypoint sh` mengganti perintah utama dengan shell agar container tidak langsung menjalankan aplikasi yang crash.
- `-c` menjalankan perintah inspeksi lalu keluar.
- `id` menunjukkan user aktif sehingga bisa dinilai apakah masalahnya adalah permission.

Gejala khas kategori ini adalah pesan `ENOENT`, `no such file or directory`, `permission denied`, atau `EACCES` pada log.

### Aplikasi Crash Saat Startup

Kategori ini mencakup bug kode, dependency yang tidak terpasang, versi runtime yang tidak cocok, dan kegagalan koneksi ke database atau cache. Ciri utamanya adalah log aplikasi menunjukkan stack trace atau error spesifik sebelum container mati.

Langkah pemeriksaan yang disarankan adalah membaca seratus baris terakhir log dengan timestamp, mencari baris error pertama bukan baris terakhir, lalu menelusuri ke atas untuk melihat konteksnya. Baris error pertama biasanya lebih dekat ke akar masalah, sedangkan baris-baris berikutnya sering kali hanya efek domino.

Untuk aplikasi Node.js, pesan seperti `Cannot find module`, `SyntaxError`, atau `UnhandledPromiseRejection` adalah petunjuk langsung. Untuk aplikasi yang bergantung pada database, pastikan service database sudah siap dan aplikasi memiliki logika retry, karena `depends_on` pada Compose hanya mengatur urutan start, bukan kesiapan koneksi.

### Memory Limit dan OOMKilled

Jika container mati dengan exit code 137 dan `OOMKilled` bernilai `true`, penyebabnya adalah kehabisan memori. Hal ini bisa terjadi karena limit yang terlalu kecil atau karena memory leak di aplikasi.

Cara memeriksa limit dan penggunaan:

```bash
docker stats --no-stream demo-app
dmesg | grep -i -E "oom|killed process" | tail -n 20
```

Penjelasan:

- `docker stats` menampilkan penggunaan CPU, memori, dan I/O secara real-time. Opsi `--no-stream` hanya mengambil satu snapshot.
- `dmesg` menampilkan log kernel, termasuk pesan OOM killer yang mematikan process karena tekanan memori.

Solusi jangka pendek adalah menaikkan limit memori jika host masih punya ruang. Solusi jangka panjang adalah memperbaiki aplikasi, misalnya menutup koneksi yang bocor, membatasi cache in-memory, atau memecah proses batch besar menjadi potongan kecil. Tanpa perbaikan aplikasi, menaikkan limit hanya menunda crash berikutnya.

## Restart Policy yang Tepat

Restart policy yang terlalu agresif bisa memperparah masalah. Misalnya, aplikasi yang gagal konek ke database akan terus membanjiri log dan membebani sistem jika di-restart setiap detik tanpa jeda. Sebaliknya, tanpa restart policy, service penting akan tetap mati setelah gangguan sementara seperti reboot server.

Panduan praktisnya:

- Gunakan `unless-stopped` untuk service long-running seperti web server, worker, dan database pada host tunggal.
- Gunakan `on-failure` dengan batas retry untuk task yang boleh gagal sementara tetapi tidak perlu dipaksa selalu hidup.
- Jangan gunakan `always` untuk job sekali jalan seperti migrasi atau seed database.
- Pada Docker Compose, definisikan restart policy secara eksplisit agar perilaku tiap service jelas.
- Lengkapi dengan healthcheck agar orchestrator bisa membedakan container yang benar-benar sehat dengan container yang hanya terlihat hidup.

Contoh healthcheck pada Compose:

```yaml
services:
  app:
    image: demo-app:1.0.0
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
```

Penjelasan:

- `test` adalah perintah untuk menguji kesehatan, dalam contoh ini meminta endpoint `/health`.
- `interval` adalah jeda antar pemeriksaan.
- `timeout` adalah batas waktu tiap pemeriksaan.
- `retries` adalah jumlah kegagalan beruntun sebelum container dinyatakan tidak sehat.
- `start_period` memberi jeda awal agar aplikasi yang butuh waktu startup tidak langsung dinyatakan gagal.

## Alur Troubleshooting Langkah demi Langkah

Berikut alur yang disarankan saat menghadapi container yang restart terus. Urutannya dirancang dari pemeriksaan termurah ke yang lebih dalam.

1. Jalankan `docker ps -a` dan catat status, exit code, dan nama container.
2. Jalankan `docker logs --tail 100 --timestamps <nama>` dan cari error pertama yang muncul berulang.
3. Jalankan `docker inspect` untuk memeriksa exit code, `OOMKilled`, restart policy, command, environment variable, mount, dan port binding.
4. Cocokkan exit code dengan tabel di atas untuk menentukan arah investigation, apakah ke aplikasi, permission, atau memori.
5. Periksa environment variable wajib dan bandingkan dengan dokumentasi atau file contoh.
6. Periksa port binding dengan `docker ps` dan `ss` untuk menyingkirkan kemungkinan konflik.
7. Periksa mount dan permission, terutama jika log berisi `ENOENT`, `EACCES`, atau `permission denied`.
8. Periksa memori dengan `docker stats` dan `dmesg` jika exit code 137 atau `OOMKilled` bernilai true.
9. Perbaiki akar masalah pada image, konfigurasi, atau aplikasi, lalu bangun ulang image dengan tag baru jika kodenya berubah.
10. Uji container secara manual tanpa restart policy terlebih dahulu agar error terlihat jelas, misalnya dengan `docker run --rm`, sebelum mengembalikan restart policy otomatis.
11. Setelah stabil, pantau `RestartCount` selama beberapa menit untuk memastikan siklus tidak berulang.

Pendekatan bertahap ini mencegah tebakan acak seperti langsung rebuild image atau menaikkan resource tanpa bukti. Setiap langkah menghasilkan data yang mempersempit kemungkinan penyebab.

## Kesimpulan

Container yang restart terus hampir selalu memberikan petunjuk jika diperiksa dengan urutan yang benar. Mulai dari `docker ps` untuk status dan exit code, lanjut ke `docker logs` untuk pesan error, lalu ke `docker inspect` untuk konfigurasi dan status OOM. Setelah itu, arahkan investigation ke kategori yang paling sesuai, entah itu environment variable, port conflict, file dan mount, crash aplikasi, memori, atau restart policy yang kurang tepat.

Dengan memahami arti exit code dan mengikuti alur troubleshooting yang sistematis, waktu diagnosis bisa dipangkas signifikan. Pada akhirnya, restart loop bukan misteri, melainkan gejala dari satu masalah spesifik yang akan terlihat jelas begitu datanya dibaca dengan teliti.

