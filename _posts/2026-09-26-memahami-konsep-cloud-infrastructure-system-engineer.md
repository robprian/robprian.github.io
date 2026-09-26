---
layout: post
title: "Memahami Konsep Cloud Infrastructure untuk System Engineer"
date: 2026-09-26 13:29:08 +0000
description: "Penjelasan konsep dasar cloud infrastructure yang penting dipahami oleh System Engineer dan Infrastructure Engineer."
categories: []
tags: []
---

# Memahami Konsep Cloud Infrastructure untuk System Engineer

Istilah cloud sering digunakan secara longgar untuk menyebut apa pun yang berjalan di internet, padahal bagi System Engineer dan Infrastructure Engineer, cloud infrastructure memiliki konsep yang cukup spesifik. Cloud bukan sekadar VPS di tempat lain, melainkan model pengelolaan compute, storage, dan networking yang dapat dipesan secara mandiri, diskalakan secara elastis, dan ditagih berdasarkan pemakaian. Memahami konsep dasarnya membantu engineer merancang sistem yang andal, aman, dan efisien dari sisi biaya.

Artikel ini membahas fondasi cloud infrastructure dari sudut pandang System Engineer, mulai dari compute, storage, networking, IAM, monitoring, hingga perbedaan scalability dan availability, kesadaran biaya, serta perbandingan cloud dengan infrastruktur tradisional.

## 1. Compute: Virtual Machine, Container, dan Serverless

Compute adalah daya komputasi tempat aplikasi berjalan. Di cloud, compute tersedia dalam beberapa bentuk dengan tingkat abstraksi yang berbeda.

Bentuk paling dasar adalah virtual machine atau instance, misalnya Amazon EC2, Google Compute Engine, atau Azure Virtual Machines. Sebuah VM adalah komputer virtual lengkap dengan virtual CPU, RAM, disk, dan network interface-nya sendiri. Administrator masih mengelola sistem operasi, patching, dan konfigurasi di dalamnya, sehingga dari sisi operasional mirip dengan server fisik, hanya saja provisioning-nya jauh lebih cepat dan dapat diotomatisasi melalui API.

Di atas VM terdapat container, misalnya Docker yang dijalankan di Kubernetes atau layanan container managed seperti ECS, GKE, dan AKS. Container berbagi kernel dengan host tetapi memiliki filesystem dan proses yang terisolasi, sehingga lebih ringan dan cepat dijalankan dibandingkan VM. Bagi System Engineer, perbedaan penting terletak pada pola operasionalnya. VM umumnya diperlakukan sebagai server berumur panjang yang di-patch secara berkala, sedangkan container umumnya diperlakukan sebagai unit immutable yang diganti dengan image baru setiap kali ada perubahan, bukan diubah langsung di dalamnya.

Tingkat abstraksi tertinggi adalah serverless atau Functions-as-a-Service, misalnya AWS Lambda atau Cloud Functions. Pada model ini, engineer hanya mengunggah kode dan menentukan trigger, sedangkan penyedia cloud mengatur server, scaling, dan patching di belakang layar. Model ini cocok untuk beban sporadis dan event-driven, tetapi kurang cocok untuk aplikasi yang membutuhkan koneksi persisten lama atau kontrol mendalam terhadap sistem operasi.

Perintah berikut memberi gambaran bagaimana instance cloud dapat diperiksa dari dalam sistem operasi, sama seperti server biasa:

```bash
lscpu | head -n 20
free -h
df -h
```

Perintah `lscpu` menampilkan informasi CPU virtual yang dialokasikan, `free -h` menampilkan kapasitas memori dalam format yang mudah dibaca, dan `df -h` menampilkan kapasitas disk yang terpasang. Walaupun hardware-nya virtual, wawasan tentang resource ini tetap penting untuk capacity planning dan troubleshooting performa.

Prinsip praktisnya, pilih VM ketika membutuhkan kontrol penuh atas sistem operasi, pilih container ketika membutuhkan deployment cepat dan konsisten antar environment, dan pilih serverless ketika beban kerja bersifat event-driven dan tidak memerlukan server yang selalu menyala.

## 2. Storage: Block, Object, dan File

Storage di cloud umumnya dibagi menjadi tiga kategori utama dengan karakteristik berbeda. Memilih jenis yang salah dapat berdampak pada performa, biaya, dan kerumitan operasional.

Block storage adalah disk yang dipasang ke satu VM, misalnya EBS di AWS atau Persistent Disk di Google Cloud. Dari dalam sistem operasi, block storage terlihat seperti disk biasa yang dapat dipartisi dan diformat. Contoh pemeriksaan disk pada VM Linux:

```bash
lsblk
sudo blkid
```

Perintah `lsblk` menampilkan hierarki block device dan mount point-nya, sedangkan `blkid` menampilkan UUID dan tipe filesystem. Block storage cocok untuk database, sistem file aplikasi, dan kebutuhan IOPS tinggi, tetapi umumnya hanya dapat dipasang ke satu instance dalam satu waktu, kecuali menggunakan varian khusus yang mendukung multi-attach.

Object storage, misalnya Amazon S3 atau Google Cloud Storage, menyimpan data sebagai objek dengan key unik, bukan sebagai file dalam hierarki direktori tradisional. Object storage sangat andal untuk backup, arsip, file statis website, dan data lake karena dapat menyimpan volume sangat besar dengan durability tinggi. Aksesnya melalui API atau URL, bukan melalui mount filesystem biasa, sehingga pola aksesnya berbeda dengan disk lokal.

File storage atau network file system, misalnya EFS atau Filestore, menyediakan filesystem bersama yang dapat dipasang ke banyak instance sekaligus melalui protokol seperti NFS atau SMB. Jenis ini berguna ketika beberapa server membutuhkan akses ke direktori bersama, misalnya direktori upload aplikasi legacy. Namun performanya umumnya tidak sebaik block storage lokal untuk beban transaksional berat.

Contoh sederhana mengunggah backup ke object storage menggunakan AWS CLI:

```bash
aws s3 cp /backup/database.sql.gz s3://nama-bucket/backup/2026-09-26/
aws s3 ls s3://nama-bucket/backup/2026-09-26/
```

Perintah pertama mengunggah berkas backup ke bucket dengan prefix tanggal, sedangkan perintah kedua memverifikasi bahwa objek sudah tersedia di cloud. Pola penamaan berbasis tanggal seperti ini memudahkan rotasi dan pencarian backup di kemudian hari.

Kaidah praktisnya, gunakan block storage untuk sistem operasi dan database, gunakan object storage untuk backup, file statis, dan data dalam skala besar, dan gunakan file storage hanya ketika benar-benar membutuhkan filesystem bersama antar instance.

## 3. Networking: VPC, Subnet, Load Balancer, dan DNS

Networking cloud dibangun di atas konsep Virtual Private Cloud atau VPC, yaitu jaringan virtual privat yang terisolasi dari pelanggan lain. Di dalam VPC, administrator membagi jaringan menjadi subnet, mengatur tabel routing, dan mengendalikan lalu lintas menggunakan security group dan network ACL.

Pembagian umum adalah public subnet untuk komponen yang harus diakses dari internet, seperti load balancer dan bastion host, serta private subnet untuk aplikasi dan database yang tidak boleh terekspos langsung. Contoh arsitektur sederhana terdiri dari load balancer di public subnet yang meneruskan traffic ke aplikasi di private subnet, lalu aplikasi tersebut membaca database yang juga berada di private subnet berbeda. Dengan desain ini, hanya load balancer yang memiliki alamat IP publik, sehingga permukaan serangan jauh lebih kecil.

Security group berfungsi sebagai firewall stateful di tingkat instance, sedangkan network ACL berfungsi sebagai firewall stateless di tingkat subnet. Contoh aturan yang sehat adalah membuka port 443 dari internet ke load balancer, membuka port aplikasi hanya dari security group load balancer, dan membuka port database hanya dari security group aplikasi. Prinsipnya sama dengan firewall tradisional, yaitu default deny dan hanya buka yang dibutuhkan.

Load balancer memiliki peran penting dalam availability dan scalability. Ia mendistribusikan request ke banyak instance backend, melakukan health check berkala, dan otomatis berhenti mengirim traffic ke instance yang tidak sehat. Hasilnya kurang lebih seperti distribusi merata ke instance sehat, dengan instance bermasalah dikeluarkan sementara dari pool hingga pulih kembali.

DNS di cloud umumnya terintegrasi dengan layanan seperti Route 53 atau Cloud DNS. Selain resolusi nama biasa, DNS dapat digunakan untuk routing berbasis latency, failover antar region, dan weighted routing untuk deployment bertahap. Verifikasi resolusi DNS dapat dilakukan dengan perintah berikut:

```bash
dig +short app.contoh.id
dig +short app.contoh.id @8.8.8.8
```

Perintah pertama menggunakan resolver bawaan sistem, sedangkan perintah kedua memaksa query melalui resolver publik Google. Perbandingan keduanya membantu memastikan apakah masalah akses disebabkan oleh propagasi DNS atau konfigurasi di sisi server.

Bagi System Engineer, kemampuan membaca topologi VPC, tabel route, dan aturan security group sama pentingnya dengan kemampuan mengelola server itu sendiri, karena banyak gangguan konektivitas di cloud bersumber dari konfigurasi jaringan, bukan dari aplikasi.

## 4. IAM: Identitas dan Hak Akses di Cloud

Identity and Access Management atau IAM adalah fondasi keamanan cloud. Setiap manusia, aplikasi, dan layanan memiliki identitas, dan setiap identitas hanya diberikan izin minimum yang dibutuhkan. Kegagalan mengelola IAM adalah salah satu penyebab insiden cloud yang paling sering terjadi, misalnya access key yang bocor atau role dengan izin administratif berlebihan.

Ada beberapa konsep kunci yang perlu dipahami. User merepresentasikan manusia atau akun operasional. Role merepresentasikan identitas yang dapat diasumsikan sementara oleh user, aplikasi, atau layanan, tanpa password permanen. Policy adalah dokumen aturan yang menentukan aksi apa yang diizinkan atau ditolak terhadap resource mana. Praktik terbaik adalah memberikan policy sekecil mungkin, misalnya aplikasi backup hanya boleh menulis ke satu bucket tertentu, bukan ke semua bucket.

Contoh policy JSON yang membatasi akses hanya ke satu bucket S3:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::nama-bucket/backup/*"
    }
  ]
}
```

Policy di atas hanya mengizinkan aksi upload dan download objek pada prefix `backup` di bucket tertentu. Tidak ada izin untuk menghapus bucket, mengubah konfigurasi, atau mengakses bucket lain. Prinsip least privilege seperti ini membatasi dampak apabila kredensial aplikasi bocor.

Hal yang perlu dihindari adalah menyimpan access key permanen di dalam source code, image container, atau repository Git. Untuk workload yang berjalan di dalam cloud, gunakan role yang terpasang ke instance atau service account, sehingga kredensial bersifat sementara dan dirotasi otomatis oleh platform. Aktifkan juga multi-factor authentication untuk akun manusia, terutama akun dengan hak administratif.

Audit IAM perlu dilakukan berkala. Periksa siapa yang memiliki akses administratif, apakah masih ada user yang sudah tidak aktif, dan apakah ada policy yang terlalu longgar seperti `Action: "*"` terhadap `Resource: "*"`. Kebersihan IAM sama pentingnya dengan kebersihan konfigurasi server.

## 5. Monitoring, Logging, dan Observability

Di cloud, monitoring tidak hanya soal apakah server menyala, tetapi juga apakah aplikasi berperilaku normal dari sudut pandang pengguna. Tiga pilar observability yang umum dirujuk adalah metrics, logs, dan traces.

Metrics adalah angka yang diukur dari waktu ke waktu, misalnya utilisasi CPU, memori, disk, jumlah request per detik, error rate, dan latensi. Layanan monitoring bawaan cloud umumnya sudah mengumpulkan metrics infrastruktur secara otomatis, tetapi metrics aplikasi seperti antrian job dan waktu respons endpoint perlu dikirim secara eksplisit oleh aplikasi.

Logs adalah catatan peristiwa diskret, misalnya log akses web server, log error aplikasi, dan log audit IAM. Di cloud, log sebaiknya dikumpulkan ke tempat terpusat agar tetap tersedia meskipun instance dihapus oleh autoscaling. Tanpa log terpusat, troubleshooting menjadi sulit karena bukti sudah hilang bersama instance yang terminated.

Traces mengikuti perjalanan satu request melintasi banyak layanan, misalnya dari API gateway ke service autentikasi, lalu ke database. Tracing sangat membantu pada arsitektur microservices di mana satu request dapat melewati belasan komponen.

Contoh pemeriksaan resource cepat dari dalam VM sebelum melihat dashboard cloud:

```bash
uptime
vmstat 1 5
df -h /var/log
```

Perintah `uptime` menunjukkan load average sistem, `vmstat` menampilkan statistik CPU, memori, dan I/O dalam interval satu detik sebanyak lima kali, sedangkan perintah ketiga memastikan partisi log tidak penuh. Pemeriksaan sederhana ini sering kali cukup untuk menentukan apakah masalah bersumber dari resource lokal atau dari lapisan cloud di atasnya.

Praktik yang baik adalah menentukan indikator layanan yang penting bagi pengguna, misalnya tingkat keberhasilan checkout atau waktu respons API, lalu membuat alert berdasarkan indikator tersebut, bukan hanya berdasarkan CPU tinggi. Alert yang terlalu sensitif menyebabkan kelelahan notifikasi, sedangkan alert yang terlalu longgar menyebabkan insiden terdeteksi terlambat.

## 6. Scalability versus Availability

Dua istilah yang sering tertukar adalah scalability dan availability. Scalability adalah kemampuan sistem menangani beban yang bertambah, sedangkan availability adalah kemampuan sistem tetap dapat diakses ketika terjadi kegagalan.

Scaling vertikal berarti memperbesar satu server, misalnya dari 2 CPU menjadi 8 CPU. Cara ini sederhana tetapi memiliki batas fisik dan umumnya membutuhkan downtime saat resize. Scaling horizontal berarti menambah jumlah instance dan membagi beban di antaranya melalui load balancer. Cara ini lebih elastis dan tahan kegagalan, tetapi menuntut aplikasi dirancang stateless atau dengan session terpusat agar request dapat ditangani oleh instance mana pun.

Availability dicapai melalui redundansi dan eliminasi single point of failure. Contohnya adalah menjalankan aplikasi di minimal dua availability zone, menggunakan database dengan replica standby, dan menyimpan file penting di storage yang tereplikasi otomatis. Ukuran availability sering dinyatakan dalam persentase, misalnya 99,9 persen berarti toleransi downtime sekitar 43 menit per bulan. Semakin tinggi targetnya, semakin mahal dan kompleks arsitekturnya, sehingga target perlu disesuaikan dengan kebutuhan bisnis, bukan sekadar mengejar angka tertinggi.

Autoscaling menggabungkan kedua konsep tersebut dengan menambah atau mengurangi instance secara otomatis berdasarkan metrics, misalnya rata-rata CPU atau panjang antrian. Namun autoscaling bukan solusi ajaib. Apabila bottleneck berada di database, menambah instance aplikasi justru dapat memperparah beban database. Oleh karena itu, identifikasi bottleneck yang sebenarnya jauh lebih penting daripada sekadar menambah kapasitas.

## 7. Cost Awareness: Cloud Ditagih Berdasarkan Pemakaian

Salah satu perbedaan terbesar cloud dengan infrastruktur tradisional adalah model tagihan berbasis pemakaian. Setiap jam instance menyala, setiap gigabyte storage per bulan, dan setiap gigabyte transfer data keluar umumnya tercatat sebagai biaya. Kemudahan provisioning membuat biaya dapat membengkak diam-diam apabila tidak diawasi.

Beberapa kebiasaan hemat biaya yang realistis antara lain memilih ukuran instance sesuai kebutuhan aktual berdasarkan metrics, bukan berdasarkan perkiraan pesimistis. Mematikan environment development dan testing di luar jam kerja dapat menghemat biaya signifikan karena environment tersebut tidak perlu menyala terus-menerus. Menggunakan storage tier yang tepat, misalnya tier arsip untuk backup lama yang jarang diakses, juga memberikan penghematan besar. Selain itu, transfer data antar region dan keluar ke internet umumnya berbayar, sehingga arsitektur yang banyak bicara lintas region perlu dirancang dengan sadar biaya.

Tagging resource berdasarkan proyek, environment, dan pemilik sangat membantu ketika tagihan bulanan perlu diurai. Tanpa tagging yang disiplin, diskusi biaya berubah menjadi tebakan karena tidak jelas resource mana milik siapa. Review tagihan berkala, misalnya setiap bulan, sebaiknya menjadi agenda rutin tim infrastructure, bukan hanya tugas bagian keuangan.

## 8. Perbandingan Cloud dengan Infrastruktur Tradisional

Infrastruktur tradisional umumnya berbasis capital expenditure, yaitu membeli server fisik, menyewa rack data center, dan merencanakan kapasitas untuk beberapa tahun ke depan. Keunggulannya adalah kontrol penuh atas hardware dan biaya yang relatif dapat diprediksi setelah investasi awal. Kekurangannya adalah provisioning lambat, risiko overprovisioning atau kekurangan kapasitas, serta beban operasional hardware seperti penggantian disk dan perawatan pendingin.

Cloud umumnya berbasis operational expenditure, yaitu membayar sesuai pemakaian tanpa investasi hardware di awal. Keunggulannya adalah kecepatan provisioning dalam hitungan menit, elastisitas untuk beban musiman, dan terbebas dari perawatan fisik. Kekurangannya adalah biaya operasional yang dapat fluktuatif, ketergantungan pada penyedia, dan kebutuhan disiplin dalam tata kelola agar biaya dan keamanan tetap terkendali.

Bagi System Engineer, perbedaan operasional yang paling terasa adalah pergeseran dari mengelola hardware ke mengelola API dan konfigurasi sebagai kode. Pembuatan VPC, instance, load balancer, dan aturan firewall idealnya didefinisikan dalam Infrastructure as Code seperti Terraform atau OpenTofu, sehingga environment dapat direproduksi, direview, dan diaudit seperti halnya kode aplikasi.

## Kesimpulan

Memahami cloud infrastructure berarti memahami bagaimana compute, storage, networking, identitas, dan observability saling terhubung membentuk sistem yang utuh. VM, container, dan serverless hanyalah pilihan compute dengan trade-off berbeda. Block, object, dan file storage melayani kebutuhan data yang berbeda pula. VPC, subnet, load balancer, dan DNS menentukan bagaimana traffic mengalir dan di mana batas keamanannya. IAM menentukan siapa boleh melakukan apa, monitoring menentukan seberapa cepat masalah terdeteksi, dan kesadaran biaya menentukan apakah arsitektur tersebut berkelanjutan secara finansial. Dengan fondasi ini, System Engineer dapat merancang infrastruktur cloud yang tidak hanya berjalan, tetapi juga aman, andal, dan efisien untuk jangka panjang.

