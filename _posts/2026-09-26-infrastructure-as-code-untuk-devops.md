---
layout: post
title: "Infrastructure as Code: Kenapa Automasi Infrastruktur Penting untuk DevOps"
date: 2026-09-26 13:29:00 +0000
description: "Memahami konsep Infrastructure as Code dan bagaimana automation membantu membuat infrastructure lebih konsisten, repeatable, dan mudah dikelola."
categories: []
tags: []
---

# Infrastructure as Code: Kenapa Automasi Infrastruktur Penting untuk DevOps

Pengelolaan infrastruktur secara manual masih banyak ditemui di berbagai organisasi. Engineer login ke server melalui SSH, menginstalasi package satu per satu, mengedit file konfigurasi langsung di server, lalu mendokumentasikan perubahan secara terpisah jika sempat. Pendekatan ini mungkin masih bisa berjalan untuk satu atau dua server, tetapi akan cepat menjadi masalah ketika jumlah server bertambah, environment semakin beragam, dan kebutuhan deployment semakin cepat.

Infrastructure as Code atau IaC adalah praktik mengelola dan memprovisioning infrastruktur melalui file definisi yang dapat dibaca mesin, disimpan dalam version control, dan dieksekusi secara otomatis. Artikel ini membahas apa itu IaC, masalah yang ditimbulkannya jika infrastruktur dikelola manual, perbedaan pendekatan deklaratif dan imperatif, konsep Terraform dengan contoh HCL, alur version control dan review, reproduksibilitas, manajemen environment, konsep state, integrasi CI/CD, serta best practices yang dapat diterapkan.

## Apa Itu Infrastructure as Code?

Infrastructure as Code berarti definisi infrastruktur ditulis sebagai kode. Server, jaringan, load balancer, database, DNS record, firewall rules, hingga konfigurasi Kubernetes dapat didefinisikan dalam file. File tersebut kemudian diproses oleh tool IaC untuk membuat, mengubah, atau menghapus resource yang sebenarnya di cloud maupun on-premise.

Sebagai contoh sederhana, alih-alih membuat virtual machine melalui klik di portal cloud, engineer menulis definisi yang menyatakan bahwa dibutuhkan satu virtual machine dengan spesifikasi tertentu, image tertentu, dan network tertentu. Tool IaC membaca definisi tersebut dan memanggil API cloud untuk mewujudkannya. Jika definisi diubah, tool akan menyesuaikan infrastruktur agar sesuai dengan definisi baru.

Manfaat utama pendekatan ini adalah konsistensi, transparansi, dan otomatisasi. Setiap perubahan tercatat, dapat direview, dapat diuji, dan dapat diulang dengan hasil yang sama. Infrastruktur tidak lagi bergantung pada ingatan satu orang atau catatan manual yang mudah basi.

## Masalah Infrastruktur Manual

Infrastruktur yang dikelola manual cenderung menimbulkan beberapa masalah klasik. Masalah pertama adalah configuration drift, yaitu kondisi di mana server yang seharusnya identik ternyata memiliki konfigurasi berbeda karena perubahan manual yang tidak tercatat. Server A sudah di-patch, server B belum. Server A menggunakan versi library baru, server B masih versi lama. Perbedaan kecil ini sering menjadi sumber bug yang sulit direproduksi.

Masalah kedua adalah proses yang lambat dan rawan kesalahan. Provisioning environment baru untuk testing atau staging bisa memakan waktu berhari-hari karena harus menunggu antrian, mengikuti runbook manual, dan melakukan verifikasi satu per satu. Setiap langkah manual membuka peluang human error, misalnya salah mengetik IP address, lupa membuka firewall port, atau salah memilih versi package.

Masalah ketiga adalah kurangnya audit trail. Ketika terjadi insiden, sulit menjawab pertanyaan sederhana seperti siapa yang mengubah konfigurasi, kapan perubahan dilakukan, dan apa alasan perubahannya. Tanpa riwayat yang jelas, rollback menjadi berisiko karena tidak ada kepastian tentang kondisi terakhir yang diketahui baik.

Masalah keempat adalah ketergantungan pada individu tertentu. Jika hanya satu engineer yang tahu cara memprovisioning database cluster atau mengonfigurasi load balancer, organisasi memiliki single point of failure dari sisi pengetahuan. Ketika orang tersebut cuti atau pindah, tim akan kesulitan.

IaC menjawab semua masalah tersebut dengan menjadikan file definisi sebagai sumber kebenaran tunggal yang dapat dibaca semua orang, diuji otomatis, dan dieksekusi ulang kapan saja.

## Deklaratif vs Imperatif

Dalam dunia IaC, terdapat dua paradigma utama: deklaratif dan imperatif. Pemahaman perbedaan ini membantu memilih tool yang tepat.

Pendekatan deklaratif berfokus pada kondisi akhir yang diinginkan atau desired state. Engineer mendefinisikan apa yang seharusnya ada, bukan langkah demi langkah cara membuatnya. Contohnya adalah menyatakan bahwa dibutuhkan tiga instance web server dengan image tertentu dan security group tertentu. Tool akan membandingkan kondisi saat ini dengan kondisi yang diinginkan, lalu menentukan sendiri tindakan yang diperlukan, apakah membuat resource baru, mengubah, atau menghapus.

Pendekatan imperatif berfokus pada urutan langkah atau perintah yang harus dijalankan. Engineer mendefinisikan bagaimana mencapai kondisi tersebut, misalnya jalankan perintah instalasi package, lalu edit file konfigurasi, lalu restart service. Contoh klasik adalah script Bash atau Ansible playbook yang bersifat prosedural, meskipun Ansible juga mendukung pola deklaratif untuk banyak modulnya.

Masing-masing memiliki kelebihan. Pendekatan deklaratif umumnya lebih mudah menjaga idempotency, yaitu sifat di mana eksekusi berulang menghasilkan hasil yang sama tanpa efek samping tambahan. Pendekatan imperatif memberi kontrol lebih detail terhadap urutan eksekusi dan cocok untuk tugas konfigurasi yang kompleks. Dalam praktik modern, Terraform dan OpenTofu mewakili pendekatan deklaratif untuk provisioning, sedangkan Ansible sering digunakan untuk configuration management dengan gaya yang lebih prosedural.

## Konsep Terraform dan Contoh HCL

Terraform adalah salah satu tool IaC paling populer untuk memprovisioning infrastruktur di berbagai cloud provider. Terraform menggunakan bahasa HashiCorp Configuration Language atau HCL yang dirancang agar mudah dibaca manusia sekaligus cukup ekspresif untuk kebutuhan infrastruktur.

Konsep dasar Terraform terdiri dari provider, resource, variable, output, dan state. Provider adalah plugin yang menghubungkan Terraform ke platform tertentu seperti AWS, Google Cloud, Azure, atau Proxmox. Resource adalah unit infrastruktur yang dikelola, misalnya virtual machine, VPC, atau DNS record. Variable memungkinkan parameterisasi agar kode dapat digunakan ulang. Output mengekspor nilai penting seperti IP address setelah provisioning selesai.

Berikut contoh definisi sederhana untuk membuat virtual machine dan security group:

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "Region AWS tempat resource dibuat"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Nama environment seperti staging atau production"
  type        = string
  default     = "staging"
}

resource "aws_security_group" "web" {
  name        = "web-${var.environment}"
  description = "Security group untuk web server"

  ingress {
    description = "HTTP dari internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS dari internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Akses keluar untuk update package"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_instance" "web" {
  count         = 2
  ami           = "ami-0abcdef1234567890"
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.web.id]

  tags = {
    Name        = "web-${var.environment}-${count.index + 1}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

output "web_public_ips" {
  description = "IP publik dari web server"
  value       = aws_instance.web[*].public_ip
}
```

Setiap blok memiliki peran yang jelas. Blok `terraform` mengunci versi Terraform dan provider agar hasil konsisten antar mesin. Blok `provider` menentukan region cloud yang digunakan. Blok `variable` membuat kode fleksibel karena environment dapat diubah tanpa mengedit resource. Blok `resource` mendefinisikan infrastruktur yang diinginkan, dalam contoh ini satu security group dan dua instance. Blok `output` menampilkan IP publik setelah provisioning agar mudah digunakan untuk langkah berikutnya.

Alur kerja Terraform umumnya terdiri dari empat perintah utama:

```bash
# Menginisialisasi working directory dan mengunduh provider
terraform init

# Memformat kode agar konsisten
terraform fmt -recursive

# Memvalidasi sintaks dan melihat rencana perubahan
terraform validate
terraform plan -out=tfplan

# Menerapkan perubahan setelah rencana direview
terraform apply tfplan
```

Perintah `init` menyiapkan backend dan mengunduh provider yang dibutuhkan. Perintah `fmt` merapikan format kode secara otomatis. Perintah `validate` memeriksa kesalahan sintaks tanpa menyentuh infrastruktur. Perintah `plan` menunjukkan perubahan yang akan dilakukan, apakah membuat, mengubah, atau menghapus resource. Perintah `apply` mengeksekusi rencana tersebut. Pemisahan `plan` dan `apply` sangat penting karena memberi kesempatan untuk review sebelum perubahan nyata dilakukan.

## Version Control dan Review Workflow

Salah satu keuntungan terbesar IaC adalah infrastruktur dapat diperlakukan seperti kode aplikasi. File Terraform disimpan di Git, setiap perubahan dilakukan melalui branch dan pull request, lalu direview oleh engineer lain sebelum di-merge.

Contoh struktur repository yang umum digunakan adalah sebagai berikut:

```text
infra/
├── modules/
│   ├── network/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── webserver/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── production/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
└── README.md
```

Struktur tersebut memisahkan kode reusable di folder `modules` dari konfigurasi spesifik environment di folder `environments`. File `terraform.tfvars` berisi nilai variable yang berbeda untuk staging dan production. File `backend.tf` menentukan lokasi penyimpanan state. File `README.md` menjelaskan cara penggunaan repository.

Alur review yang baik mencakup pengecekan otomatis dan manual. Pengecekan otomatis dapat berupa `terraform fmt --check`, `terraform validate`, `tflint`, dan `terraform plan` yang hasilnya ditempel di pull request. Reviewer manusia fokus pada hal yang tidak bisa ditangkap tool otomatis, misalnya apakah instance type sudah sesuai kebutuhan, apakah security group terlalu permisif, dan apakah perubahan akan menyebabkan downtime.

## Reproduksibilitas dan Manajemen Environment

Reproduksibilitas berarti environment baru dapat dibuat dengan hasil yang sama dari definisi yang sama. Hal ini sangat berguna untuk kebutuhan staging, testing, disaster recovery, dan penambahan region baru. Jika production didefinisikan sebagai kode, membuat environment staging yang mirip menjadi jauh lebih mudah karena tinggal menggunakan modul yang sama dengan variable berbeda.

Contoh file variable untuk staging dan production dapat menunjukkan perbedaan yang terkontrol:

```hcl
# environments/staging/terraform.tfvars
environment   = "staging"
instance_type = "t3.micro"
instance_count = 1
enable_backup  = false
```

```hcl
# environments/production/terraform.tfvars
environment   = "production"
instance_type = "t3.medium"
instance_count = 3
enable_backup  = true
```

Dengan pendekatan ini, perbedaan antar environment menjadi eksplisit dan terdokumentasi. Tidak ada lagi perbedaan misterius karena konfigurasi manual. Jika staging menggunakan satu instance kecil tanpa backup dan production menggunakan tiga instance lebih besar dengan backup, semua tercatat jelas di file.

Untuk konfigurasi di dalam server seperti instalasi Nginx atau setting sysctl, IaC provisioning biasanya dikombinasikan dengan configuration management seperti Ansible atau cloud-init. Terraform membuat servernya, sedangkan Ansible atau cloud-init mengonfigurasi isi di dalamnya. Pemisahan ini membuat tanggung jawab lebih jelas.

## Memahami Konsep State

State adalah file yang menyimpan pemetaan antara definisi kode dan resource nyata yang sudah dibuat. Terraform menggunakan state untuk mengetahui resource mana yang sudah ada, atribut apa yang dimilikinya, dan perubahan apa yang diperlukan agar sesuai definisi terbaru.

Contoh perintah untuk memeriksa state adalah sebagai berikut:

```bash
# Melihat daftar resource yang dikelola
terraform state list

# Menampilkan detail salah satu resource
terraform state show aws_instance.web[0]

# Memindahkan resource tanpa menghapus infrastruktur nyata
terraform state mv aws_instance.old aws_instance.new
```

Perintah `state list` menampilkan semua resource dalam state. Perintah `state show` menampilkan atribut detail seperti ID instance dan IP address. Perintah `state mv` mengubah nama resource di state tanpa menghapus resource nyata, yang berguna saat refactoring kode.

State tidak boleh disimpan secara lokal untuk kerja tim karena akan menimbulkan konflik dan risiko kehilangan data. Praktik yang umum adalah menyimpan state di remote backend seperti S3 dengan DynamoDB untuk locking, Google Cloud Storage, atau Terraform Cloud. Contoh konfigurasi backend S3 adalah sebagai berikut:

```hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "webapp/production.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

Konfigurasi tersebut menyimpan state di bucket S3 dengan enkripsi aktif dan menggunakan DynamoDB untuk mencegah dua orang menerapkan perubahan secara bersamaan. State berisi informasi sensitif, sehingga akses ke bucket harus dibatasi dan versioning sebaiknya diaktifkan agar state yang rusak dapat dikembalikan.

## Integrasi dengan CI/CD

IaC akan jauh lebih powerful ketika diintegrasikan ke pipeline CI/CD. Setiap pull request secara otomatis menjalankan validasi dan plan, sehingga reviewer dapat melihat dampak perubahan tanpa menjalankannya secara manual. Setelah merge ke branch utama, pipeline dapat menjalankan apply secara otomatis untuk environment staging, sedangkan production membutuhkan persetujuan manual.

Contoh pipeline GitHub Actions yang sederhana adalah sebagai berikut:

```yaml
name: terraform

on:
  pull_request:
    paths:
      - "infra/**"
  push:
    branches:
      - main
    paths:
      - "infra/**"

jobs:
  plan:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"
      - run: terraform fmt --check --recursive
        working-directory: infra/environments/staging
      - run: terraform init
        working-directory: infra/environments/staging
      - run: terraform validate
        working-directory: infra/environments/staging
      - run: terraform plan -no-color
        working-directory: infra/environments/staging

  apply-staging:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: []
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
        working-directory: infra/environments/staging
      - run: terraform apply -auto-approve
        working-directory: infra/environments/staging
```

Pipeline di atas memiliki dua job. Job `plan` berjalan pada setiap pull request untuk validasi dan menampilkan rencana perubahan. Job `apply-staging` berjalan setelah merge ke main dan menerapkan perubahan ke staging. Setiap bagian memiliki penjelasan langsung di struktur file sehingga mudah dipahami. Untuk production, praktik yang aman adalah menambahkan environment protection rule yang membutuhkan approval manual.

## Troubleshooting Umum

Masalah umum pertama adalah drift antara kode dan kondisi nyata karena ada perubahan manual di console cloud. Solusinya adalah menjalankan `terraform plan` secara berkala untuk mendeteksi drift, membatasi akses manual ke console, dan mengembalikan perubahan manual ke dalam kode. Beberapa tim menjalankan drift detection terjadwal setiap malam dan mengirim hasilnya ke channel chat.

Masalah kedua adalah locked state ketika proses apply sebelumnya gagal atau dibatalkan. Gejalanya adalah pesan error bahwa state sedang dikunci. Solusinya adalah memastikan tidak ada proses lain yang berjalan, lalu melepas kunci secara eksplisit jika memang sudah aman. Perintah berikut menunjukkan cara memeriksa dan melepas kunci dengan hati-hati:

```bash
# Melihat workspace dan status saat ini
terraform workspace show
terraform state list

# Melepas kunci hanya jika dipastikan tidak ada proses lain
terraform force-unlock <LOCK_ID>
```

Perintah `workspace show` memastikan engineer berada di workspace yang benar. Perintah `force-unlock` harus digunakan dengan sangat hati-hati dan hanya setelah dikonfirmasi tidak ada pipeline lain yang sedang berjalan.

Masalah ketiga adalah perubahan yang tidak disengaja menghapus resource penting seperti database. Pencegahannya adalah menggunakan lifecycle rule `prevent_destroy` untuk resource kritis dan selalu membaca output `plan` dengan teliti sebelum apply. Contoh proteksi adalah sebagai berikut:

```hcl
resource "aws_db_instance" "main" {
  identifier        = "prod-db"
  engine            = "postgres"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  lifecycle {
    prevent_destroy = true
  }
}
```

Blok `lifecycle` dengan `prevent_destroy` membuat Terraform menolak apply yang akan menghapus database, sehingga kecelakaan dapat dicegah.

## Best Practices

Beberapa praktik yang terbukti membantu dalam jangka panjang antara lain memecah kode menjadi modul kecil yang fokus pada satu tanggung jawab, menggunakan remote state dengan locking dan enkripsi, memisahkan state per environment dan per komponen agar blast radius kecil, tidak menyimpan secret langsung di file Terraform melainkan menggunakan secret manager, mengunci versi provider, menjalankan validasi otomatis di setiap pull request, dan mendokumentasikan cara penggunaan modul di README.

Selain itu, penting untuk menjaga agar perubahan infrastruktur dilakukan melalui kode, bukan melalui console. Jika ada keadaan darurat yang memaksa perubahan manual, catat dan kembalikan ke kode sesegera mungkin agar tidak terjadi drift permanen.

## Kesimpulan

Infrastructure as Code mengubah infrastruktur dari pekerjaan manual yang rapuh menjadi sistem yang konsisten, teraudit, dan dapat diulang. Dengan memahami perbedaan deklaratif dan imperatif, menguasai konsep dasar Terraform seperti provider, resource, variable, output, dan state, serta menerapkan alur version control, review, dan CI/CD yang disiplin, tim dapat mengelola infrastruktur dengan lebih percaya diri. Memang ada kurva belajar di awal, terutama dalam memahami state dan merancang struktur modul, tetapi investasi tersebut terbayar ketika provisioning environment baru hanya membutuhkan hitungan menit, insiden dapat ditelusuri melalui riwayat Git, dan rollback dapat dilakukan dengan aman. Automasi infrastruktur bukan sekadar tren DevOps, melainkan fondasi untuk skala, kecepatan, dan keandalan operasional.

