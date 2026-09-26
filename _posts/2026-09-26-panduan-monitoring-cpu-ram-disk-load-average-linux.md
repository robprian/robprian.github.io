---
layout: post
title: "Panduan Monitoring CPU, RAM, Disk, dan Load Average di Linux"
date: 2026-09-26 15:02:18 +0000
description: "Memahami cara membaca penggunaan CPU, RAM, disk, dan load average pada server Linux untuk membantu troubleshooting dan capacity planning."
image: "https://docs.ghazi.biz.id/cdn/9da4c92a8173384f/stream"
categories: []
tags: []
---



![Panduan Monitoring CPU, RAM, Disk, dan Load Average di Linux.png](https://docs.ghazi.biz.id/cdn/9da4c92a8173384f/stream)
# Panduan Monitoring CPU, RAM, Disk, dan Load Average di Linux

Monitoring server sering disederhanakan menjadi melihat satu angka persentase di dashboard. Padahal, angka tunggal seperti CPU 70 persen atau RAM 80 persen tidak banyak bercerita tanpa konteks. Apakah 70 persen itu normal pada jam sibuk atau tanda awal kejenuhan. Apakah RAM 80 persen berarti hampir habis atau justru sehat karena dimanfaatkan untuk cache. Apakah disk 90 persen masih aman untuk beberapa minggu atau harus segera ditangani hari ini juga.

Artikel ini membahas cara membaca empat metrik utama di Linux, yaitu CPU utilization, memori dan swap, disk utilization dan disk I/O, serta load average. Pembahasan mencakup konsep dasar, cara membaca keluaran tools bawaan, kesalahan interpretasi yang sering terjadi, contoh troubleshooting, serta checklist monitoring yang bisa diterapkan pada server production.

## CPU Utilization: Membaca Beban Prosesor dengan Benar

CPU utilization menunjukkan seberapa sibuk prosesor dalam periode tertentu. Di Linux, informasi ini bisa dilihat melalui `top`, `htop`, `vmstat`, atau file `/proc/stat`. Tampilan yang paling mudah dipahami pemula adalah baris `%Cpu(s)` pada `top`.

```bash
top -bn1 | head -n 5
```

Penjelasan perintah di atas:

- `top` menampilkan informasi process dan resource secara real-time.
- Opsi `-b` menjalankan `top` dalam mode batch sehingga cocok untuk output satu kali atau untuk scripting.
- Opsi `-n1` berarti hanya mengambil satu snapshot, tidak diperbarui terus-menerus.
- Tanda `|` meneruskan keluaran ke perintah berikutnya.
- `head -n 5` hanya menampilkan lima baris pertama, yaitu bagian ringkasan sistem.

Contoh potongan keluarannya kurang lebih seperti ini:

```text
%Cpu(s): 22.4 us,  5.2 sy,  0.0 ni, 68.1 id,  3.0 wa,  0.0 hi,  1.3 si,  0.0 st
```

Setiap singkatan memiliki arti yang berbeda dan penting untuk troubleshooting:

- `us` adalah waktu yang dipakai aplikasi di user space, misalnya Nginx, PHP-FPM, Java, Python, atau database.
- `sy` adalah waktu yang dipakai kernel di system space, misalnya untuk network stack, system call, dan manajemen process.
- `ni` adalah waktu untuk process dengan nilai nice yang diubah prioritasnya.
- `id` adalah waktu idle ketika CPU tidak mengerjakan apa pun.
- `wa` adalah iowait, yaitu waktu CPU menunggu operasi I/O disk selesai.
- `hi` dan `si` berkaitan dengan hardware interrupt dan software interrupt, biasanya signifikan pada server dengan traffic jaringan sangat tinggi.
- `st` (steal time) hanya relevan pada virtual machine dan menunjukkan waktu CPU yang diambil oleh hypervisor untuk VM lain.

Untuk melihat penggunaan per core, perintah berikut bisa membantu.

```bash
mpstat -P ALL 1 3
```

Penjelasan perintah tersebut:

- `mpstat` adalah bagian dari paket `sysstat` yang menampilkan statistik tiap prosesor.
- Opsi `-P ALL` berarti tampilkan semua core, bukan hanya rata-rata.
- Angka `1` berarti interval satu detik antar sampel.
- Angka `3` berarti ambil tiga sampel.

Hasilnya memudahkan identifikasi apakah beban tersebar merata ke semua core atau menumpuk pada satu core saja. Aplikasi single-threaded yang berat, misalnya satu worker yang macet dalam loop, akan terlihat memenuhi satu core hingga 100 persen sementara core lain menganggur. Dalam kasus seperti itu, menambah jumlah core tidak akan membantu tanpa memperbaiki aplikasi.

Hal lain yang perlu diperhatikan adalah perbedaan antara penggunaan CPU sesaat dan tren. Lonjakan CPU hingga 100 persen selama beberapa detik saat deployment atau saat cron berjalan adalah hal wajar. Yang bermasalah adalah CPU yang bertahan di atas 80 hingga 90 persen selama belasan menit tanpa penjelasan yang jelas. Untuk itu, data historis dari tools monitoring seperti Prometheus, Zabbix, atau Netdata tetap dibutuhkan sebagai pelengkap tools bawaan.

## Memory dan Swap: Memahami RAM yang Terlihat Penuh

Memori adalah area yang paling sering disalahpahami. Banyak administrator pemula panik ketika melihat RAM terpakai 90 persen, padahal sistem masih sehat. Penyebab kesalahpahaman ini adalah cara Linux memanfaatkan RAM kosong sebagai file cache.

Perintah utama untuk memeriksa memori adalah `free`.

```bash
free -h
```

Opsi `-h` menampilkan angka dalam satuan yang mudah dibaca seperti megabyte dan gigabyte. Contoh keluaran berikut ini bisa dijadikan acuan:

```text
               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       3.2Gi       800Mi       200Mi       3.8Gi       4.0Gi
Swap:          2.0Gi         0Bi       2.0Gi
```

Cara membaca yang benar adalah fokus pada kolom `available`, bukan pada kolom `free` atau `used` saja. Kolom `available` adalah estimasi memori yang masih bisa diberikan kepada aplikasi baru tanpa memicu swapping. Pada contoh di atas, meskipun kolom `used` menunjukkan 3.2 GB dan `free` hanya 800 MB, sistem sebenarnya masih memiliki sekitar 4.0 GB yang tersedia karena sebagian besar `buff/cache` bisa dikembalikan jika dibutuhkan.

Penjelasan tiap kolom secara ringkas:

- `total` adalah total RAM fisik.
- `used` adalah RAM yang dipakai aplikasi dan sistem, termasuk sebagian cache yang masih terhitung.
- `free` adalah RAM yang sepenuhnya kosong.
- `shared` umumnya berkaitan dengan tmpfs dan shared memory antar process.
- `buff/cache` adalah memori yang dipakai kernel untuk buffer dan page cache agar akses file lebih cepat.
- `available` adalah angka paling realistis untuk menjawab pertanyaan apakah RAM masih cukup.
- Baris `Swap` menunjukkan memori virtual di disk yang dipakai saat RAM fisik tidak mencukupi.

Untuk melihat detail penggunaan swap dan memori dari sisi kernel, perintah berikut berguna.

```bash
vmstat 2 5
```

Perintah tersebut mengambil lima sampel dengan jeda dua detik. Kolom `si` (swap in) dan `so` (swap out) menunjukkan berapa banyak memori yang dipindahkan antara RAM dan swap per detik. Jika kedua kolom konsisten bernilai nol, berarti tidak ada tekanan memori yang berarti. Jika nilainya terus lebih dari nol dalam waktu lama, berarti sistem aktif melakukan swapping dan performa akan menurun karena akses disk jauh lebih lambat daripada RAM.

Untuk menemukan process yang paling boros memori, gunakan perintah berikut.

```bash
ps aux --sort=-%mem | head -n 15
```

Penjelasan perintah:

- `ps aux` menampilkan semua process dengan format detail.
- `--sort=-%mem` mengurutkan dari penggunaan memori terbesar.
- `head -n 15` membatasi tampilan agar mudah dibaca.

Perhatikan kolom `%MEM`, `RSS` (resident set size, yaitu memori fisik yang benar-benar dipakai), dan `VSZ` (virtual memory size, termasuk memori virtual yang belum tentu terisi). Untuk diagnosis kebocoran memori, yang paling relevan adalah tren `RSS` dari waktu ke waktu. Jika `RSS` sebuah service naik terus tanpa pernah turun meskipun traffic stabil, ada kemungkinan terjadi memory leak di aplikasi.

## Disk Utilization dan Disk I/O

Monitoring disk memiliki dua sisi yang sama pentingnya, yaitu kapasitas dan kecepatan. Kapasitas menjawab pertanyaan apakah ruang masih cukup, sedangkan disk I/O menjawab apakah disk mampu melayani baca tulis dengan cepat.

### Mengecek Kapasitas Disk

Perintah dasar untuk kapasitas adalah `df`.

```bash
df -hT
```

Opsi `-h` menampilkan ukuran dalam format manusiawi, sedangkan `-T` menampilkan tipe filesystem. Contoh keluarannya kurang lebih seperti ini:

```text
Filesystem     Type      Size  Used Avail Use% Mounted on
/dev/vda1      ext4       60G   38G   19G  67% /
```

Jika sebuah filesystem mendekati penuh, gunakan `du` untuk menelusuri direktori terbesar.

```bash
du -sh /var/log/* 2>/dev/null | sort -rh | head -n 10
```

Penjelasan perintah:

- `du -sh` menghitung ukuran tiap subdirektori di `/var/log`.
- `2>/dev/null` membuang pesan error permission denied agar keluaran bersih.
- `sort -rh` mengurutkan dari ukuran terbesar.
- `head -n 10` menampilkan sepuluh terbesar.

Jangan lupa memeriksa inode, karena filesystem bisa kehabisan inode meskipun kapasitas masih tersedia.

```bash
df -i
```

Kondisi kehabisan inode biasanya disebabkan oleh jutaan file kecil, misalnya file session, cache, atau antrian email yang tidak dibersihkan. Gejalanya mirip disk penuh, yaitu aplikasi gagal membuat file baru meskipun `df -h` masih menunjukkan ruang tersedia.

### Mengecek Disk I/O

Kapasitas yang lega tidak menjamin disk sehat. Disk yang lambat bisa membuat aplikasi dan database tersendat meskipun ruang masih banyak. Untuk melihat performa I/O, tool yang umum dipakai adalah `iostat`.

```bash
iostat -xz 2 5
```

Penjelasan opsi:

- `-x` menampilkan statistik extended seperti utilization dan waktu tunggu.
- `-z` menyembunyikan device yang tidak aktif agar keluaran ringkas.
- Angka `2` adalah interval antar sampel dalam detik.
- Angka `5` adalah jumlah sampel yang diambil.

Dua kolom yang paling penting adalah `%util` dan `await`. Kolom `%util` menunjukkan persentase waktu device sibuk melayani request. Jika nilainya konsisten mendekati 100 persen, berarti disk jenuh. Kolom `await` menunjukkan rata-rata waktu tunggu request dalam milidetik. Pada SSD, nilai belasan milidetik yang bertahan lama sudah patut dicurigai, sedangkan pada HDD mekanis, ambang kewajarannya lebih tinggi tetapi tetap perlu dibandingkan dengan baseline normal server tersebut.

Konsep yang perlu dipahami adalah perbedaan antara throughput dan latency. Throughput tinggi saat backup berjalan adalah hal wajar, tetapi latency tinggi saat traffic normal menandakan masalah. Selain itu, nilai `wa` (iowait) pada `top` atau `vmstat` yang tinggi adalah petunjuk awal bahwa CPU banyak menganggur karena menunggu disk, sehingga optimasi perlu diarahkan ke I/O, bukan ke CPU.

## Load Average: Menafsirkan Antrian Sistem

Load average sering ditampilkan di dashboard, tetapi tidak semua orang memahami artinya. Secara sederhana, load average adalah rata-rata jumlah process yang sedang berjalan atau menunggu giliran dalam satu, lima, dan lima belas menit terakhir.

```bash
uptime
```

Contoh keluaran:

```text
 15:10:22 up 8 days,  2:11,  2 users,  load average: 3.20, 2.75, 1.90
```

Tiga angka tersebut dibaca berurutan sebagai rata-rata satu menit, lima menit, dan lima belas menit. Cara menafsirkannya adalah membandingkan dengan jumlah core CPU yang bisa dilihat melalui perintah berikut.

```bash
nproc
```

Perintah `nproc` menampilkan jumlah processing unit yang tersedia. Jika server memiliki empat core, maka load average sekitar 4.0 berarti utilisasi penuh. Nilai 2.0 berarti masih ada ruang longgar, sedangkan nilai 8.0 berarti rata-rata ada process yang harus mengantre.

Tren antar tiga angka juga penting:

- Jika angka satu menit jauh lebih tinggi daripada lima belas menit, berarti beban baru saja naik dan perlu dipantau lanjutannya.
- Jika angka lima belas menit tinggi tetapi angka satu menit sudah turun, berarti lonjakan sudah mereda.
- Jika ketiga angka naik bersamaan dan bertahan lama, berarti ada beban berkelanjutan yang perlu diinvestigasi.

Satu hal yang sering dilupakan adalah load average mencakup process yang menunggu I/O, bukan hanya menunggu CPU. Artinya, load tinggi tidak selalu berarti CPU kurang. Disk yang lambat atau NFS yang macet juga bisa mendorong load average naik tajam sementara CPU terlihat menganggur. Karena itu, load average harus selalu dibaca bersamaan dengan data CPU, memori, dan disk I/O.

## Kesalahan Umum dalam Membaca Metrik

Ada beberapa kesalahan interpretasi yang berulang kali ditemui di lapangan dan layak dibahas secara khusus.

Kesalahan pertama adalah menganggap cache sebagai memori bocor. Linux sengaja memakai RAM kosong untuk page cache agar akses file lebih cepat. Selama kolom `available` masih besar dan swap tidak aktif, kondisi tersebut sehat. Tindakan seperti membersihkan cache secara manual dengan `drop_caches` umumnya tidak diperlukan dan justru bisa menurunkan performa sementara.

Kesalahan kedua adalah menganggap CPU 100 persen selalu buruk. Pada server build, transcode video, atau batch processing, CPU 100 persen justru berarti resource dimanfaatkan maksimal. Yang perlu dinilai adalah konteksnya. Apakah 100 persen itu terjadi pada jam yang diharapkan dan oleh process yang seharusnya berat. Jika web server tiba-tiba memakai 100 persen CPU pada jam sepi tanpa deployment, barulah itu anomali.

Kesalahan ketiga adalah hanya melihat satu metrik. Contoh klasik adalah melihat load average tinggi lalu langsung menyimpulkan CPU kurang, padahal setelah dicek ternyata `wa` tinggi dan `%util` disk penuh. Keputusan upgrade CPU dalam kasus tersebut tidak akan menyelesaikan masalah karena bottleneck sebenarnya ada di disk.

Kesalahan keempat adalah mengabaikan swap. Banyak dashboard hanya menampilkan RAM dan melewatkan swap. Padahal, aktivitas swap yang konsisten adalah sinyal tekanan memori yang kuat. Server bisa terlihat memiliki RAM bebas kecil tetapi masih sehat, atau sebaliknya terlihat longgar padahal sudah melakukan swapping akibat konfigurasi swappiness yang agresif.

Kesalahan kelima adalah membandingkan angka antar server tanpa baseline. Server database dengan RAM 64 GB tentu memiliki pola cache yang berbeda dengan VPS kecil 2 GB. Setiap server perlu baseline normalnya sendiri, misalnya berapa load average pada jam sibuk, berapa `%util` disk saat backup, dan berapa `available` memori pada kondisi stabil.

## Contoh Troubleshooting Terpadu

Untuk merangkai semua konsep di atas, perhatikan skenario berikut. Sebuah server aplikasi dengan empat core dan RAM 8 GB dilaporkan lambat setiap pagi sekitar pukul delapan. Pemeriksaan dilakukan saat insiden berlangsung.

Langkah pertama adalah menjalankan `uptime` dan `nproc`. Hasilnya menunjukkan load average `7.50, 4.20, 2.10` pada server empat core. Beban satu menit jauh melebihi kapasitas dan trennya menanjak, sehingga insiden memang sedang terjadi, bukan sisa lonjakan kemarin.

Langkah kedua adalah menjalankan `top`. Kolom CPU menunjukkan `us` 25 persen, `sy` 10 persen, `wa` 45 persen, dan `id` 15 persen. Nilai `wa` yang dominan mengarahkan kecurigaan ke disk, bukan ke aplikasi yang boros CPU.

Langkah ketiga adalah menjalankan `free -h`. Kolom `available` masih 3.5 GB dan swap tidak terpakai, sehingga hipotesis kekurangan RAM bisa disingkirkan.

Langkah keempat adalah menjalankan `iostat -xz 2 5`. Kolom `%util` pada device utama menunjukkan 98 hingga 100 persen dengan `await` puluhan milidetik. Setelah itu, perintah `ps aux` dan pengecekan cron menunjukkan ada job backup dan agregasi laporan yang berjalan bersamaan setiap pukul delapan pagi dan membaca tabel besar tanpa indeks yang tepat.

Dari rangkaian tersebut, kesimpulannya bukan CPU kurang atau RAM bocor, melainkan tabrakan jadwal I/O berat pada jam sibuk. Tindak lanjutnya bisa berupa menggeser jadwal backup ke dini hari, menambahkan indeks database, atau memindahkan direktori backup ke disk terpisah. Contoh ini menunjukkan mengapa keempat metrik harus dibaca bersamaan.

## Checklist Monitoring untuk Server Production

Checklist berikut bisa dijadikan rutinitas harian dan mingguan, maupun panduan saat insiden.

- Tentukan baseline tiap server, termasuk load average normal pada jam sibuk dan sepi, serta jumlah core dari `nproc`.
- Pantau CPU dengan memisahkan `us`, `sy`, `wa`, dan `id`, jangan hanya melihat satu angka total.
- Pantau kolom `available` pada `free -h` dan aktivitas `si` serta `so` pada `vmstat` untuk mendeteksi tekanan memori lebih awal.
- Pantau kapasitas dengan `df -hT` dan tetapkan ambang peringatan, misalnya 75 persen untuk peringatan dan 85 persen untuk tindakan.
- Pantau inode dengan `df -i`, terutama pada server yang banyak menghasilkan file kecil.
- Pantau disk I/O dengan `iostat -xz`, fokus pada `%util` dan `await`, serta korelasikan dengan `wa` pada `top`.
- Baca load average satu, lima, dan lima belas menit sebagai satu kesatuan tren, lalu bandingkan dengan jumlah core.
- Simpan data historis melalui sistem monitoring agar lonjakan sesaat bisa dibedakan dari tren jangka panjang.
- Dokumentasikan setiap insiden beserta angka sebelum dan sesudah perbaikan untuk memperkuat baseline.

Untuk pemeriksaan cepat harian, kombinasi `uptime`, `free -h`, dan `df -h` biasanya cukup. Pemeriksaan mendalam dengan `mpstat`, `vmstat`, dan `iostat` dilakukan ketika ada anomali atau sebelum capacity planning.

## Kesimpulan

Monitoring CPU, RAM, disk, dan load average adalah satu paket yang tidak bisa dipisahkan. CPU utilization menjelaskan siapa yang sibuk dan apakah hambatannya berasal dari aplikasi, kernel, atau tunggu I/O. Memori dan swap menjelaskan apakah sistem masih punya ruang bernapas atau sudah terpaksa memakai disk sebagai memori darurat. Disk utilization dan disk I/O menjelaskan apakah masalahnya terletak pada kapasitas atau kecepatan. Load average merangkum semuanya dalam bentuk antrian yang harus ditafsirkan dengan jumlah core dan tren waktu.

Dengan memahami konsep di balik setiap angka, menghindari kesalahan umum seperti salah membaca cache atau terpaku pada satu metrik, serta mengikuti checklist yang konsisten, proses troubleshooting menjadi lebih cepat dan keputusan capacity planning menjadi lebih tepat. Pada akhirnya, monitoring yang baik bukan tentang mengumpulkan grafik sebanyak mungkin, melainkan tentang membaca cerita yang disampaikan oleh angka-angka tersebut.

