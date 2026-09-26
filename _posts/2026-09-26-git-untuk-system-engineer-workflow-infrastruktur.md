---
layout: post
title: "Git untuk System Engineer: Workflow yang Efisien untuk Infrastruktur"
date: 2026-09-26 13:28:56 +0000
description: "Menggunakan Git bukan hanya untuk source code, tetapi juga untuk configuration, automation script, infrastructure code, dan dokumentasi."
categories: []
tags: []
---

# Git untuk System Engineer: Workflow yang Efisien untuk Infrastruktur

Git sering dianggap sebagai tool milik software developer untuk mengelola source code aplikasi. Padahal bagi system engineer, Git sama pentingnya untuk mengelola konfigurasi server, script automasi, definisi infrastruktur, dan dokumentasi operasional. Setiap perubahan infrastruktur yang tidak tercatat adalah calon insiden di masa depan karena sulit dilacak, sulit direview, dan sulit dikembalikan.

Artikel ini membahas mengapa Git relevan untuk pekerjaan infrastruktur, bagaimana menyusun struktur repository yang rapi, strategi branch, standar commit, alur pull request dan code review, pengelolaan konfigurasi, manajemen secret, penggunaan gitignore, pemanfaatan history untuk rollback, serta kolaborasi tim yang efisien.

## Kenapa Git untuk Infrastruktur, Bukan Hanya Source Code?

Infrastruktur modern pada dasarnya adalah kumpulan file teks. Konfigurasi Nginx, systemd unit, playbook Ansible, definisi Terraform, script Bash, file Docker, dan manifest Kubernetes semuanya berbentuk teks yang sangat cocok dikelola Git. Dengan menyimpan semua itu di Git, tim mendapatkan tiga manfaat utama: riwayat perubahan yang lengkap, kemampuan kolaborasi yang aman, dan fondasi untuk automasi.

Riwayat perubahan menjawab pertanyaan kapan, siapa, dan mengapa sebuah konfigurasi berubah. Ketika terjadi insiden setelah perubahan firewall, engineer tidak perlu menebak-nebak. Cukup buka log Git, lihat diff yang masuk terakhir, dan pahami konteksnya dari pesan commit dan diskusi pull request.

Kolaborasi yang aman berarti tidak ada lagi pola edit langsung di server production oleh banyak orang tanpa koordinasi. Setiap perubahan diusulkan melalui branch, direview, diuji otomatis, lalu di-merge. Pola ini mengurangi konflik dan membuat setiap engineer memiliki visibilitas yang sama.

Fondasi automasi berarti repository Git menjadi sumber kebenaran tunggal yang dapat dihubungkan ke pipeline CI/CD. Setiap merge dapat memicu validasi, testing, bahkan deployment otomatis ke staging. Tanpa Git, automasi semacam ini sulit dibangun dengan rapi.

## Struktur Repository untuk Infra dan Config

Struktur yang baik membuat repository mudah dinavigasi oleh engineer baru maupun lama. Tidak ada satu struktur yang cocok untuk semua organisasi, tetapi pola berikut banyak digunakan dan terbukti mudah dipelihara.

```text
infra/
├── ansible/
│   ├── inventories/
│   │   ├── staging/
│   │   └── production/
│   ├── playbooks/
│   │   ├── base.yml
│   │   ├── web.yml
│   │   └── db.yml
│   ├── roles/
│   └── ansible.cfg
├── terraform/
│   ├── modules/
│   └── environments/
│       ├── staging/
│       └── production/
├── scripts/
│   ├── backup.sh
│   ├── cleanup.sh
│   └── disk-check.sh
├── docs/
│   ├── runbook/
│   ├── network-diagram.md
│   └── onboarding.md
└── README.md
```

Setiap direktori memiliki tanggung jawab yang jelas. Folder `ansible` berisi inventory, playbook, dan roles untuk configuration management. Folder `terraform` berisi modul reusable dan konfigurasi per environment. Folder `scripts` berisi script operasional yang sudah direview. Folder `docs` berisi runbook dan dokumentasi arsitektur. File `README.md` di root menjelaskan gambaran umum, cara setup, dan alur kontribusi.

Untuk organisasi yang lebih besar, ada dua pendekatan: monorepo dan multi-repo. Monorepo menyimpan semua kode infrastruktur dalam satu repository sehingga pencarian dan standardisasi lebih mudah, tetapi membutuhkan disiplin ownership dan pipeline yang baik. Multi-repo memisahkan per tim atau per layanan sehingga akses dapat dibatasi lebih granular, tetapi membutuhkan usaha lebih untuk menjaga konsistensi. Tim kecil hingga menengah umumnya lebih cocok memulai dengan monorepo yang terstruktur rapi.

Contoh README minimal yang membantu engineer baru:

```markdown
# Infra Repository

Repository ini berisi kode Terraform, Ansible, dan script operasional.

## Struktur
- `terraform/` untuk provisioning cloud
- `ansible/` untuk konfigurasi server
- `scripts/` untuk automasi operasional
- `docs/` untuk runbook dan diagram

## Alur Kontribusi
1. Buat branch dari `main`
2. Lakukan perubahan dan uji di staging
3. Buat pull request dan minta review
4. Merge setelah CI hijau dan disetujui reviewer
```

## Strategi Branch yang Praktis

Branch memungkinkan eksperimen tanpa mengganggu kondisi stabil. Untuk tim infrastruktur, strategi yang sederhana dan disiplin lebih baik daripada strategi yang kompleks tetapi tidak dipatuhi.

Pola umum yang mudah diterapkan adalah menggunakan `main` sebagai branch stabil yang selalu merepresentasikan kondisi production atau kondisi terakhir yang siap deploy. Setiap pekerjaan dilakukan di feature branch dengan nama deskriptif, misalnya `feat/add-redis-staging`, `fix/nginx-timeout`, atau `chore/update-backup-retention`. Setelah selesai dan lolos review, branch di-merge kembali ke `main`.

Perintah dasar yang sering digunakan:

```bash
# Memastikan posisi di main terbaru sebelum membuat branch
git checkout main
git pull origin main

# Membuat branch baru untuk perubahan Nginx
git checkout -b fix/nginx-client-timeout

# Melihat status dan branch aktif
git status
git branch --show-current
```

Perintah `checkout -b` membuat branch baru sekaligus berpindah ke branch tersebut. Perintah `status` menunjukkan file yang berubah dan belum di-commit. Perintah `branch --show-current` menampilkan nama branch aktif agar engineer tidak salah melakukan commit di branch yang keliru.

Untuk perubahan berisiko tinggi, gunakan branch environment seperti `staging` dan `production` dengan alur promosi bertahap. Perubahan di-merge dulu ke staging, diuji di sana, lalu dipromosikan ke production melalui pull request terpisah. Pola ini memberi jeda verifikasi yang penting untuk infrastruktur kritis.

Aturan proteksi branch sebaiknya diaktifkan di GitHub atau GitLab. Contoh aturan yang masuk akal untuk branch `main` adalah mewajibkan pull request, mewajibkan minimal satu approval reviewer, mewajibkan status CI hijau, dan melarang push langsung. Aturan ini mencegah perubahan terburu-buru masuk tanpa pemeriksaan.

## Standar Commit yang Jelas

Pesan commit yang baik adalah dokumentasi gratis untuk masa depan. Ketika menyelidiki insiden enam bulan dari sekarang, pesan commit yang jelas akan sangat membantu memahami alasan perubahan. Format yang populer adalah conventional commits dengan prefix seperti `feat`, `fix`, `chore`, `docs`, dan `refactor`.

Contoh pesan commit yang baik dan buruk:

```bash
# Buruk: tidak menjelaskan apa dan mengapa
git commit -m "update config"

# Baik: jelas apa yang berubah dan konteksnya
git commit -m "fix(nginx): naikkan client_max_body_size ke 20m untuk upload rapor

Upload rapor di atas 8MB gagal dengan error 413.
Diverifikasi di staging sebelum masuk production."
```

Commit yang baik menjelaskan apa yang berubah, mengapa perubahan diperlukan, dan dampaknya. Badan commit dapat berisi konteks tambahan seperti error yang diperbaiki, hasil pengujian, atau referensi tiket. Hindari commit raksasa yang mencampur banyak perubahan tidak terkait karena akan sulit direview dan sulit di-rollback. Lebih baik membuat beberapa commit kecil yang fokus, masing-masing dengan satu tujuan jelas.

Perintah berikut membantu menjaga riwayat tetap rapi sebelum pull request:

```bash
# Melihat riwayat commit yang akan di-review
git log --oneline main..HEAD

# Melihat diff ringkas per file
git diff --stat main..HEAD

# Memeriksa diff detail sebelum commit
git diff
git add ansible/playbooks/web.yml
git commit -m "feat(ansible): tambah role redis untuk cache sesi"
```

Perintah `log --oneline` menampilkan daftar commit secara ringkas. Perintah `diff --stat` menunjukkan file mana saja yang berubah beserta jumlah barisnya. Kebiasaan memeriksa diff sebelum commit mencegah file yang tidak disengaja ikut ter-commit.

## Pull Request dan Code Review

Pull request adalah titik kontrol kualitas terpenting dalam workflow Git. Untuk perubahan infrastruktur, review yang baik tidak hanya memeriksa sintaks, tetapi juga dampak operasional: apakah perubahan menyebabkan downtime, apakah perlu maintenance window, apakah ada urutan apply yang khusus, dan bagaimana cara rollback jika gagal.

Template pull request membantu author memberi konteks lengkap. Contoh template sederhana:

```markdown
## Ringkasan
Menambahkan Redis sebagai cache sesi di staging.

## Perubahan
- Menambah role Ansible `redis`
- Membuka port 6379 hanya untuk subnet aplikasi
- Menambah monitoring memory Redis

## Dampak
- Tidak ada downtime, hanya penambahan service baru
- Perlu apply playbook `web.yml` ke staging setelah merge

## Pengujian
- [ ] `ansible-lint` lolos
- [ ] Diuji di staging, service aktif dan dapat diakses aplikasi
- [ ] Rollback: hapus role dari playbook dan jalankan ulang

## Checklist
- [ ] Tidak ada secret yang ter-commit
- [ ] Dokumentasi runbook diperbarui
```

Reviewer dapat fokus pada hal substantif karena konteks sudah tersedia. Untuk perubahan Terraform, hasil `terraform plan` sebaiknya ditempel otomatis oleh CI ke pull request sehingga reviewer dapat melihat resource apa yang akan dibuat, diubah, atau dihapus tanpa menjalankannya manual.

Contoh pipeline CI untuk validasi Ansible dan shell script:

```yaml
name: infra-ci
on:
  pull_request:
    paths:
      - "ansible/**"
      - "scripts/**"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint shell scripts
        run: |
          sudo apt-get update && sudo apt-get install -y shellcheck
          shellcheck scripts/*.sh
      - name: Lint ansible
        run: |
          pip install ansible-lint
          ansible-lint ansible/playbooks/*.yml
      - name: Syntax check playbook
        run: |
          ansible-playbook --syntax-check ansible/playbooks/web.yml
```

Setiap langkah memiliki fungsi yang jelas. Langkah `shellcheck` memeriksa kesalahan umum Bash seperti variable tanpa kutip atau penggunaan perintah yang tidak portable. Langkah `ansible-lint` memeriksa best practices Ansible. Langkah `syntax-check` memastikan playbook dapat diparsing tanpa error. Jika salah satu gagal, pull request tidak boleh di-merge.

## Configuration Management dengan Git

Menyimpan konfigurasi di Git saja tidak cukup. Konfigurasi harus diterapkan ke server melalui proses yang terkontrol dan dapat diulang. Inilah peran configuration management seperti Ansible, yang membaca playbook dari Git lalu menerapkannya ke inventory yang ditargetkan.

Contoh playbook sederhana untuk memastikan Nginx terinstal dan berjalan:

```yaml
---
- name: Konfigurasi web server
  hosts: web
  become: true
  roles:
    - nginx
```

Playbook di atas mendefinisikan target host `web`, menggunakan privilege escalation melalui `become: true`, dan memanggil role `nginx`. Role tersebut berisi task detail untuk instalasi package, penempatan file konfigurasi dari template, dan restart service jika konfigurasi berubah.

Perintah umum untuk menjalankan dan memeriksa playbook:

```bash
# Mengecek sintaks sebelum dijalankan
ansible-playbook --syntax-check ansible/playbooks/web.yml

# Menjalankan dalam mode dry-run untuk melihat perubahan tanpa eksekusi
ansible-playbook -i ansible/inventories/staging --check --diff ansible/playbooks/web.yml

# Menjalankan sungguhan ke staging
ansible-playbook -i ansible/inventories/staging ansible/playbooks/web.yml
```

Opsi `--check` menjalankan playbook dalam mode simulasi sehingga engineer dapat melihat apa yang akan berubah tanpa benar-benar mengubah server. Opsi `--diff` menampilkan perbedaan file konfigurasi secara detail. Kombinasi keduanya sangat berguna untuk review sebelum eksekusi ke production.

## Secrets Management: Apa yang Tidak Boleh di-Commit

Aturan paling penting dalam workflow Git untuk infrastruktur adalah tidak pernah menyimpan secret dalam bentuk plain text di repository. Password database, API key, token, private key, dan kredensial cloud yang ter-commit akan selamanya tercatat di history Git meskipun file-nya dihapus kemudian. Sekali bocor ke remote, secret harus dianggap sudah terkompromi dan harus dirotasi.

Contoh file `.gitignore` untuk mencegah file sensitif ikut ter-commit:

```gitignore
# Environment dan secret lokal
.env
*.pem
*.key
*.p12
secrets/
vault-password.txt

# State Terraform lokal dan file sensitif
*.tfstate
*.tfstate.backup
.terraform/
*.tfvars
!example.tfvars

# File sistem dan editor
.DS_Store
*.swp
*~
.idea/
.vscode/
```

Setiap baris memiliki tujuan. Pola `.env` mengabaikan file environment lokal. Pola `*.pem` dan `*.key` mengabaikan private key. Pola `*.tfstate` mengabaikan state Terraform yang berisi data sensitif. Pola editor mengabaikan file sementara yang tidak relevan.

Untuk mengelola secret dengan aman, gunakan pendekatan referensi secret. Artinya, kode di Git hanya berisi referensi atau placeholder, sedangkan nilai asli disimpan di secret manager seperti HashiCorp Vault, AWS Secrets Manager, atau SOPS dengan enkripsi. Contoh penggunaan variable environment sebagai referensi:

```yaml
# Contoh task Ansible yang membaca password dari environment, bukan dari Git
- name: Buat user database aplikasi
  community.postgresql.postgresql_user:
    name: myapp
    password: "{{ lookup('env', 'DB_APP_PASSWORD') }}"
    priv: "myapp_db.*:ALL"
```

Task tersebut mengambil password dari variable environment `DB_APP_PASSWORD` saat runtime, sehingga nilai asli tidak pernah tertulis di repository. Pola serupa dapat diterapkan di Terraform menggunakan variable yang diisi dari secret manager atau CI/CD secrets.

Jika secret telanjur ter-commit, langkah yang benar adalah segera rotasi secret tersebut, hapus dari history menggunakan tool seperti `git filter-repo` atau BFG, lalu push ulang dengan koordinasi tim karena history akan berubah. Pembersihan history saja tanpa rotasi tidak cukup karena secret mungkin sudah tersalin ke clone lain.

## Version History dan Rollback

Salah satu alasan terkuat menggunakan Git adalah kemampuan kembali ke kondisi sebelumnya dengan percaya diri. Ketika perubahan konfigurasi menyebabkan masalah, engineer dapat melihat history, membandingkan diff, dan mengembalikan ke versi terakhir yang diketahui baik.

Perintah yang paling sering digunakan untuk investigasi history:

```bash
# Melihat riwayat file konfigurasi tertentu
git log --oneline --follow -- ansible/playbooks/web.yml

# Melihat siapa mengubah baris tertentu dan kapan
git blame ansible/playbooks/web.yml

# Membandingkan dua versi untuk memahami perubahan
git diff v1.4.0..v1.5.0 -- terraform/

# Melihat isi file pada commit tertentu tanpa checkout
git show abc1234:ansible/playbooks/web.yml
```

Perintah `log --follow` melacak history file meskipun pernah di-rename. Perintah `blame` menunjukkan commit terakhir yang menyentuh setiap baris, berguna untuk menemukan kapan nilai timeout diubah. Perintah `diff` antar tag menunjukkan ringkasan perubahan antar rilis. Perintah `show` menampilkan isi file pada commit tertentu tanpa mengganggu working directory.

Untuk rollback, ada dua pendekatan. Pendekatan `revert` membuat commit baru yang membatalkan perubahan sebelumnya dan aman untuk branch yang sudah shared. Pendekatan `reset` menghapus commit dari history dan hanya cocok untuk branch lokal yang belum di-push. Untuk infrastruktur production, selalu gunakan `revert` agar history tetap utuh dan audit trail terjaga.

```bash
# Rollback aman dengan revert, membuat commit baru
git revert abc1234

# Melihat tag rilis infrastruktur
git tag --list "infra-v*"

# Membuat tag untuk versi yang stabil
git tag -a infra-v1.5.0 -m "Rilis infra stabil minggu ini"
git push origin infra-v1.5.0
```

Pemberian tag pada kondisi stabil memudahkan penandaan versi yang siap deploy ulang, misalnya untuk membangun ulang environment disaster recovery dari titik yang diketahui baik.

## Kolaborasi Tim yang Efisien

Git membuat kolaborasi lebih transparan jika dilengkapi konvensi yang disepakati. Tentukan code owner per direktori agar review otomatis diminta ke orang yang tepat. Misalnya, perubahan di folder network harus direview engineer network, sedangkan perubahan database harus direview DBA atau engineer senior.

Contoh file `CODEOWNERS`:

```text
# Format: pola-path  owner
/terraform/          @team-platform
/ansible/roles/db/   @dba-team @senior-infra
/scripts/backup.sh   @team-platform @dba-team
/docs/               @team-platform
```

File tersebut memastikan pull request yang menyentuh path sensitif otomatis meminta review dari tim yang kompeten. Ini mengurangi risiko perubahan kritis lolos tanpa pengawasan.

Selain itu, biasakan sinkronisasi rutin dengan remote untuk menghindari konflik besar. Tarik perubahan terbaru sebelum mulai bekerja, push branch secara berkala sebagai backup, dan selesaikan konflik kecil sesegera mungkin. Untuk konflik pada file konfigurasi, jangan asal memilih salah satu sisi. Pahami makna kedua perubahan, gabungkan secara manual, lalu uji hasilnya di staging sebelum merge.

## Troubleshooting Umum

Masalah pertama adalah konflik merge pada file inventory atau variable yang sering diubah banyak orang. Solusinya adalah memecah file besar menjadi file kecil per layanan atau per environment sehingga peluang konflik berkurang. Jika konflik terjadi, gunakan `git status` untuk melihat file yang bermasalah, edit manual bagian yang ditandai, lalu tandai selesai dengan `git add` dan lanjutkan merge atau rebase.

Masalah kedua adalah commit besar yang sulit direview karena mencampur refactoring dan perubahan fungsional. Solusinya adalah memisahkan commit berdasarkan tujuan dan menjaga pull request tetap kecil. Pull request dengan 50 baris perubahan akan mendapat review lebih teliti dibanding pull request dengan 2000 baris.

Masalah ketiga adalah history tercemar file besar seperti backup atau binary. Solusinya adalah menghapus file dari history, menambahkan pola ke gitignore, dan menggunakan storage khusus seperti S3 atau artifact registry untuk file besar. Repository Git sebaiknya hanya berisi teks dan file kecil.

Masalah keempat adalah engineer lupa pull sebelum push sehingga push ditolak. Solusinya adalah menjalankan `git pull --rebase` untuk menempatkan commit lokal di atas commit remote, menyelesaikan konflik jika ada, lalu push ulang. Opsi rebase menjaga history tetap linear dan mudah dibaca dibanding merge commit yang berlebihan.

## Checklist Praktis

Sebagai panduan, berikut checklist workflow Git untuk system engineer. Pastikan semua konfigurasi, script, dan definisi infrastruktur tersimpan di Git dan tidak hanya ada di server. Pastikan branch main terproteksi dan semua perubahan melalui pull request. Pastikan pesan commit jelas dan atomic. Pastikan CI menjalankan lint dan validasi otomatis. Pastikan tidak ada secret dalam bentuk plain text di repository. Pastikan ada template pull request dengan informasi dampak dan rencana rollback. Pastikan rilis stabil diberi tag. Terakhir, pastikan runbook dan dokumentasi diperbarui bersamaan dengan perubahan kode, bukan menyusul entah kapan.

## Kesimpulan

Git bukan hanya tool version control untuk aplikasi, melainkan fondasi kerja system engineer yang modern. Dengan struktur repository yang rapi, strategi branch yang disiplin, standar commit yang jelas, review yang memperhatikan dampak operasional, manajemen secret yang aman, dan pemanfaatan history untuk rollback, pengelolaan infrastruktur menjadi lebih transparan, kolaboratif, dan siap diautomasi. Mulailah dari langkah kecil seperti memindahkan satu script operasional ke Git dengan review yang benar, lalu perluas ke konfigurasi dan definisi infrastruktur lainnya. Konsistensi dalam workflow akan jauh lebih berharga daripada kesempurnaan tool.

