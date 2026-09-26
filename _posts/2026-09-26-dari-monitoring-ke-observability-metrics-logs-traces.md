---
layout: post
title: "Dari Monitoring ke Observability: Memahami Metrics, Logs, dan Traces"
date: 2026-09-26 13:29:02 +0000
description: "Memahami perbedaan monitoring dan observability serta bagaimana metrics, logs, dan traces membantu engineer memahami kondisi sistem."
categories: []
tags: []
---

# Dari Monitoring ke Observability: Memahami Metrics, Logs, dan Traces

Dalam operasional sistem modern, istilah monitoring dan observability sering digunakan secara bergantian, padahal keduanya memiliki makna yang berbeda. Monitoring menjawab pertanyaan apakah sistem berjalan normal atau tidak, sedangkan observability membantu engineer memahami mengapa sistem berperilaku seperti itu. Perbedaan ini menjadi semakin penting ketika arsitektur bergeser dari satu server monolitik ke puluhan microservices, container, dan dependency eksternal.

Artikel ini membahas konsep dasar observability melalui tiga pilar utamanya: metrics, logs, dan traces. Pembahasan mencakup perbedaan monitoring dan observability, karakteristik masing-masing pilar, cara mengorelasikannya, contoh investigasi insiden, strategi alerting, contoh arsitektur menggunakan Prometheus, Grafana, Loki, dan Tempo, serta langkah implementasi yang praktis.

## Monitoring vs Observability: Apa Bedanya?

Monitoring pada dasarnya adalah proses mengumpulkan data yang sudah diketahui sebelumnya dan memberi tahu ketika sesuatu melewati batas yang ditentukan. Contoh klasik adalah memonitor CPU usage, memory usage, disk usage, dan status HTTP endpoint. Jika CPU di atas 90 persen selama lima menit, sistem mengirim alert. Pendekatan ini bekerja baik untuk failure mode yang sudah dikenal.

Observability memiliki sudut pandang yang berbeda. Observability adalah kemampuan untuk memahami kondisi internal sistem berdasarkan output eksternal yang dihasilkannya. Sistem yang observable memungkinkan engineer menjawab pertanyaan baru yang belum pernah dipikirkan sebelumnya, tanpa harus mendeploy kode baru atau menambah instrumen secara mendadak.

Analoginya sederhana. Monitoring seperti lampu indikator di dashboard mobil yang menyala ketika bensin hampir habis atau mesin terlalu panas. Observability seperti kemampuan membuka kap mesin, membaca sensor, memeriksa riwayat perawatan, dan menelusuri aliran bahan bakar untuk memahami akar masalah ketika mobil tiba-tiba kehilangan tenaga di jalan tol.

Dalam praktik DevOps dan Site Reliability Engineering, monitoring adalah bagian dari observability, bukan penggantinya. Monitoring yang baik tetap diperlukan, tetapi tanpa observability, tim akan kesulitan menangani insiden yang kompleks, intermiten, atau melibatkan banyak layanan.

## Pilar Pertama: Metrics

Metrics adalah data numerik yang diukur dari waktu ke waktu. Metrics biasanya bersifat agregat, ringan, dan cocok untuk melihat tren serta memicu alert. Contoh metrics antara lain jumlah request per detik, latency persentil ke-95, error rate, CPU usage, memory usage, disk I/O, dan jumlah koneksi database.

Karakteristik utama metrics adalah efisiensi. Metrics dapat disimpan untuk jangka waktu lama dengan biaya yang relatif rendah karena bentuknya yang ringkas. Metrics juga mudah divisualisasikan dalam bentuk grafik time series dan mudah digunakan untuk alerting berbasis threshold atau anomali.

Dalam ekosistem Prometheus, metrics biasanya diekspos melalui HTTP endpoint dalam format teks. Contoh konfigurasi scrape sederhana dalam file `prometheus.yml` adalah sebagai berikut:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "api-backend"
    static_configs:
      - targets: ["api-01:9100", "api-02:9100"]
    metrics_path: "/metrics"
```

Konfigurasi di atas memiliki arti sebagai berikut. Parameter `scrape_interval` menentukan seberapa sering Prometheus mengambil data, dalam contoh ini setiap 15 detik. Bagian `scrape_configs` mendefinisikan target yang akan diambil datanya. Opsi `job_name` adalah label logis untuk sekelompok target, sedangkan `targets` berisi daftar host dan port exporter. Opsi `metrics_path` menentukan path HTTP tempat metrics tersedia.

Setelah data terkumpul, engineer dapat menggunakan PromQL untuk melakukan query. Berikut beberapa contoh query yang umum digunakan:

```promql
# Error rate selama 5 menit terakhir
sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
sum(rate(http_requests_total[5m]))

# Latency persentil ke-95
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))

# Prediksi disk penuh dalam 24 jam
predict_linear(node_filesystem_free_bytes[6h], 24 * 3600) < 0
```

Query pertama menghitung rasio request dengan status 5xx terhadap total request, yang berguna untuk mendeteksi degradasi layanan. Query kedua menghitung latency P95 berdasarkan histogram, sehingga outlier tidak mendominasi hasil seperti pada rata-rata. Query ketiga menggunakan fungsi prediksi untuk memperkirakan kapan disk akan penuh berdasarkan tren enam jam terakhir.

Keterbatasan metrics adalah kurangnya konteks detail. Metrics dapat menunjukkan bahwa error rate naik pada pukul 14.00, tetapi tidak menjelaskan request mana yang gagal, payload apa yang terlibat, atau jalur eksekusi mana yang bermasalah. Untuk detail tersebut, diperlukan logs dan traces.

## Pilar Kedua: Logs

Logs adalah catatan peristiwa diskret yang terjadi di dalam sistem. Setiap baris log umumnya memuat timestamp, level severity, nama service, dan pesan yang menjelaskan apa yang terjadi. Logs sangat berguna untuk memahami urutan kejadian dan detail spesifik dari sebuah kegagalan.

Contoh log terstruktur dalam format JSON adalah sebagai berikut:

```json
{
  "timestamp": "2026-03-10T14:02:31Z",
  "level": "error",
  "service": "payment-api",
  "request_id": "req-8f3a21",
  "trace_id": "4b9f2c1a7d3e4f5a",
  "message": "payment gateway timeout after 5000ms",
  "order_id": "ORD-2026-11821",
  "attempt": 2
}
```

Format terstruktur seperti ini jauh lebih mudah diolah daripada log teks bebas. Field `request_id` dan `trace_id` memungkinkan korelasi antar layanan. Field `order_id` membantu menelusuri transaksi bisnis tertentu. Level `error` memudahkan filtering saat investigasi.

Untuk mengambil log dari API, banyak tim menggunakan command line atau query language dari sistem log aggregation. Contoh query Loki dalam Grafana adalah sebagai berikut:

```logql
{service="payment-api", level="error"} |= "timeout" | json | order_id="ORD-2026-11821"
```

Query di atas memiliki arti sebagai berikut. Bagian `{service="payment-api", level="error"}` memilih stream log dari service payment-api dengan level error. Operator `|= "timeout"` memfilter baris yang mengandung kata timeout. Operator `| json` memparsing log JSON menjadi field terstruktur. Bagian terakhir memfilter transaksi dengan order ID tertentu.

Praktik yang baik dalam logging antara lain menggunakan format terstruktur JSON, menyertakan correlation ID di setiap request, mencatat konteks yang cukup tetapi tidak berlebihan, menggunakan level yang konsisten, dan menghindari pencatatan data sensitif seperti password, token, atau nomor kartu kredit. Volume log juga perlu dikendalikan karena penyimpanan log skala besar dapat menjadi mahal.

## Pilar Ketiga: Traces

Traces merepresentasikan perjalanan sebuah request ketika melewati berbagai layanan dalam sistem terdistribusi. Satu trace terdiri dari beberapa span, di mana setiap span merepresentasikan satu unit kerja seperti panggilan HTTP, query database, atau pemanggilan message queue. Setiap span memiliki timestamp mulai dan selesai, sehingga engineer dapat melihat di mana waktu paling banyak dihabiskan.

Sebagai gambaran, sebuah request checkout di aplikasi e-commerce dapat menghasilkan trace seperti berikut:

```text
Trace ID: 4b9f2c1a7d3e4f5a (total 1.850ms)
├── frontend: POST /checkout (1.850ms)
│   ├── auth-service: validate token (45ms)
│   ├── cart-service: get cart (60ms)
│   ├── payment-api: charge payment (1.520ms)
│   │   ├── payment-gateway: external call (1.480ms)
│   │   └── database: update order status (35ms)
│   └── notification-service: send email (async)
```

Dari visualisasi tersebut, akar masalah langsung terlihat. Dari total 1.850ms, sebesar 1.480ms dihabiskan untuk panggilan ke payment gateway eksternal. Tanpa traces, engineer mungkin hanya melihat bahwa endpoint checkout lambat, lalu berspekulasi apakah masalah ada di database, CPU, atau jaringan.

Implementasi tracing umumnya menggunakan standar OpenTelemetry. Contoh inisialisasi sederhana di aplikasi Python adalah sebagai berikut:

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

# Menentukan provider global untuk tracing
trace.set_tracer_provider(TracerProvider())

# Mendefinisikan endpoint collector tempat span dikirim
otlp_exporter = OTLPSpanExporter(endpoint="http://tempo:4318/v1/traces")

# Menggunakan batch processor agar pengiriman span efisien
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("process-payment") as span:
    span.set_attribute("order.id", "ORD-2026-11821")
    span.set_attribute("payment.method", "virtual_account")
    # Logika bisnis pembayaran diletakkan di dalam konteks span ini
```

Kode di atas melakukan empat hal. Pertama, menginisialisasi tracer provider global. Kedua, mengonfigurasi exporter yang mengirim span ke backend Tempo melalui protokol OTLP. Ketiga, menambahkan batch processor agar span dikirim dalam batch dan tidak membebani aplikasi. Keempat, membuat span bernama process-payment dengan atribut bisnis yang relevan.

Tantangan dalam tracing adalah overhead instrumentasi dan sampling. Pada sistem dengan traffic sangat tinggi, menyimpan semua trace akan mahal. Oleh karena itu, banyak tim menggunakan tail-based sampling atau menyimpan semua trace untuk request error dan hanya sebagian kecil untuk request sukses.

## Korelasi Metrics, Logs, dan Traces

Kekuatan observability muncul ketika ketiga pilar saling terhubung. Metrics memberi tahu kapan sesuatu bermasalah, logs menjelaskan apa yang terjadi secara detail, dan traces menunjukkan di mana masalah terjadi dalam alur terdistribusi.

Korelasi yang paling efektif menggunakan identifier bersama. Setiap request yang masuk sebaiknya mendapatkan `trace_id` dan `request_id` yang diteruskan ke semua layanan downstream, dicatat di setiap baris log, dan dilampirkan sebagai label atau atribut di metrics dan traces. Dengan cara ini, alur investigasi menjadi linear.

Contoh alur investigasi yang ideal adalah sebagai berikut. Dashboard Grafana menunjukkan lonjakan error rate pada service checkout mulai pukul 14.00. Engineer mengklik panel tersebut dan langsung melihat exemplar atau link ke trace yang gagal. Dari trace, terlihat bahwa span payment-api selalu timeout setelah 5 detik. Engineer menyalin trace ID, menempelkannya di Loki, dan menemukan log error yang menunjukkan timeout ke payment gateway eksternal dengan order ID tertentu. Dalam hitungan menit, konteks insiden sudah lengkap tanpa harus berpindah-pindah tool secara manual.

Untuk mendukung korelasi ini, konfigurasi Grafana dapat menghubungkan data source Prometheus, Loki, dan Tempo. Contoh potongan konfigurasi data source Loki dengan derived field adalah sebagai berikut:

```yaml
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    url: http://loki:3100
    jsonData:
      derivedFields:
        - datasourceUid: tempo-datasource
          matcherRegex: "trace_id=(\\w+)"
          name: TraceID
          url: "$${__value.raw}"
```

Konfigurasi tersebut membuat setiap log yang mengandung trace ID dapat diklik dan langsung membuka trace terkait di Tempo. Fitur kecil seperti ini sangat mempercepat investigasi insiden.

## Contoh Investigasi Insiden

Untuk menggambarkan manfaat observability secara konkret, perhatikan skenario berikut. Pada hari Selasa pukul 14.05, alert berbunyi karena error rate checkout melebihi 2 persen selama lima menit. Tanpa observability yang baik, engineer mungkin langsung mengecek CPU dan memory, me-restart service, dan berharap masalah hilang.

Dengan observability yang terhubung, langkah investigasi menjadi lebih sistematis. Pertama, engineer membuka dashboard metrics dan memastikan bahwa lonjakan error hanya terjadi pada route checkout, bukan pada seluruh API. Latency P95 route tersebut naik dari 300ms menjadi 2 detik, sedangkan CPU dan memory tetap normal. Ini menunjukkan masalah bukan pada kapasitas server.

Kedua, engineer membuka traces untuk request yang gagal. Sembilan dari sepuluh trace menunjukkan span payment-gateway memakan waktu lebih dari 4,8 detik sebelum timeout. Span database dan auth-service tetap cepat. Ini mempersempit masalah ke integrasi eksternal.

Ketiga, engineer mencari log dengan trace ID yang sama dan menemukan pola error timeout dengan pesan connection reset dari sisi gateway. Log juga menunjukkan bahwa retry kedua biasanya berhasil, tetapi retry pertama selalu gagal. Informasi ini mengarah pada dugaan adanya masalah koneksi atau rate limit di sisi provider.

Keempat, tim menghubungi provider payment gateway dan mengonfirmasi adanya degradasi di salah satu region mereka. Solusi sementara adalah memindahkan traffic ke endpoint region lain melalui perubahan konfigurasi, tanpa perlu mendeploy ulang aplikasi. Setelah perubahan, metrics kembali normal dan traces menunjukkan latency gateway turun ke 200ms.

Hasilnya kurang lebih seperti ini: waktu deteksi hingga mitigasi dapat ditekan dari hitungan jam menjadi kurang dari 30 menit, dan postmortem memiliki data lengkap berupa grafik metrics, contoh trace, dan log relevan.

## Strategi Alerting yang Efektif

Observability tanpa alerting yang baik akan menghasilkan kelelahan alert atau justru insiden yang terlewat. Prinsip dasarnya adalah memberi alert pada gejala yang dirasakan pengguna, bukan pada setiap anomali infrastruktur. Latency tinggi, error rate tinggi, dan throughput turun adalah contoh gejala yang layak menjadi alert. CPU 80 persen tanpa dampak ke pengguna umumnya cukup dimonitor melalui dashboard, bukan alert yang membangunkan engineer tengah malam.

Contoh aturan alert Prometheus untuk error rate adalah sebagai berikut:

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) > 0.02
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate checkout melebihi 2 persen"
          description: "Periksa dashboard checkout dan trace terbaru di Tempo."
          runbook: "https://wiki.internal/runbook/checkout-error"
```

Setiap bagian memiliki fungsi. Ekspresi `expr` mendefinisikan kondisi alert berdasarkan PromQL. Parameter `for: 5m` memastikan alert hanya menyala jika kondisi bertahan selama lima menit, sehingga spike sesaat tidak memicu notifikasi. Label `severity` membantu routing ke kanal yang tepat. Anotasi `summary`, `description`, dan `runbook` memberi konteks agar engineer yang menerima alert langsung tahu langkah awal yang perlu dilakukan.

Selain threshold statis, tim yang lebih matang menggunakan alert berbasis Service Level Objective. Misalnya, jika target availability adalah 99,9 persen dalam 30 hari, alert dapat dipicu ketika error budget terkonsumsi terlalu cepat. Pendekatan ini mengurangi noise dan memfokuskan perhatian pada risiko yang benar-benar mengancam target layanan.

## Contoh Arsitektur: Prometheus, Grafana, Loki, dan Tempo

Arsitektur observability yang populer di lingkungan Kubernetes maupun virtual machine menggabungkan empat komponen open source. Prometheus mengumpulkan dan menyimpan metrics. Loki mengumpulkan dan menyimpan logs dengan pendekatan label yang mirip Prometheus sehingga biaya operasional lebih ringan dibanding full-text index. Tempo menyimpan traces dan terintegrasi erat dengan Grafana. Grafana menjadi antarmuka terpadu untuk visualisasi metrics, logs, dan traces.

Contoh definisi stack menggunakan Docker Compose untuk kebutuhan eksperimen adalah sebagai berikut:

```yaml
services:
  prometheus:
    image: prom/prometheus:v2.52.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  loki:
    image: grafana/loki:2.9.4
    ports:
      - "3100:3100"

  tempo:
    image: grafana/tempo:2.4.1
    ports:
      - "3200:3200"
      - "4318:4318"

  grafana:
    image: grafana/grafana:10.4.1
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
      - loki
      - tempo
```

File di atas mendefinisikan empat service yang saling melengkapi. Prometheus berjalan di port 9090 untuk query metrics. Loki berjalan di port 3100 untuk ingestion dan query log. Tempo berjalan di port 3200 untuk query dan port 4318 untuk menerima span OTLP. Grafana berjalan di port 3000 sebagai frontend. Dependensi memastikan Grafana dimulai setelah backend observability siap.

Untuk aplikasi yang berjalan di Kubernetes, pola yang umum adalah menggunakan Prometheus Operator dengan ServiceMonitor, Promtail atau Grafana Alloy untuk pengiriman log, dan OpenTelemetry Collector untuk menerima span lalu meneruskannya ke Tempo. Pola ini memisahkan concern antara instrumentasi aplikasi dan backend penyimpanan.

## Langkah Implementasi Praktis

Implementasi observability sebaiknya dilakukan bertahap agar tidak membebani tim. Tahap pertama adalah menstandarkan metrics dasar untuk semua service. Pastikan setiap service mengekspos RED metrics yaitu rate, errors, dan duration, ditambah USE metrics untuk infrastruktur yaitu utilization, saturation, dan errors. Buat dashboard standar per service sehingga setiap tim memiliki tampilan yang konsisten.

Tahap kedua adalah memperbaiki logging. Migrasikan log ke format JSON terstruktur, pastikan setiap request membawa correlation ID, dan sentralisasikan log ke satu backend seperti Loki atau Elasticsearch. Buat panduan level log agar engineer tidak bingung kapan menggunakan debug, info, warning, atau error.

Tahap ketiga adalah menambahkan tracing pada jalur kritis terlebih dahulu, misalnya alur login, checkout, atau pembayaran. Tidak perlu menginstrumentasi semua fungsi sekaligus. Fokus pada boundary antar service seperti panggilan HTTP, query database, dan akses message broker. Setelah manfaatnya terlihat, perluas cakupan secara bertahap.

Tahap keempat adalah menghubungkan ketiganya di Grafana dan merapikan alerting. Tambahkan link dari dashboard metrics ke log dan trace. Kurangi alert yang tidak actionable dan lengkapi setiap alert dengan runbook. Lakukan review alert setiap bulan untuk memastikan tidak ada alert yang selalu diabaikan.

## Troubleshooting Umum

Masalah pertama yang sering ditemui adalah metrics hilang atau tidak konsisten. Penyebab umum adalah target down, label cardinality terlalu tinggi, atau scrape interval terlalu jarang. Perintah berikut membantu memeriksa status target:

```bash
# Memeriksa endpoint metrics secara langsung
curl -s http://api-01:9100/metrics | head -n 20
```

Perintah `curl` mengambil keluaran metrics mentah dari exporter. Opsi `-s` menyembunyikan progress bar agar output bersih. Pipe ke `head -n 20` menampilkan 20 baris pertama untuk memastikan format metrics valid dan endpoint dapat diakses.

Masalah kedua adalah log membanjiri storage. Solusinya adalah meninjau level log di environment production, menonaktifkan log debug yang verbose, menerapkan retention policy, dan memfilter log health check yang tidak penting. Query berikut dapat digunakan untuk menemukan service paling berisik:

```logql
sum by (service) (count_over_time({level="debug"}[1h]))
```

Query tersebut menghitung jumlah log debug per service selama satu jam, sehingga tim dapat fokus memperbaiki service yang paling boros.

Masalah ketiga adalah trace tidak lengkap atau terputus. Penyebab umum adalah context propagation yang hilang ketika request melewati message queue, background job, atau library HTTP yang belum terinstrumentasi. Solusinya adalah memastikan setiap propagator meneruskan header trace, menggunakan library OpenTelemetry resmi, dan menguji alur end-to-end di environment staging.

## Checklist Praktis

Sebagai panduan cepat, berikut checklist yang dapat digunakan ketika membangun observability dari nol. Pastikan setiap service mengekspos metrics RED dan infrastruktur memiliki metrics USE. Pastikan log terstruktur, tersentralisasi, dan mengandung correlation ID. Pastikan jalur kritis sudah memiliki tracing end-to-end. Pastikan dashboard metrics terhubung ke log dan trace terkait. Pastikan setiap alert memiliki owner, severity, dan runbook yang jelas. Pastikan retention dan sampling sudah disesuaikan dengan budget penyimpanan. Terakhir, pastikan tim melakukan latihan investigasi menggunakan data observability, bukan hanya mengandalkan teori.

## Kesimpulan

Perpindahan dari monitoring ke observability bukan sekadar mengganti tool, melainkan mengubah cara berpikir tentang operasional sistem. Monitoring menjawab apakah sistem bermasalah, sedangkan observability membantu memahami mengapa masalah terjadi dan di mana letak akar masalahnya. Metrics memberikan gambaran tren dan memicu alert, logs memberikan detail peristiwa, dan traces menunjukkan alur request di sistem terdistribusi. Ketika ketiganya terkorelasi dengan baik melalui identifier bersama dan antarmuka terpadu seperti Grafana, waktu investigasi insiden dapat ditekan secara signifikan. Mulailah dari hal kecil seperti menstandarkan metrics dan memperbaiki format log, lalu perluas ke tracing dan korelasi lintas pilar. Dengan pendekatan bertahap, observability akan menjadi fondasi yang membuat sistem lebih andal dan tim lebih percaya diri dalam menangani insiden.

