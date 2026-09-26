---
layout: post
title: "Monitoring Server Linux dengan Prometheus dan Grafana"
date: 2026-09-26 13:29:18 +0000
description: "Panduan memahami arsitektur monitoring server menggunakan Prometheus dan Grafana serta bagaimana metrics dikumpulkan dan divisualisasikan."
categories: []
tags: []
---

# Monitoring Server Linux dengan Prometheus dan Grafana

Server yang berjalan tanpa monitoring ibarat kendaraan tanpa indikator bensin dan suhu mesin. Selama berjalan normal semuanya terlihat baik-baik saja, tetapi ketika disk penuh, memori bocor, atau CPU melonjak tiba-tiba, administrator baru menyadarinya setelah layanan sudah down dan pengguna komplain. Monitoring yang baik mengubah pola reaktif menjadi proaktif: masalah terdeteksi sejak gejala awal, lengkap dengan data historis untuk analisis.

Artikel ini membahas arsitektur monitoring server Linux menggunakan Prometheus dan Grafana, mulai dari konsep metrics, cara pengumpulan data melalui exporter, konfigurasi scraping, visualisasi dashboard, hingga konsep alerting dan troubleshooting umum.

## Arsitektur Monitoring Modern

Monitoring modern umumnya terdiri dari empat lapisan: pengumpulan data, penyimpanan time series, visualisasi, dan alerting. Prometheus berperan di dua lapisan pertama, sedangkan Grafana berperan di lapisan visualisasi dan notifikasi lanjutan.

Alur sederhananya adalah sebagai berikut. Di setiap server terpasang sebuah exporter kecil yang mengekspos metrics melalui HTTP. Server Prometheus pusat secara berkala mengambil (scrape) metrics tersebut dan menyimpannya sebagai time series. Grafana kemudian membaca data dari Prometheus dan menampilkannya dalam bentuk dashboard grafik. Ketika nilai melewati ambang batas, sistem alerting mengirim notifikasi ke email, Slack, atau PagerDuty.

Pola pull-based ini berbeda dengan pola push tradisional di mana agen aktif mengirim data ke server pusat. Dengan pola pull, server Prometheus memegang kendali penuh atas interval pengambilan, target yang dimonitor, dan penanganan ketika target sementara down. Konfigurasi terpusat di satu tempat sehingga penambahan server baru cukup dengan menambah entri target.

## Apa Itu Prometheus

Prometheus adalah sistem monitoring dan alerting open source yang awalnya dikembangkan di SoundCloud dan kini menjadi proyek graduated di Cloud Native Computing Foundation. Prometheus sangat populer di lingkungan Linux, container, dan Kubernetes karena model datanya yang fleksibel dan bahasa query yang powerful.

Karakteristik utama Prometheus:

- **Time series database:** setiap metrics disimpan bersama timestamp dan label, sehingga mudah melihat tren dari waktu ke waktu.
- **Pull model:** Prometheus mengambil data dari target melalui HTTP GET ke endpoint `/metrics`.
- **PromQL:** bahasa query khusus untuk mengolah, mengagregasi, dan menghitung metrics.
- **Service discovery:** target bisa didefinisikan statis atau ditemukan otomatis dari cloud provider, Kubernetes, atau Consul.
- **Alerting terintegrasi:** aturan alert didefinisikan dalam file konfigurasi dan dievaluasi secara berkala.

Prometheus cocok untuk metrics numerik yang berubah terhadap waktu seperti penggunaan CPU, memori, disk, trafik jaringan, dan durasi request. Untuk log teks yang panjang, tool seperti Loki atau Elasticsearch lebih tepat dan biasanya dipasang berdampingan.

## Exporter dan Node Exporter

Exporter adalah program kecil yang menerjemahkan kondisi sistem menjadi format metrics yang dimengerti Prometheus. Setiap jenis layanan memiliki exporter masing-masing: Node Exporter untuk metrics sistem operasi Linux, Blackbox Exporter untuk probing HTTP dan ICMP, MySQL Exporter untuk database, dan banyak lagi.

Node Exporter adalah exporter paling fundamental untuk monitoring server Linux. Setelah dijalankan, Node Exporter mengekspos ratusan metrics seperti beban CPU per core, memori tersedia, ruang disk per filesystem, trafik per interface, jumlah file descriptor, hingga suhu hardware jika tersedia.

Instalasi Node Exporter secara manual bisa dilakukan dengan mengunduh binary, tetapi pendekatan yang lebih rapi di production adalah menjalankannya sebagai service systemd agar otomatis aktif saat boot dan mudah dimonitor statusnya.

Contoh file service `/etc/systemd/system/node_exporter.service`:

```ini
[Unit]
Description=Node Exporter untuk Prometheus
After=network.target

[Service]
User=node_exporter
ExecStart=/usr/local/bin/node_exporter --collector.systemd --collector.processes
Restart=always

[Install]
WantedBy=multi-user.target
```

Penjelasan konfigurasi:

- Bagian `[Unit]` mendeskripsikan service dan ketergantungannya pada jaringan.
- `User=node_exporter` menjalankan proses dengan user non-root demi keamanan.
- `ExecStart` menentukan binary dan collector tambahan yang diaktifkan. Collector `systemd` mengekspos status service, sedangkan `processes` memberi gambaran agregat proses.
- `Restart=always` memastikan exporter otomatis hidup kembali jika crash.

Aktifkan dan jalankan service dengan perintah:

```bash
sudo systemctl daemon-reload
```

Perintah ini memuat ulang definisi systemd agar file service baru dikenali. Langkah ini wajib dijalankan setiap kali file di `/etc/systemd/system/` diubah.

```bash
sudo systemctl enable --now node_exporter
```

Opsi `enable` membuat service aktif otomatis saat boot, sedangkan `--now` langsung menjalankannya tanpa perintah `start` terpisah.

Verifikasi exporter sudah mengekspos metrics:

```bash
curl -s http://localhost:9100/metrics | head -n 20
```

Perintah ini mengambil endpoint metrics lokal dan menampilkan 20 baris pertama. Hasilnya kurang lebih berupa baris teks dengan format `nama_metric{label="nilai"} angka`, misalnya `node_cpu_seconds_total`. Jika endpoint menjawab, berarti exporter siap di-scrape oleh Prometheus.

Membatasi akses ke endpoint exporter melalui firewall hanya dari IP server Prometheus adalah praktik keamanan yang penting, karena metrics bisa membocorkan detail internal seperti hostname, versi kernel, dan daftar mount point.

## Konsep Metrics di Prometheus

Memahami tipe metrics membantu menulis query dan alert yang benar. Empat tipe utama adalah sebagai berikut.

**Counter** adalah nilai yang hanya naik, misalnya total request HTTP atau total byte jaringan yang terkirim. Counter bisa reset ke nol saat proses restart. Contoh metric: `node_network_receive_bytes_total`. Untuk mendapatkan laju per detik, gunakan fungsi `rate()`.

**Gauge** adalah nilai yang bisa naik dan turun, misalnya penggunaan memori saat ini, suhu CPU, atau jumlah koneksi aktif. Gauge dibaca langsung tanpa perlu fungsi laju. Contoh metric: `node_memory_MemAvailable_bytes`.

**Histogram** mengelompokkan observasi ke dalam bucket, misalnya durasi request dikelompokkan ke bucket 0.1 detik, 0.5 detik, dan 1 detik. Histogram memungkinkan perhitungan persentil seperti P95 tanpa menyimpan setiap sampel mentah.

**Summary** mirip histogram tetapi menghitung persentil langsung di sisi client. Summary lebih sederhana tetapi kurang fleksibel untuk agregasi lintas instance dibanding histogram.

Selain tipe, setiap metrics dilengkapi label berupa pasangan key-value, misalnya `instance="192.168.1.11:9100"` atau `mountpoint="/"`. Label memungkinkan satu nama metric dipakai banyak server dan difilter saat query. Namun jumlah kombinasi label yang meledak (cardinality tinggi) bisa membebani penyimpanan, sehingga label dengan nilai tidak terbatas seperti user ID atau alamat email sebaiknya dihindari.

## Konfigurasi Scraping Prometheus

Server Prometheus membaca file `prometheus.yml` untuk mengetahui target apa saja yang di-scrape, seberapa sering, dan aturan alert apa yang berlaku. Contoh konfigurasi minimal:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "linux-servers"
    static_configs:
      - targets:
          - "192.168.1.11:9100"
          - "192.168.1.12:9100"
        labels:
          environment: "production"
```

Penjelasan konfigurasi:

- `scrape_interval: 15s` berarti Prometheus mengambil metrics setiap 15 detik. Interval lebih pendek memberi resolusi lebih detail tetapi menambah beban penyimpanan dan jaringan.
- `evaluation_interval` menentukan seberapa sering aturan alert dievaluasi.
- `job_name` adalah nama logis untuk sekelompok target dengan fungsi sama.
- `static_configs` mendaftarkan alamat target secara manual. Untuk puluhan server pola ini masih oke, tetapi untuk ratusan server sebaiknya gunakan service discovery otomatis.
- Blok `labels` menambahkan label statis `environment="production"` ke semua sampel dari job tersebut, berguna untuk filtering di dashboard.

Menjalankan Prometheus dengan Docker untuk pengujian:

```bash
docker run -d --name prometheus -p 9090:9090 -v ./prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

Penjelasan perintah: opsi `-d` menjalankan container di background, `-p 9090:9090` memetakan port web UI, `-v` me-mount file konfigurasi lokal ke dalam container, dan image yang digunakan adalah image resmi Prometheus. Setelah container berjalan, web UI dapat diakses melalui port 9090.

Validasi konfigurasi sebelum reload agar kesalahan YAML tidak menghentikan server:

```bash
promtool check config prometheus.yml
```

Perintah `promtool` memeriksa sintaks dan referensi aturan. Hasilnya kurang lebih menampilkan status sukses atau baris error yang perlu diperbaiki.

Untuk memuat ulang konfigurasi tanpa restart, kirim sinyal HUP atau gunakan endpoint reload jika diaktifkan. Cara ini menghindari kekosongan data scraping selama restart penuh.

## Grafana dan Konsep Dashboard

Grafana adalah platform visualisasi yang membaca data dari berbagai sumber, termasuk Prometheus, dan menampilkannya sebagai dashboard interaktif. Grafana tidak menyimpan metrics sendiri; ia hanya me-query Prometheus lalu me-render hasilnya menjadi grafik, tabel, gauge, dan heatmap.

Alur menghubungkan Grafana ke Prometheus secara umum: tambahkan data source bertipe Prometheus dengan URL server Prometheus, uji koneksi melalui tombol save and test, lalu buat dashboard baru berisi satu atau lebih panel. Setiap panel memiliki query PromQL, tipe visualisasi, dan opsi tampilan seperti satuan, batas minimum dan maksimum, serta legenda.

Prinsip dashboard yang baik adalah berlapis dari umum ke detail. Baris pertama menampilkan kondisi global seperti jumlah host up, rata-rata CPU, dan total trafik. Baris berikutnya menampilkan per-server atau per-service. Panel detail seperti top process atau log error ditempatkan paling bawah dan hanya dibuka saat investigasi.

Hindari membuat satu dashboard raksasa berisi puluhan panel yang lambat dimuat. Lebih baik pecah menjadi beberapa dashboard tematik: overview infrastruktur, detail sistem operasi, detail aplikasi, dan kapasitas disk. Gunakan template variable agar satu dashboard bisa dipakai ulang untuk banyak server hanya dengan mengganti dropdown hostname.

## Dasar PromQL dengan Contoh Query

PromQL adalah bahasa query Prometheus. Berikut beberapa pola dasar yang paling sering dipakai untuk monitoring server Linux.

Melihat penggunaan CPU dalam 5 menit terakhir:

```promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

Penjelasan query: `node_cpu_seconds_total{mode="idle"}` mengambil waktu CPU idle, fungsi `rate(...[5m])` menghitung laju per detik selama jendela 5 menit, `avg by (instance)` merata-ratakan antar core per server, lalu hasilnya dikurangkan dari 100 untuk mendapatkan persentase sibuk. Hasilnya kurang lebih berupa satu garis per server yang naik saat beban bertambah.

Melihat memori tersedia dalam gigabyte:

```promql
node_memory_MemAvailable_bytes / 1024 / 1024 / 1024
```

Query ini membagi nilai byte menjadi gigabyte agar mudah dibaca manusia. Di Grafana, satuan juga bisa diatur melalui opsi unit sehingga angka tampil dengan suffix GB otomatis.

Melihat persentase penggunaan filesystem root:

```promql
100 * (1 - (node_filesystem_avail_bytes{mountpoint="/", fstype!~"tmpfs|overlayfs"} / node_filesystem_size_bytes{mountpoint="/", fstype!~"tmpfs|overlayfs"}))
```

Penjelasan: query membagi ruang tersedia dengan ukuran total untuk mendapatkan proporsi kosong, lalu dikurangkan dari satu untuk mendapatkan proporsi terpakai. Filter `fstype!~` mengecualikan filesystem virtual yang tidak relevan. Query semacam ini ideal untuk panel peringatan disk penuh.

Mendeteksi server yang down:

```promql
up == 0
```

Metric `up` dibuat otomatis oleh Prometheus untuk setiap target scrape. Nilai 1 berarti scrape berhasil, 0 berarti gagal. Query sederhana ini menjadi dasar alert ketersediaan.

Menghitung laju error HTTP jika aplikasi mengekspos metrics sendiri:

```promql
sum by (instance) (rate(http_requests_total{status=~"5.."}[5m]))
```

Filter `status=~"5.."` memakai regex untuk mencocokkan semua status 500-an. Kombinasi `sum by` dan `rate` menghasilkan laju error per server yang mudah dibandingkan antar deployment.

## Konsep Alerting

Visualisasi membantu manusia melihat masalah, tetapi alerting memastikan masalah tetap terpantau saat tidak ada yang melihat dashboard. Prometheus mengevaluasi aturan alert secara berkala, sedangkan Alertmanager mengelola deduplikasi, grouping, muting, dan pengiriman notifikasi.

Contoh file aturan `alerts.yml`:

```yaml
groups:
  - name: linux-basic
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Server {{ $labels.instance }} tidak merespons"
          description: "Target scrape gagal selama lebih dari 2 menit."

      - alert: DiskSpaceHampirPenuh
        expr: 100 * (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Disk root di {{ $labels.instance }} di atas 85 persen"
          description: "Penggunaan disk bertahan tinggi selama 10 menit, pertimbangkan pembersihan log."
```

Penjelasan setiap field:

- `alert` adalah nama unik alert.
- `expr` adalah query PromQL yang memicu alert ketika menghasilkan data.
- `for` menentukan berapa lama kondisi harus bertahan sebelum alert benar-benar firing, untuk menghindari notifikasi akibat lonjakan sesaat.
- `labels.severity` dipakai untuk routing, misalnya critical ke PagerDuty dan warning ke Slack.
- `annotations` berisi teks manusiawi yang tampil di notifikasi.

Aturan alert yang baik memiliki ambang realistis, durasi `for` yang cukup untuk menyaring noise, runbook tertaut di anotasi, dan severity yang konsisten. Alert yang terlalu sensitif menyebabkan kelelahan notifikasi sehingga alert penting justru diabaikan.

## Contoh Arsitektur Lengkap

Untuk lingkungan kecil hingga menengah dengan lima sampai dua puluh server, arsitektur sederhana biasanya sudah cukup: satu server monitoring menjalankan Prometheus, Grafana, dan Alertmanager, sedangkan setiap server aplikasi hanya menjalankan Node Exporter.

Topologinya kurang lebih seperti ini. Server aplikasi di subnet production mengekspos port 9100 hanya untuk IP server monitoring. Server monitoring mengambil metrics setiap 15 detik, menyimpan retensi 15 sampai 30 hari tergantung kapasitas disk, dan Grafana menampilkan dashboard overview. Alertmanager mengirim peringatan critical ke channel chat tim dan email on-call.

Untuk skala lebih besar, pertimbangkan federasi atau remote storage. Prometheus edge di tiap data center melakukan scraping lokal, lalu Prometheus pusat mengambil agregatnya. Data jangka panjang bisa dikirim ke Thanos, Cortex, atau Mimir agar retensi mencapai berbulan-bulan tanpa membebani satu server.

Aspek keamanan yang perlu diperhatikan: proteksi endpoint Prometheus dan Grafana dengan autentikasi, gunakan HTTPS atau VPN untuk scraping lintas jaringan publik, batasi firewall exporter, dan simpan backup konfigurasi `prometheus.yml` beserta aturan alert di version control.

## Troubleshooting Umum

**Target berstatus down di halaman Prometheus.** Penyebab paling umum adalah firewall memblokir port exporter, Node Exporter belum berjalan, atau alamat target salah. Uji manual dari server Prometheus dengan `curl http://IP_TARGET:9100/metrics`. Jika curl gagal, masalah ada di jaringan atau service exporter. Jika curl berhasil tetapi Prometheus tetap down, periksa kembali file konfigurasi dan label job.

**Metrics ada tetapi grafik kosong di Grafana.** Kemungkinan penyebabnya adalah rentang waktu dashboard terlalu sempit, query salah menulis nama label, atau data source menunjuk ke Prometheus yang keliru. Uji query yang sama langsung di web UI Prometheus pada tab Graph. Jika di Prometheus muncul data tetapi di Grafana kosong, fokuskan pemeriksaan ke konfigurasi data source dan template variable.

**Penggunaan disk Prometheus membengkak.** Setiap kombinasi label baru menambah time series. Periksa cardinality dengan query yang menampilkan jumlah series per metric, naikkan `scrape_interval` untuk job yang tidak kritis, atau gunakan `metric_relabel_configs` untuk membuang label yang tidak dibutuhkan sebelum disimpan.

**Alert terlalu sering berbunyi.** Evaluasi kembali ambang dan durasi `for`. Lonjakan CPU sesaat selama backup malam hari sebaiknya ditangani dengan menaikkan durasi atau menambahkan pengecualian jam maintenance, bukan dengan menonaktifkan alert sepenuhnya.

**Node Exporter tidak menampilkan metrics systemd.** Fitur ini membutuhkan hak akses membaca socket systemd. Pastikan user service memiliki permission yang cukup atau aktifkan collector yang memang didukung environment tersebut. Log service melalui `journalctl -u node_exporter` biasanya memberi petunjuk langsung.

## Kesimpulan

Kombinasi Prometheus dan Grafana memberikan fondasi monitoring server Linux yang kuat: Prometheus mengumpulkan dan menyimpan metrics secara andal dengan model pull, Node Exporter menyediakan visibilitas level sistem operasi, PromQL memungkinkan analisis fleksibel dari CPU hingga kapasitas disk, Grafana mengubah angka mentah menjadi dashboard yang mudah dipahami, dan alerting memastikan masalah penting tidak terlewat.

Kunci keberhasilan monitoring bukan pada banyaknya grafik, melainkan pada sedikit metrik penting yang dipantau konsisten: ketersediaan host, CPU, memori, disk, jaringan, dan status service kunci. Mulailah dari satu server Prometheus, satu exporter per host, dan beberapa alert dasar seperti instance down dan disk penuh. Setelah fondasi berjalan stabil, kembangkan secara bertahap ke exporter aplikasi, dashboard per layanan, dan integrasi notifikasi yang sesuai dengan alur kerja tim.

