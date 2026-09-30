# 🍒 Petit Pix

Web tool untuk **mengubah ukuran**, **mengonversi format**, dan **mengompres** foto. Ubah ukuran mendukung pasfoto 2×3, 3×4, 4×6, dan ukuran kustom dengan resolusi 300 dpi. Foto diproses oleh REST API, dan halaman webnya nyaman dipakai di HP.

> Tugas PBL#2 · Mata Kuliah **RKS307** · Tema: *Document & Media Transformation Service*

## Tim

| Nama | NIM | Peran |
|---|---|---|
| Muhamad Faris Kurniawan | 4332501004 | Repository + backend: kerangka FastAPI, CORS, endpoint resize |
| Hana Rafifa Helmi | 4333501016 | 	Frontend logika: App.jsx, koneksi API, panel ubah ukuran, pratinjau, geser foto |
| Destin Olivia Rengganis | 4332501032 | Frontend UI/UX: styles.css, tampilan HP, panel konversi dan kompres |
| Alicia Agatha Nathaniela Telaumbanua | 4332501029 | Backend: endpoint convert dan compress, validasi file |
| Najib Muhammad Ikvan | 4332501019 | Dokumentasi: Swagger, README, screenshot |

### Pembagian tugas

**Muhamad Faris Kurniawan · Repository & Backend** (`backend/main.py`, repo GitHub)
- Mengelola repositori GitHub: struktur folder `backend/` dan `frontend/`, `.gitignore`, dan menggabungkan kontribusi anggota tim
- Menyiapkan kerangka FastAPI: aplikasi, konfigurasi CORS, dan endpoint `health`
- Membuat endpoint `POST /api/v1/images/resize`: ubah ukuran 300 dpi dengan mode potong dan muat semua, serta posisi potong (`fx`, `fy`)

**Hana Rafifa Helmi · Frontend (logika)** (`frontend/src/App.jsx`, `api.js`, `components/ResizePanel.jsx`, `components/Preview.jsx`)
- Membangun struktur aplikasi React dan pengelolaan state di `App.jsx`
- Menghubungkan frontend ke REST API (`fetch`, `FormData`, penanganan error dan status loading)
- Membuat panel ubah ukuran dan area pratinjau, termasuk fitur geser foto untuk mengatur bagian yang dipotong
- Menampilkan ukuran piksel, ukuran file, dan selisih dari file asli

**Destin Olivia Rengganis · Frontend (UI/UX)** (`frontend/src/styles.css`, `components/ConvertPanel.jsx`, `components/CompressPanel.jsx`)
- Merancang tampilan: palet warna ceri (maroon, butter yellow, biru cornflower), tipografi, dan nama "Petit Pix"
- Membuat tampilan yang responsif dan nyaman di HP (tombol unduh menempel di bawah, area sentuh besar)
- Membuat panel konversi format dan panel kompres, termasuk pilihan format dan slider kualitas

**Alicia Agatha Nathaniela Telaumbanua · Backend** (`backend/main.py`)
- Membuat endpoint `POST /api/v1/images/convert` (JPG, PNG, WebP) dan `POST /api/v1/images/compress` (kualitas 10 sampai 95)
- Membuat validasi file: format dicek dari isi file, batas ukuran 10 MB, penanganan foto iPhone (MPO), dan pesan error yang jelas

**Najib Muhammad Ikvan · Dokumentasi**
- Melengkapi deskripsi dan contoh pada Swagger (`/docs`)
- Menyusun dan merawat `README.md`
- Mengambil screenshot web, Swagger, dan tampilan HP (folder `docs/`)

**Bersama:** setiap anggota menguji bagiannya sendiri sebelum di-push (format JPG, PNG, WebP, foto besar, PNG transparan, foto dari HP, dan file palsu), dan deploy online (opsional) dikerjakan oleh Faris dan Alicia.

## Fitur

- **Ubah ukuran** ke ukuran cetak (cm) dengan resolusi 300 dpi
  - Mode *potong tepi* (foto memenuhi bingkai) atau *muat semua* (ditambah latar putih)
  - Foto bisa digeser dengan jari atau mouse untuk mengatur bagian yang dipotong
- **Konversi format** antara JPG, PNG, dan WebP
- **Kompres** ukuran file dengan pengaturan kualitas 10 sampai 95%
- Pratinjau hasil, ukuran piksel, ukuran file, dan selisih dari file asli
- Validasi file berdasarkan isi (bukan ekstensi), sehingga file palsu ditolak
- Tampilan responsif untuk HP

## Teknologi

| Bagian | Teknologi |
|---|---|
| Backend | Python, FastAPI, Pillow |
| Dokumentasi API | Swagger UI (otomatis dari FastAPI, di `/docs`) |
| Frontend | React + Vite |
| Database | Tidak digunakan (foto diproses di memori dan tidak disimpan) |

## Tampilan

| Web | Swagger |
|---|---|
| <img width="957" height="534" alt="image" src="https://github.com/user-attachments/assets/2c2e5c12-85e6-4015-8f04-fcb8ffd06eca" />
 | ![Swagger](docs/swagger.png) |

| Tampilan HP |
|---|
|<img width="739" height="1600" alt="image" src="https://github.com/user-attachments/assets/c996c3a3-4c13-4c64-8196-1162100bfb06" />
 |

## Arsitektur

```
Browser (React)  --  multipart/form-data  -->  FastAPI  -->  Pillow
                 <--  gambar hasil  ---------
```

Frontend mengirim foto dan pengaturan ke endpoint REST API, lalu backend memprosesnya dan mengembalikan gambar hasil.

## Endpoint

Dokumentasi interaktif tersedia di Swagger: `http://localhost:8000/docs`

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/v1/images/resize` | Ubah ukuran foto ke cm (300 dpi) |
| POST | `/api/v1/images/convert` | Konversi ke `jpeg`, `png`, atau `webp` |
| POST | `/api/v1/images/compress` | Kompres dengan `quality` 10 sampai 95 |
| GET | `/health` | Cek status server |

Semua endpoint gambar menerima `multipart/form-data` dan mengembalikan file gambar.

**Contoh penggunaan** (`curl`):

```bash
# Ubah ukuran jadi 3 x 4 cm
curl -X POST http://localhost:8000/api/v1/images/resize \
  -F "file=@foto.jpg" -F "width_cm=3" -F "height_cm=4" -F "fit=cover" \
  -o hasil.jpg

# Konversi ke WebP
curl -X POST http://localhost:8000/api/v1/images/convert \
  -F "file=@foto.png" -F "format=webp" -o hasil.webp

# Kompres dengan kualitas 60
curl -X POST http://localhost:8000/api/v1/images/compress \
  -F "file=@foto.jpg" -F "quality=60" -o kecil.jpg
```

**Parameter `resize`:** `width_cm` dan `height_cm` (lebih dari 0 sampai 50), `fit` (`cover` atau `contain`), `fx` dan `fy` (posisi potong 0 sampai 1, bawaan 0.5).

**Batasan:** format JPG, JPEG, PNG, dan WebP; ukuran file maksimal 10 MB.

## Cara menjalankan

Butuh **Python 3.10+** dan **Node.js 18+**. Buka dua terminal.

**1. Backend**

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Swagger: http://localhost:8000/docs

**2. Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173. Backend harus berjalan lebih dulu.

Untuk mengubah alamat backend, salin `frontend/.env.example` menjadi `frontend/.env` lalu ubah `VITE_API_URL`.

## Struktur proyek

```
RKS307_Web_Tool/
├── backend/
│   ├── main.py             endpoint REST API
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── api.js          pemanggil REST API
│       ├── styles.css
│       └── components/     ResizePanel, ConvertPanel, CompressPanel, Preview
├── docs/                   screenshot untuk README
└── README.md
```

## Demo online (opsional)

- Web: [isi alamat kalau sudah di-deploy]
- Swagger: [isi alamat kalau sudah di-deploy]
