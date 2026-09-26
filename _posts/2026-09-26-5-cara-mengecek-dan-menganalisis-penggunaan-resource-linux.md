---
layout: post
title: "5 Cara Mengecek dan Menganalisis Penggunaan Resource Linux"
date: 2026-09-26 13:47:36 +0000
description: "Panduan praktis untuk mengecek CPU, RAM, disk, process, dan resource usage pada server Linux menggunakan command-line tools."
image: "https://docs.ghazi.biz.id/cdn/3399baebec2abb3c/stream"
categories: []
tags: []
---

# 5 Cara Mengecek dan Menganalisis Penggunaan Resource Linux

Server yang lambat jarang memberikan peringatan yang jelas. Kadang website mulai terasa berat, kadang query database tiba-tiba memakan waktu dua kali lipat, dan kadang aplikasi gagal merespons sama sekali. Dalam banyak kasus, akar masalahnya adalah resource sistem yang menipis, entah itu CPU yang jenuh, RAM yang habis, disk yang penuh, atau antrian process yang menumpuk. Kemampuan membaca kondisi resource Linux melalui command line adalah keterampilan dasar yang wajib dimiliki oleh system administrator, DevOps engineer, maupun backend developer yang mengelola server sendiri.

Artikel ini membahas lima cara praktis untuk mengecek dan menganalisis penggunaan resource di Linux menggunakan tools bawaan yang tersedia di hampir semua distribusi. Setiap metode dilengkapi dengan contoh perintah, penjelasan keluaran, serta cara menginterpretasikannya agar tidak salah mengambil kesimpulan.

## Mengapa Monitoring Resource Itu Penting

Monitoring resource bukan sekadar melihat angka persentase. Tujuannya adalah memahami perilaku sistem dari waktu ke waktu, menemukan bottleneck, dan mengambil keputusan yang tepat, misalnya apakah perlu optimasi aplikasi, penambahan RAM, pembersihan disk, atau scaling horizontal.

Tanpa kebiasaan memantau resource, troubleshooting menjadi tebakan. Contohnya, ketika aplikasi lambat, banyak orang langsung berasumsi perlu upgrade CPU, padahal setelah diperiksa ternyata disk sudah penuh sehingga database tidak bisa menulis temporary file. Atau sebaliknya, RAM terlihat penuh padahal sebagian besar dipakai oleh page cache yang sebenarnya masih bisa dikembalikan ke aplikasi saat dibutuhkan.

Dengan memahami tools dasar seperti `top`, `free`, `df`, `du`, `ps`, `uptime`, dan `vmstat`, proses diagnosis menjadi jauh lebih terarah. Tools ini ringan, tidak memerlukan instalasi tambahan, dan bisa dijalankan melalui SSH bahkan pada server dengan spesifikasi minimal.

## 1. Mengecek CPU dengan top dan htop

Cara paling cepat untuk melihat kondisi CPU adalah perintah `top`. Perintah ini menampilkan daftar process secara real-time beserta penggunaan CPU dan memori masing-masing.

```bash
top
```

Contoh perintah di atas akan membuka tampilan interaktif yang diperbarui setiap beberapa detik. Pada bagian atas layar terdapat ringkasan load average, jumlah task, penggunaan CPU, dan penggunaan memori. Pada bagian bawah terdapat daftar process yang diurutkan berdasarkan penggunaan CPU secara default.

Hasilnya kurang lebih seperti ini pada bagian header:

```text
top - 14:02:11 up 12 days,  3:14,  1 user,  load average: 0.45, 0.62, 0.71
Tasks: 128 total,   1 running, 127 sleeping,   0 stopped,   0 zombie
%Cpu(s): 12.5 us,  3.1 sy,  0.0 ni, 82.4 id,  1.2 wa,  0.0 hi,  0.8 si,  0.0 st
MiB Mem :   3932.4 total,    512.8 free,   1845.2 used,   1574.4 buff/cache
```

Penjelasan kolom CPU yang perlu dipahami:

- `us` (user space) adalah waktu CPU yang dipakai oleh aplikasi user, misalnya web server, database, atau aplikasi Node.js.
- `sy` (system space) adalah waktu CPU yang dipakai oleh kernel, misalnya untuk system call, network stack, atau operasi I/O.
- `id` (idle) adalah persentase CPU yang menganggur. Jika nilainya konsisten rendah, misalnya di bawah 10 persen, berarti CPU hampir jenuh.
- `wa` (iowait) adalah waktu CPU menunggu operasi disk selesai. Nilai `wa` yang tinggi, misalnya di atas 20 persen dalam waktu lama, biasanya menandakan bottleneck pada disk, bukan pada CPU itu sendiri.

Di dalam `top`, beberapa tombol keyboard yang berguna adalah `P` untuk mengurutkan berdasarkan CPU, `M` untuk mengurutkan berdasarkan memori, `k` untuk menghentikan process berdasarkan PID, dan `q` untuk keluar.

Untuk tampilan yang lebih mudah dibaca, tersedia `htop` yang mendukung navigasi dengan tombol panah, tampilan bar CPU per core, serta fitur filter dan pencarian process.

```bash
htop
```

Perintah tersebut menampilkan visualisasi penggunaan tiap core CPU di bagian atas, sehingga mudah melihat apakah beban tersebar merata atau hanya menumpuk pada satu core. Hal ini penting untuk aplikasi single-threaded yang tidak bisa memanfaatkan banyak core secara efektif. Jika belum tersedia, `htop` biasanya dapat dipasang melalui package manager distribusi yang digunakan.

## 2. Mengecek RAM dengan free

Langkah berikutnya adalah memeriksa memori dengan perintah `free`. Perintah ini menunjukkan total RAM, jumlah yang terpakai, yang bebas, serta porsi yang dipakai untuk buffer dan cache.

```bash
free -h
```

Opsi `-h` membuat keluaran tampil dalam format yang mudah dibaca manusia, misalnya gigabyte dan megabyte, bukan byte mentah. Contoh keluaran berikut ini bisa menjadi gambaran umum:

```text
               total        used        free      shared  buff/cache   available
Mem:           3.8Gi       1.7Gi       512Mi       120Mi       1.5Gi       1.7Gi
Swap:          2.0Gi       128Mi       1.9Gi
```

Penjelasan setiap kolom:

- `total` adalah kapasitas RAM fisik yang terdeteksi sistem.
- `used` adalah RAM yang dipakai oleh aplikasi dan sistem.
- `free` adalah RAM yang benar-benar kosong dan belum dipakai sama sekali.
- `buff/cache` adalah RAM yang dipakai kernel untuk cache file dan buffer I/O. Cache ini bersifat sementara dan akan dilepas otomatis jika aplikasi membutuhkan memori.
- `available` adalah perkiraan jumlah memori yang masih bisa dipakai oleh aplikasi baru tanpa memicu swapping. Kolom inilah yang paling relevan untuk menilai apakah RAM masih cukup.
- Baris `Swap` menunjukkan penggunaan swap space di disk. Penggunaan swap yang besar dan terus bertambah menandakan sistem kekurangan RAM fisik.

Kesalahan umum adalah panik ketika kolom `used` terlihat tinggi, padahal kolom `available` masih besar. Pada Linux, RAM yang tidak terpakai akan dimanfaatkan kernel sebagai file cache untuk mempercepat akses disk. Ini adalah perilaku normal dan justru diinginkan. Yang perlu diwaspadai adalah ketika nilai `available` mendekati nol dan penggunaan swap terus naik, karena pada titik itu sistem mulai memindahkan halaman memori ke disk dan performa akan turun drastis.

Untuk melihat process mana yang paling banyak memakai memori, perintah `top` yang diurutkan dengan tombol `M` atau perintah `ps` yang dibahas di bawah bisa membantu.

## 3. Mengecek Disk dengan df dan du

Disk yang penuh adalah penyebab kegagalan yang sering diremehkan. Dampaknya bisa bermacam-macam, mulai dari aplikasi gagal menulis log, database gagal membuat temporary table, hingga deployment gagal karena tidak bisa mengekstrak arsip.

Perintah `df` menampilkan penggunaan disk per filesystem yang sedang di-mount.

```bash
df -hT
```

Opsi `-h` menampilkan ukuran dalam format gigabyte dan megabyte, sedangkan opsi `-T` menampilkan tipe filesystem seperti `ext4` atau `xfs`. Contoh keluarannya kurang lebih seperti ini:

```text
Filesystem     Type      Size  Used Avail Use% Mounted on
/dev/vda1      ext4       40G   28G   10G  74% /
tmpfs          tmpfs     1.9G     0  1.9G   0% /dev/shm
```

Penjelasan kolomnya cukup langsung. Kolom `Use%` menunjukkan persentase pemakaian, sedangkan `Mounted on` menunjukkan titik mount. Partisi root `/` adalah yang paling kritis karena dipakai oleh sistem, log, dan biasanya juga aplikasi. Praktik yang baik adalah menjaga penggunaan di bawah 80 persen agar masih ada ruang untuk lonjakan log atau temporary file.

Jika sebuah partisi hampir penuh, langkah berikutnya adalah mencari direktori mana yang paling banyak memakai ruang dengan perintah `du`.

```bash
du -sh /var/* | sort -rh | head -n 10
```

Penjelasan perintah di atas:

- `du -sh` menghitung total ukuran setiap direktori di dalam `/var` dan menampilkannya dalam format ringkas.
- Tanda `|` meneruskan keluaran ke perintah berikutnya.
- `sort -rh` mengurutkan berdasarkan ukuran dari terbesar ke terkecil.
- `head -n 10` hanya menampilkan sepuluh baris teratas.

Pola ini sangat membantu mempersempit pencarian. Misalnya, jika `/var/log` berukuran belasan gigabyte, kemungkinan ada log yang tidak dirotasi. Jika `/var/lib/docker` membengkak, kemungkinan ada image atau volume Docker yang tidak terpakai. Setelah kandidat ditemukan, perintah yang sama bisa dijalankan satu level lebih dalam hingga file atau direktori penyebabnya ketemu.

Selain kapasitas, perlu juga memeriksa inode dengan perintah berikut.

```bash
df -i
```

Filesystem bisa kehabisan inode meskipun kapasitas masih tersisa, terutama jika ada jutaan file kecil seperti cache session atau file antrian email. Gejalanya mirip disk penuh, yaitu aplikasi gagal membuat file baru. Keluaran `df -i` menunjukkan persentase inode yang terpakai, dan jika kolom `IUse%` mendekati 100 persen, pembersihan file-file kecil menjadi prioritas.

## 4. Menganalisis Process dengan ps

Perintah `ps` menampilkan snapshot process yang sedang berjalan. Berbeda dengan `top` yang interaktif, `ps` cocok untuk pemeriksaan satu kali, untuk scripting, atau untuk disaring dengan `grep`.

```bash
ps aux --sort=-%cpu | head -n 15
```

Penjelasan perintah tersebut:

- `ps aux` menampilkan semua process dari semua user dengan format detail.
- `--sort=-%cpu` mengurutkan berdasarkan penggunaan CPU dari terbesar ke terkecil.
- `head -n 15` membatasi keluaran pada lima belas baris pertama agar mudah dibaca.

Contoh baris keluarannya kurang lebih seperti ini:

```text
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
www-data  1842 45.2 12.4 1253400 486320 ?      Sl   13:40  12:04 /usr/bin/php-fpm: pool www
mysql     1021 12.1 28.5 2148200 1102400 ?     Sl   May12   8:21 /usr/sbin/mysqld
```

Kolom yang penting diperhatikan adalah `%CPU` untuk beban CPU, `%MEM` untuk porsi RAM, `STAT` untuk status process, dan `COMMAND` untuk perintah yang dijalankan. Status `R` berarti running, `S` berarti sleeping, `D` berarti menunggu I/O disk, dan `Z` berarti zombie. Process zombie dalam jumlah banyak bisa menandakan parent process yang tidak menangani child process dengan benar.

Untuk mencari process tertentu, pola berikut sering dipakai.

```bash
ps aux | grep -E "nginx|php-fpm|mysql" | grep -v grep
```

Perintah di atas menyaring daftar process hanya untuk service yang relevan. Opsi `-E` mengaktifkan pola pencarian ganda, sedangkan `grep -v grep` membuang baris perintah pencarian itu sendiri dari hasil. Cara ini berguna untuk memastikan service berjalan dengan user yang benar, jumlah worker sesuai konfigurasi, dan tidak ada process duplikat yang tidak diinginkan.

## 5. Membaca Load Average dengan uptime dan vmstat

Load average menunjukkan rata-rata jumlah process yang sedang menunggu giliran CPU atau menunggu I/O dalam periode satu, lima, dan lima belas menit terakhir. Perintah paling sederhana untuk melihatnya adalah `uptime`.

```bash
uptime
```

Contoh keluarannya kurang lebih seperti ini:

```text
 14:20:11 up 12 days,  3:31,  1 user,  load average: 2.10, 1.85, 1.20
```

Tiga angka di belakang tulisan `load average` adalah rata-rata satu menit, lima menit, dan lima belas menit. Untuk menginterpretasikannya, bandingkan dengan jumlah core CPU. Pada server dengan empat core, load average sekitar 4.0 berarti sistem dimanfaatkan penuh, sedangkan nilai jauh di atas itu, misalnya 8.0 atau 12.0, berarti ada antrian process yang menunggu. Tren juga penting. Jika angka satu menit jauh lebih tinggi daripada lima belas menit, berarti beban baru saja naik dan perlu dipantau. Sebaliknya, jika angka lima belas menit tinggi tetapi angka satu menit sudah turun, berarti lonjakan beban sudah mereda.

Untuk gambaran yang lebih lengkap, gunakan `vmstat` yang menampilkan statistik CPU, memori, swap, dan I/O dalam satu tampilan.

```bash
vmstat 2 5
```

Perintah tersebut mengambil lima sampel dengan jeda dua detik. Penjelasan kolom utamanya:

- Kolom `r` menunjukkan jumlah process yang menunggu CPU. Nilai yang konsisten lebih besar daripada jumlah core menandakan CPU jenuh.
- Kolom `b` menunjukkan process yang terblokir menunggu I/O.
- Kolom `si` dan `so` menunjukkan aktivitas swap in dan swap out. Nilai yang terus lebih dari nol menandakan tekanan memori.
- Kolom `bi` dan `bo` menunjukkan blok yang dibaca dan ditulis ke disk per detik.
- Kolom `us`, `sy`, `id`, dan `wa` memiliki arti yang sama seperti pada `top`.

Kombinasi `vmstat` dan `uptime` membantu membedakan apakah load tinggi disebabkan oleh CPU, kekurangan RAM yang memicu swap, atau disk yang lambat.

## Contoh Skenario Troubleshooting

Bayangkan sebuah VPS dengan empat core CPU dan RAM 4 GB yang menjalankan web server dan database. Pada sore hari, monitoring memberi peringatan bahwa response time naik. Langkah diagnosis yang sistematis bisa berjalan seperti berikut.

Pertama, jalankan `uptime` dan terlihat load average `6.80, 5.10, 2.40`. Angka satu menit jauh lebih tinggi daripada lima belas menit, artinya beban baru saja melonjak. Jumlahnya juga melebihi jumlah core, sehingga memang ada antrian.

Kedua, jalankan `top` dan terlihat satu process PHP-FPM memakai 180 persen CPU, yang berarti memakai hampir dua core penuh, sedangkan kolom `wa` rendah. Ini mengarah ke masalah CPU pada level aplikasi, bukan disk.

Ketiga, jalankan `free -h` dan terlihat kolom `available` masih 1.2 GB dengan swap hampir tidak terpakai. Artinya RAM masih aman dan tidak perlu mencurigai swapping.

Keempat, jalankan `ps aux --sort=-%cpu` untuk melihat detail process PHP-FPM mana yang berat, lalu korelasikan dengan access log web server untuk melihat endpoint apa yang sedang diakses berulang kali. Hasilnya kurang lebih menunjukkan satu endpoint laporan yang menjalankan query berat tanpa cache.

Dari alur tersebut, tindak lanjutnya menjadi jelas. Solusi jangka pendek bisa berupa pembatasan rate pada endpoint tersebut atau restart worker yang macet, sedangkan solusi jangka panjang adalah optimasi query dan penambahan cache. Tanpa data dari tools di atas, diagnosis semacam ini hanya berdasarkan dugaan.

## Checklist Praktis

Berikut checklist yang bisa dipakai sebagai rutinitas harian maupun saat insiden.

- Jalankan `uptime` dan bandingkan load average satu, lima, dan lima belas menit dengan jumlah core CPU.
- Jalankan `top` atau `htop`, periksa kolom `us`, `sy`, `id`, dan `wa` untuk membedakan beban aplikasi, kernel, dan iowait.
- Jalankan `free -h` dan fokus pada kolom `available`, bukan sekadar `free`, serta periksa penggunaan swap.
- Jalankan `df -hT` untuk memastikan tidak ada filesystem di atas 80 persen, lalu lanjutkan dengan `df -i` untuk memeriksa inode.
- Gunakan `du -sh` yang dikombinasikan dengan `sort -rh` untuk menemukan direktori terbesar saat disk menipis.
- Jalankan `ps aux --sort=-%cpu` dan `--sort=-%mem` untuk menemukan process terberat dari sisi CPU dan memori.
- Jalankan `vmstat 2 5` untuk melihat tren CPU, swap, dan I/O selama beberapa detik.
- Catat angka sebelum dan sesudah tindakan perbaikan agar evaluasi efektif atau tidaknya tindakan bersifat objektif.

Untuk rutinitas harian, cukup memeriksa `uptime`, `free -h`, dan `df -h`. Pemeriksaan yang lebih dalam dengan `top`, `ps`, dan `vmstat` dilakukan ketika ada anomali atau laporan performa menurun.

## Kesimpulan

Lima cara di atas saling melengkapi. Perintah `top` dan `htop` memberikan gambaran real-time tentang CPU dan process, `free` menjelaskan kondisi memori secara akurat, `df` dan `du` menangani persoalan disk dan inode, `ps` memberikan snapshot process yang mudah disaring, sedangkan `uptime` dan `vmstat` membantu membaca load average dan tren sistem secara keseluruhan.

Kunci analisis resource bukan pada hafalan perintah, melainkan pada kemampuan menginterpretasikan angka. Pahami perbedaan antara cache dan memori yang benar-benar habis, bedakan CPU jenuh dengan iowait tinggi, dan selalu bandingkan load average dengan jumlah core. Dengan kebiasaan memeriksa secara rutin dan mengikuti alur diagnosis yang sistematis, sebagian besar masalah performa server bisa ditemukan lebih cepat sebelum berkembang menjadi downtime.

