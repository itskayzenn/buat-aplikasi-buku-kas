# 📒 Buku Kas Pintar (Buku Kas PRO)

> Aplikasi web pencatatan kas masuk, kas keluar, hutang piutang, dan laporan keuangan digital yang dirancang khusus untuk UMKM, pedagang, pebisnis, dan kebutuhan pribadi di Indonesia.

[![Live Demo](https://img.shields.io/badge/Demo-Online%20Live-10b981?style=for-the-badge&logo=google-chrome&logoColor=white)](https://antigravity.luch.dev/site/dc8eb6d1-f949-421c-a1d8-9b573fcb6460/2ab8994d37bdda9c4d7c0425/)
[![Offline First](https://img.shields.io/badge/Offline-First%20(LocalStorage)-blue?style=for-the-badge&logo=cachet)](https://antigravity.luch.dev/site/dc8eb6d1-f949-421c-a1d8-9b573fcb6460/2ab8994d37bdda9c4d7c0425/)
[![Responsive](https://img.shields.io/badge/Device-Mobile%20%26%20Desktop-orange?style=for-the-badge&logo=tailwindcss)](https://antigravity.luch.dev/site/dc8eb6d1-f949-421c-a1d8-9b573fcb6460/2ab8994d37bdda9c4d7c0425/)

🌐 **Live Demo Website:** [https://antigravity.luch.dev/site/dc8eb6d1-f949-421c-a1d8-9b573fcb6460/2ab8994d37bdda9c4d7c0425/](https://antigravity.luch.dev/site/dc8eb6d1-f949-421c-a1d8-9b573fcb6460/2ab8994d37bdda9c4d7c0425/)

---

## 🌟 Fitur Utama

### 1. 📊 Dashboard & Ikhtisar Keuangan Pintar
- **Saldo Kas Riil**: Dilengkapi *Privacy Mode* (ikon mata untuk menyembunyikan/menampilkan saldo).
- **Metrik Arus Kas**: Total Pemasukan, Pengeluaran, dan Selisih Arus Kas (Net Surplus/Defisit) sesuai periode.
- **Filter Periode Cepat**: Hari Ini, Kemarin, 7 Hari Terakhir, Bulan Ini, Bulan Lalu, Semua Riwayat, dan Kustom Rentang Tanggal.
- **Grafik Interaktif (Chart.js)**:
  - Grafik batang (*bar chart*) arus kas harian (Uang Masuk vs Uang Keluar).
  - Grafik donat (*donut chart*) alokasi pengeluaran per kategori.

### 2. 💸 Buku Kas Transaksi (Masuk & Keluar)
- Pencatatan transaksi kilat dengan chip nominal cepat (`+50rb`, `+100rb`, `+250rb`, `+500rb`, `+1Jt`).
- Pilihan kategori fleksibel (Penjualan, Modal, Operasional, Stok, Gaji, dll.).
- **Unggah Foto Bukti/Struk**: Simpan foto kuitansi atau nota fisik langsung di riwayat transaksi.
- Pencarian *real-time* berdasarkan catatan, nominal, atau kategori.
- Filter berdasarkan tipe transaksi, kategori, dan dompet/rekening.
- Pengelompokan transaksi otomatis per tanggal (*Hari Ini*, *Kemarin*, atau tanggal spesifik).

### 3. 🤝 Pengelolaan Hutang & Piutang (Buku Hutang)
- Catat **Piutang** (tagihan ke pelanggan) dan **Hutang** (kewajiban bayar ke supplier).
- Indikator status tagihan: *Lunas*, *Belum Lunas*, *Jatuh Tempo Hari Ini*, atau *Jatuh Tempo!* dengan penanda warna dan animasi.
- Bar persentase pelunasan otomatis.
- **Catat Cicilan / Pelunasan**: Setiap pembayaran otomatis tercatat sebagai transaksi di Buku Kas utama.
- **Kirim Pengingat WhatsApp**: Tombol 1-klik yang otomatis membuka WhatsApp dengan draf pesan tagihan sopan berbahasa Indonesia beserta rincian sisa hutang dan tanggal jatuh tempo.
- Riwayat angsuran lengkap per kontak.

### 4. 🧾 Cetak & Berbagi Struk Digital Kasir
- Desain nota kasir retro-modern dengan format kertas kasir termal.
- Tombol **Kirim ke WhatsApp**: Mengirim format nota rapi siap baca langsung ke nomor pembeli.
- Tombol **Cetak Struk**: Siap cetak langsung ke printer mini / printer thermal bluetooth kasir.

### 5. 📈 Laporan Keuangan & Ekspor
- Laporan Laba/Rugi Sederhana (Arus Kas Bersih dan rasio margin efisiensi kas usaha).
- Tabel breakdown pengeluaran dan pemasukan per kategori beserta persentase kontribusinya.
- **Cetak Laporan Keuangan Resmi (PDF/Print)**: Format dokumen formal A4 siap cetak dengan kop nama usaha, alamat, tabel ledger transaksi, dan kolom tanda tangan kasir & pemilik.
- **Ekspor CSV / Excel**: Unduh riwayat pembukuan kas dalam format CSV UTF-8 yang rapi dan kompatibel dengan Microsoft Excel atau Google Sheets.

### 6. 💳 Dompet & Rekening Multi-Kas
- Kelola kas fisik (Kas Tunai Toko), rekening bank (BCA, BRI, Mandiri, BNI, dll.), dan e-wallet QRIS (GoPay, DANA, OVO, ShopeePay).
- **Pindah Kas / Transfer Saldo**: Fitur mutasi dana antar rekening (misalnya setor tunai harian toko ke rekening Bank BCA).

### 7. 🏪 Multi-Buku Kas & Manajemen Data Offline
- Buat dan kelola lebih dari satu buku kas (misal: "Toko Sembako", "Bisnis Online", "Keuangan Rumah Tangga").
- **Cadangan Data (Backup/Restore JSON)**: Seluruh data tersimpan aman di browser via LocalStorage. Cadangan data dapat diunduh kapan saja sebagai file JSON dan dipulihkan kembali dengan 1 klik.
- Tombol **"Muat Data Demo"** untuk menguji coba fitur secara langsung dengan data realistis UMKM Indonesia.

### 8. 📱 Tampilan Responsif & Dark Mode
- Dukungan **Mode Terang & Mode Gelap** (*Dark Mode*) dengan penyimpanan preferensi otomatis.
- Navigasi responsif: Top navigation bar di desktop & Sticky Bottom Navigation bar dengan tombol aksi cepat (FAB) di smartphone.
- Efek perayaan konfeti (*confetti*) ketika hutang telah lunas atau menerima pemasukan besar.

---

## 📁 Struktur Berkas Proyek

```text
.
├── index.html          # Markup HTML utama, view navigasi, dan 10 modal interaktif
├── css/
│   └── style.css       # Gaya tampilan kustom (kertas struk thermal, print A4, scrollbar)
├── js/
│   ├── app.js          # Controller aplikasi, filter, event listener, dan logika UI
│   ├── charts.js       # Manajemen visualisasi grafik Chart.js
│   ├── components.js   # Format mata uang Rupiah, tanggal Indonesia, dan template WhatsApp
│   └── store.js        # State management, model transaksi/hutang/dompet, dan LocalStorage
└── README.md           # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan Proyek

Aplikasi ini menggunakan arsitektur **Zero-Dependency Build** (murni Client-Side HTML5, CSS3, dan Vanilla JavaScript modern):

### Opsi 1: Buka Langsung di Browser
Cukup unduh / *clone* repositori ini, lalu klik ganda berkas `index.html` pada browser favorit Anda (Google Chrome, Firefox, Safari, Edge).

### Opsi 2: Menggunakan Live Server / Local Web Server
Jika Anda menggunakan Visual Studio Code:
1. Pasang ekstensi **Live Server**.
2. Klik kanan pada `index.html` lalu pilih **Open with Live Server**.
3. Aplikasi akan terbuka di `http://127.0.0.1:5500/`.

Atau dengan perintah Python:
```bash
python3 -m http.server 8080
```
Buka browser di `http://localhost:8080`.

---

## 🛠️ Teknologi yang Digunakan

- **HTML5 & Vanilla JavaScript (ES6+)**: Logika aplikasi tanpa memerlukan framework berat.
- **Tailwind CSS (CDN)**: Styling utilitas responsif dan modern.
- **Chart.js**: Grafik visualisasi arus kas harian dan alokasi kategori.
- **Lucide Icons**: Koleksi ikon antarmuka yang bersih dan konsisten.
- **Canvas-Confetti**: Efek visual apresiasi keberhasilan pelunasan.
- **LocalStorage API**: Penyimpanan data lokal tanpa perlu database server eksternal (*Offline-First*).

---

## 🔒 Privasi & Keamanan Data

Aplikasi ini berjalan sepenuhnya di sisi klien (*client-side*). Data transaksi, buku kas, nomor telepon kontak, dan bukti foto disimpan di dalam penyimpanan peramban (*LocalStorage*) perangkat Anda dan tidak dikirimkan ke server luar mana pun.

Untuk menjaga keamanan data:
- Gunakan fitur **Unduh Cadangan JSON** secara berkala melalui menu **Pengaturan > Cadangan & Manajemen Data**.
- File cadangan JSON tersebut dapat disimpan di Google Drive atau flashdisk Anda sebagai arsip cadangan.

---

## 📄 Lisensi

Proyek ini dibuat dan didistribusikan di bawah lisensi [MIT License](LICENSE). Bebas digunakan dan dikembangkan untuk keperluan bisnis UMKM maupun personal.
