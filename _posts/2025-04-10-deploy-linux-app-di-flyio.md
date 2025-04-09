---
layout: post
title:  "Deploy Linux App di Fly.io"
date:   2025-04-10 10:00:00 +0700
categories: [DevOps, Fly.io, Linux]
---

Fly.io adalah platform cloud yang memungkinkan kamu menjalankan aplikasi di edge (dekat dengan user).  
Dalam panduan ini, kita akan deploy Linux App berbasis Node.js & PHP ke Fly.io dengan langkah sederhana.

### Langkah-langkah:

1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

2. Buat `fly.toml` dan jalankan:
```bash
fly launch
```

3. Deploy dengan:
```bash
fly deploy
```

🎉 Done! Aplikasimu sekarang live di edge.