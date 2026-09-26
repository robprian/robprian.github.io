---
layout: post
title: "Membangun Homelab dengan Proxmox: Virtual Machine dan Container"
date: 2026-09-26 13:29:06 +0000
description: "Panduan memahami konsep homelab menggunakan Proxmox untuk menjalankan virtual machine dan container sebagai lingkungan belajar infrastructure."
categories: []
tags: []
---

# Membangun Homelab dengan Proxmox: Virtual Machine dan Container

Homelab adalah lingkungan laboratorium di rumah atau kantor kecil yang digunakan untuk belajar, bereksperimen, dan menguji konsep infrastructure tanpa risiko mengganggu sistem production. Bagi calon System Engineer, Network Engineer, atau DevOps Engineer, homelab adalah tempat terbaik untuk memahami virtualisasi, jaringan, storage, backup, dan monitoring secara langsung, bukan sekadar teori. Proxmox Virtual Environment atau Proxmox VE adalah salah satu platform paling populer untuk homelab karena gratis, open source, dan cukup powerful untuk kebutuhan belajar hingga semi-production.

Artikel ini membahas konsep homelab, dasar Proxmox VE, perbedaan virtual machine dan LXC container, konsep storage dan network bridge, perencanaan resource, backup dan snapshot, monitoring, contoh arsitektur homelab, serta roadmap belajar yang sistematis.

## 1. Apa Itu Homelab dan Mengapa Perlu Membangunnya

Homelab pada dasarnya adalah mini data center pribadi. Bentuknya bisa beragam, mulai dari satu mini PC bekas, satu server tower, hingga rak kecil berisi beberapa node dan switch managed. Tujuannya bukan untuk menyaingi cloud publik, melainkan untuk menyediakan ruang aman tempat kegagalan adalah bagian dari proses belajar. Konfigurasi yang salah, service yang crash, atau jaringan yang terputus di homelab tidak menimbulkan insiden pelanggan, tetapi justru menghasilkan pemahaman yang sulit didapat dari membaca dokumentasi saja.

Manfaat homelab cukup konkret. Pertama, pembelajaran menjadi jauh lebih cepat karena teori langsung dipraktikkan. Konsep seperti VLAN, reverse proxy, atau replikasi database akan jauh lebih melekat setelah dikonfigurasi sendiri dan mengalami sendiri kesalahannya. Kedua, homelab menjadi portofolio hidup. Alih-alih hanya mencantumkan daftar teknologi di CV, engineer dapat menunjukkan arsitektur yang benar-benar berjalan, lengkap dengan dokumentasi dan backup-nya. Ketiga, homelab melatih kebiasaan operasional seperti monitoring, update rutin, dan dokumentasi perubahan, yang merupakan keterampilan inti System Engineer.

Homelab tidak harus mahal. Banyak homelab dimulai dari satu perangkat dengan prosesor empat core, RAM 16 gigabyte, dan SSD 500 gigabyte. Spesifikasi seperti ini sudah cukup untuk menjalankan Proxmox beserta beberapa VM dan container ringan. Kuncinya adalah memulai dari skala kecil, memahami setiap komponen, lalu berkembang secara bertahap sesuai kebutuhan belajar.

## 2. Pengenalan Proxmox VE

Proxmox VE adalah platform virtualisasi open source berbasis Debian yang menggabungkan hypervisor KVM untuk virtual machine dan LXC untuk container dalam satu antarmuka web terpadu. Selain virtualisasi, Proxmox menyediakan manajemen storage, jaringan virtual, backup, clustering, dan firewall dalam satu paket. Kombinasi ini membuatnya ideal untuk homelab karena administrator tidak perlu merangkai banyak tools terpisah hanya untuk memulai.

Instalasi Proxmox VE umumnya dilakukan dari ISO yang ditulis ke USB, lalu diinstal langsung ke disk server seperti halnya instalasi Linux biasa. Setelah instalasi selesai, antarmuka web dapat diakses melalui port 8006, misalnya `https://192.168.1.10:8006`. Antarmuka ini menjadi pusat kendali untuk membuat VM, container, mengatur storage, memantau resource, dan mengelola backup.

Secara konseptual, satu instalasi Proxmox disebut node. Beberapa node dapat digabungkan menjadi cluster agar VM dapat dimigrasi antar host dan dikelola dari satu tampilan. Untuk homelab pemula, satu node sudah sangat cukup. Clustering baru relevan setelah memahami dasar VM dan jaringan dengan baik, karena clustering menambah kompleksitas quorum, storage bersama, dan jaringan khusus migrasi.

Beberapa perintah dasar di shell Proxmox berguna untuk pemeriksaan cepat di luar antarmuka web:

```bash
pveversion -v
qm list
pct list
```

Perintah `pveversion -v` menampilkan versi Proxmox beserta paket-paket intinya, yang penting diketahui saat membaca dokumentasi atau melaporkan masalah. Perintah `qm list` menampilkan daftar virtual machine beserta ID, nama, status, dan alokasi resource-nya. Perintah `pct list` melakukan hal yang sama untuk LXC container. Kedua perintah terakhir membantu administrator memastikan tidak ada VM atau container asing yang berjalan tanpa diketahui.

Untuk melihat penggunaan resource node secara cepat:

```bash
pvesh get /nodes/$(hostname)/status
free -h
lsblk
```

Perintah pertama mengambil status node melalui API shell Proxmox, perintah kedua menampilkan penggunaan memori, dan perintah ketiga menampilkan struktur disk. Kebiasaan memeriksa resource sebelum membuat VM baru mencegah overprovisioning yang menyebabkan semua VM melambat.

## 3. Virtual Machine versus LXC Container

Proxmox mendukung dua jenis virtualisasi utama, yaitu KVM virtual machine dan LXC container. Keduanya terlihat mirip dari antarmuka web karena sama-sama bisa dinyalakan, dimatikan, dan di-backup, tetapi cara kerja dan kasus penggunaannya berbeda.

Virtual machine dengan KVM menyediakan virtualisasi penuh. Setiap VM memiliki kernel sendiri, virtual hardware sendiri, dan dapat menjalankan sistem operasi yang berbeda dari host, misalnya host Proxmox berbasis Linux menjalankan VM Windows, BSD, atau distribusi Linux lain. Isolasi VM sangat kuat, sehingga cocok untuk menguji sistem operasi berbeda, menjalankan workload yang membutuhkan kernel khusus, atau mensimulasikan environment production yang realistis. Konsekuensinya, VM membutuhkan resource lebih besar karena setiap VM membawa kernel dan service-nya sendiri.

LXC container adalah virtualisasi tingkat sistem operasi. Container berbagi kernel dengan host Proxmox, tetapi memiliki filesystem, proses, dan jaringan yang terisolasi. Container jauh lebih ringan dan cepat dijalankan, sehingga cocok untuk service Linux ringan seperti web server, DNS internal, reverse proxy, atau monitoring. Konsekuensinya, container hanya dapat menjalankan distribusi Linux dan tidak cocok untuk workload yang membutuhkan kernel berbeda atau modul kernel khusus.

Sebagai panduan praktis, gunakan VM untuk router virtual seperti pfSense atau OPNsense, untuk eksperimen sistem operasi berbeda, dan untuk mensimulasikan server production. Gunakan LXC untuk service pendukung yang ringan dan banyak jumlahnya, misalnya container untuk Nginx, container untuk database eksperimen, dan container untuk monitoring. Pola campuran ini memaksimalkan keterbatasan hardware homelab tanpa mengorbankan realisme belajar.

Contoh pembuatan container Debian dari template melalui command line:

```bash
pct create 100 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --hostname lab-web \
  --memory 1024 \
  --cores 2 \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp
```

Penjelasan parameternya cukup lugas. Angka `100` adalah ID unik container. Opsi `--hostname` menentukan nama host di dalam container. Opsi `--memory` dan `--cores` menentukan alokasi RAM dan CPU. Opsi `--rootfs` menentukan lokasi dan ukuran disk container. Opsi `--net0` menghubungkan interface container ke bridge `vmbr0` dengan IP otomatis via DHCP. Hasilnya kurang lebih seperti container baru yang muncul di daftar Proxmox dan siap dinyalakan melalui antarmuka web atau perintah `pct start 100`.

## 4. Konsep Storage di Proxmox

Storage adalah aspek yang sering diremehkan di homelab, padahal pemilihan storage memengaruhi performa VM, kemudahan backup, dan fleksibilitas migrasi. Proxmox mendukung beberapa jenis storage, yaitu local storage, LVM, LVM-Thin, direktori, ZFS, hingga network storage seperti NFS dan Ceph untuk kebutuhan lanjutan.

Untuk satu node homelab, dua tipe yang paling umum adalah direktori dan LVM-Thin. Storage direktori berbasis file, mudah dipahami, dan cocok untuk menyimpan ISO installer, template container, dan backup. LVM-Thin menyediakan thin provisioning untuk disk VM, sehingga ruang disk baru dialokasikan sesuai pemakaian aktual, bukan langsung sebesar ukuran maksimal. Fitur ini menghemat ruang secara signifikan ketika banyak VM dibuat untuk eksperimen singkat.

Perintah berikut membantu memahami kondisi storage dari sisi host:

```bash
pvesm status
df -h
lvs
```

Perintah `pvesm status` menampilkan daftar storage yang dikenal Proxmox beserta tipe, kapasitas, dan status aktifnya. Perintah `df -h` menampilkan penggunaan filesystem, sedangkan `lvs` menampilkan logical volume beserta ukurannya. Informasi ini penting sebelum mengunduh banyak ISO atau membuat VM baru, karena kehabisan ruang di tengah instalasi adalah masalah yang merepotkan.

Praktik yang baik adalah memisahkan lokasi ISO dan backup dari disk VM produksi homelab apabila memungkinkan, misalnya ISO di disk kedua atau NAS sederhana. Pemisahan ini mencegah perebutan I/O dan memudahkan manajemen ketika salah satu disk penuh. Untuk homelab satu disk, minimal pastikan ada monitoring ruang kosong dan jadwal pembersihan ISO lama yang sudah tidak digunakan.

## 5. Konsep Network dan Linux Bridge

Jaringan virtual di Proxmox umumnya dibangun di atas Linux bridge, yang secara konseptual berfungsi seperti virtual switch. VM dan container dihubungkan ke bridge, dan bridge tersebut dihubungkan ke interface fisik host menuju jaringan rumah. Bridge bawaan bernama `vmbr0` umumnya sudah terhubung ke LAN rumah dan mendapat IP via DHCP atau statis saat instalasi.

Contoh konfigurasi bridge dapat dilihat pada berkas berikut:

```bash
cat /etc/network/interfaces
```

Contoh keluaran berikut ini menunjukkan definisi `vmbr0` yang menjembatani interface fisik `enp3s0`:

```text
auto vmbr0
iface vmbr0 inet static
    address 192.168.1.10/24
    gateway 192.168.1.1
    bridge-ports enp3s0
    bridge-stp off
    bridge-fd 0
```

Parameter `address` dan `gateway` menentukan IP host Proxmox di jaringan rumah. Parameter `bridge-ports` menentukan interface fisik yang menjadi uplink ke jaringan nyata. Dengan konfigurasi ini, setiap VM yang dipasang ke `vmbr0` akan seolah-olah menjadi perangkat fisik baru di LAN rumah dan dapat memperoleh IP dari router yang sama.

Untuk kebutuhan belajar jaringan, administrator dapat membuat bridge tambahan tanpa uplink fisik, misalnya `vmbr1` sebagai jaringan lab terisolasi. VM yang terhubung ke bridge terisolasi hanya dapat berkomunikasi satu sama lain, sehingga cocok untuk mensimulasikan segmen DMZ, jaringan backend, atau skenario firewall tanpa mengganggu jaringan rumah. Inilah salah satu kekuatan homelab, yaitu kebebasan membangun topologi jaringan sendiri dengan risiko minimal.

Ketika VM tidak mendapatkan IP, urutan pemeriksaan yang logis adalah memastikan VM terhubung ke bridge yang benar, memastikan DHCP server tersedia di segmen tersebut, dan memeriksa firewall bawaan Proxmox di level node, VM, atau container yang mungkin memblokir traffic.

## 6. Perencanaan Resource dan Sizing VM

Hardware homelab selalu terbatas, sehingga perencanaan resource menjadi keterampilan penting. Kesalahan umum pemula adalah memberikan resource berlebihan ke setiap VM, misalnya 4 CPU dan 8 gigabyte RAM untuk satu VM kecil, sehingga host cepat kehabisan kapasitas dan hanya bisa menjalankan sedikit VM.

Pendekatan yang lebih baik adalah memulai dari kecil, lalu menaikkan sesuai hasil monitoring. Untuk service ringan seperti DNS internal, reverse proxy, atau dokumentasi internal, alokasi 1 CPU dan 512 megabyte hingga 1 gigabyte RAM umumnya sudah cukup. Untuk aplikasi web eksperimen, 2 CPU dan 2 gigabyte RAM adalah titik awal yang wajar. VM Windows atau desktop Linux membutuhkan resource lebih besar, umumnya minimal 2 CPU dan 4 gigabyte RAM agar nyaman digunakan.

Overcommit CPU masih dapat ditoleransi karena tidak semua VM sibuk pada saat yang sama, tetapi overcommit memori jauh lebih berisiko karena dapat memicu swapping dan melambatkan seluruh host. Pantau penggunaan aktual melalui grafik Proxmox atau perintah berikut di dalam VM:

```bash
free -h
uptime
iostat -x 1 3
```

Perintah `free -h` menunjukkan penggunaan memori aktual, `uptime` menunjukkan load average, dan `iostat` menunjukkan beban I/O disk. Apabila VM secara konsisten menggunakan sedikit resource, turunkan alokasinya agar dapat digunakan untuk lab lain. Kebiasaan right-sizing ini sama dengan yang dilakukan di cloud untuk mengendalikan biaya, hanya saja di homelab yang dihemat adalah kapasitas fisik.

## 7. Backup dan Snapshot

Backup dan snapshot memiliki tujuan berbeda dan keduanya penting di homelab. Snapshot adalah titik pemulihan cepat sebelum melakukan perubahan berisiko, misalnya sebelum upgrade atau sebelum mengubah konfigurasi jaringan. Snapshot sangat cepat dibuat dan dikembalikan, tetapi bukan pengganti backup karena umumnya tersimpan di storage yang sama dengan VM.

Backup Proxmox adalah salinan lengkap VM atau container yang dapat disimpan di storage terpisah dan digunakan untuk restore bahkan setelah VM dihapus. Penjadwalan backup dapat diatur melalui antarmuka web Proxmox, misalnya setiap akhir pekan untuk lab penting. Perintah berikut menampilkan daftar backup yang tersedia pada storage tertentu:

```bash
pvesm list local --content backup
ls -lh /var/lib/vz/dump/
```

Perintah pertama menanyakan ke Proxmox storage apa saja berkas backup yang tersedia, sedangkan perintah kedua melihat langsung berkas dump di filesystem. Kebiasaan baik adalah menguji restore ke VM baru dengan ID berbeda secara berkala, karena backup yang belum pernah diuji sering kali menyimpan kejutan yang tidak menyenangkan.

Strategi sederhana untuk homelab adalah membuat snapshot sebelum setiap eksperimen berisiko, menjadwalkan backup mingguan untuk VM penting seperti router virtual dan dokumentasi, serta menyimpan satu salinan backup di perangkat terpisah seperti USB disk atau NAS. Dengan pola ini, eksperimen tetap berani dilakukan karena selalu ada jalan kembali yang jelas.

## 8. Monitoring Dasar untuk Homelab

Monitoring di homelab tidak harus kompleks. Mulailah dari grafik bawaan Proxmox yang menampilkan CPU, memori, disk I/O, dan jaringan per node, VM, dan container. Grafik ini cukup untuk menjawab pertanyaan dasar seperti VM mana yang paling boros resource dan kapan host mulai jenuh.

Untuk pembelajaran lebih lanjut, jalankan satu container monitoring ringan yang mengumpulkan metrics dari semua VM. Stack populer seperti Prometheus dan Grafana dapat dijalankan di homelab dengan resource moderat dan memberikan pengalaman yang sangat mirip dengan monitoring production. Alternatif yang lebih ringan seperti Netdata atau Zabbix juga layak dipertimbangkan tergantung fokus belajar.

Hal minimum yang perlu dipantau adalah ruang disk host dan storage, status backup terakhir, suhu dan kesehatan disk apabila didukung, serta ketersediaan service penting seperti DNS internal dan reverse proxy. Notifikasi sederhana melalui email atau pesan instan jauh lebih baik daripada tidak ada notifikasi sama sekali, karena masalah homelab sering kali baru disadari setelah lab dibutuhkan dan ternyata sudah mati berhari-hari.

## 9. Contoh Arsitektur Homelab Sederhana

Sebagai gambaran konkret, berikut arsitektur homelab satu node yang realistis untuk pemula. Host Proxmox terhubung ke LAN rumah melalui `vmbr0`. Di atasnya berjalan satu VM firewall atau router virtual untuk belajar segmentasi, dua LXC untuk reverse proxy dan web server eksperimen, satu LXC untuk database, satu LXC untuk monitoring, dan satu VM untuk mencoba sistem operasi baru. Jaringan lab terisolasi `vmbr1` digunakan untuk komunikasi backend antara web server dan database agar menyerupai arsitektur production bertingkat.

Alur traffic sederhana dapat digambarkan sebagai client dari LAN rumah mengakses reverse proxy, reverse proxy meneruskan ke web server, web server membaca database di jaringan lab, dan monitoring mengumpulkan metrics dari semuanya. Arsitektur sekecil ini sudah mencakup virtualisasi, jaringan bertingkat, reverse proxy, database, backup, dan monitoring dalam satu kesatuan yang saling berhubungan.

Setelah arsitektur dasar stabil, pengembangan lanjutan dapat mencakup penambahan node kedua untuk belajar cluster dan migrasi, penambahan NAS untuk storage bersama dan backup terpusat, atau penambahan switch managed untuk belajar VLAN secara fisik. Setiap penambahan sebaiknya didorong oleh tujuan belajar yang jelas, bukan sekadar menambah perangkat.

## 10. Roadmap Belajar yang Sistematis

Agar homelab tidak berhenti sebagai koleksi VM yang menyala tanpa arah, roadmap berikut dapat digunakan sebagai panduan bertahap. Tahap pertama fokus pada dasar Proxmox, yaitu instalasi, pembuatan VM dan container, pemahaman bridge, serta snapshot dan backup. Tahap kedua fokus pada Linux dan jaringan, yaitu administrasi user, SSH, firewall, DNS internal, dan troubleshooting konektivitas antar VM. Tahap ketiga fokus pada layanan infrastruktur, yaitu reverse proxy, web server, database, dan monitoring. Tahap keempat fokus pada otomatisasi dan Infrastructure as Code, misalnya dengan Ansible untuk konfigurasi dan Terraform untuk provisioning. Tahap kelima fokus pada topik lanjutan seperti clustering, VLAN, VPN, dan replikasi.

Dokumentasikan setiap tahap seperti halnya dokumentasi production. Catat topologi jaringan, alokasi IP, kredensial yang disimpan aman, jadwal backup, dan setiap perubahan penting. Dokumentasi inilah yang membedakan homelab sebagai sarana belajar serius dengan sekadar tumpukan VM eksperimen.

## Kesimpulan

Membangun homelab dengan Proxmox adalah cara paling efektif untuk memahami infrastructure secara utuh karena semua lapisan dapat disentuh langsung, mulai dari virtual machine dan container, storage, jaringan bridge, perencanaan resource, backup, hingga monitoring. Mulailah dari satu node sederhana, campurkan VM dan LXC sesuai kebutuhan, isolasikan jaringan lab untuk eksperimen aman, dan biasakan backup serta dokumentasi sejak awal. Dengan roadmap yang sistematis, homelab akan berkembang dari sekadar tempat mencoba menjadi fondasi keterampilan System Engineer yang kokoh dan portofolio yang meyakinkan.

