# 🍒 Petit Pix

Web tool untuk **menyusun lembar cetak**, **menambah watermark**, dan **mengompres** foto. Susun lembar menata banyak pasfoto (2×3, 3×4, 4×6, atau ukuran kustom) di kertas 4R atau A4 dengan resolusi 300 dpi. Foto diproses oleh REST API, dan halaman webnya nyaman dipakai di HP.

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

- **Susun lembar** banyak foto di satu kertas 4R atau A4 (300 dpi)
  - Ukuran foto 2×3, 3×4, 4×6, atau kustom, dengan mode *potong tepi* atau *muat semua* (ditambah latar putih)
  - Kertas tegak atau mendatar dipilih otomatis yang paling banyak muat, lengkap dengan garis tipis panduan potong
- **Watermark** teks atau gambar/logo
  - Satu saja (kanan bawah, kiri bawah, kanan atas, kiri atas, tengah) atau memenuhi foto (susunan miring atau lurus)
  - Ukuran dan kepekatan bisa diatur, format hasil sama dengan foto asli
- **Kompres** ukuran file dengan pengaturan kualitas 10 sampai 95%
- Pratinjau hasil, ukuran piksel, ukuran file, dan selisih dari file asli (atau jumlah foto per lembar)
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
| POST | `/api/v1/images/sheet` | Susun banyak foto di satu lembar 4R atau A4 (300 dpi) |
| POST | `/api/v1/images/watermark` | Tambah watermark teks atau gambar |
| POST | `/api/v1/images/compress` | Kompres dengan `quality` 10 sampai 95 |
| GET | `/health` | Cek status server |

Semua endpoint gambar menerima `multipart/form-data` dan mengembalikan file gambar.

**Contoh penggunaan** (`curl`):

```bash
# Lembar cetak: foto 3 x 4 cm di kertas 4R
curl -X POST http://localhost:8000/api/v1/images/sheet \
  -F "file=@foto.jpg" -F "width_cm=3" -F "height_cm=4" -F "paper=4r" \
  -o lembar.jpg -D -

# Watermark teks, diulang miring di seluruh foto
curl -X POST http://localhost:8000/api/v1/images/watermark \
  -F "file=@foto.jpg" -F "kind=text" -F "text=Contoh" -F "count=full" -F "angle=diag" \
  -o hasil.jpg

# Watermark gambar di kanan bawah
curl -X POST http://localhost:8000/api/v1/images/watermark \
  -F "file=@foto.jpg" -F "kind=image" -F "logo=@logo.png" -F "position=br" -o hasil.jpg

# Kompres dengan kualitas 60
curl -X POST http://localhost:8000/api/v1/images/compress \
  -F "file=@foto.jpg" -F "quality=60" -o kecil.jpg
```

**Parameter `sheet`:** `width_cm` dan `height_cm` (lebih dari 0 sampai 50), `paper` (`4r` atau `a4`), `fit` (`cover` atau `contain`). Jumlah foto per lembar dikirim di header respons `X-Photo-Count`.

**Parameter `watermark`:** `kind` (`text` atau `image`), `text` (maks 60 karakter), `logo` (file gambar, untuk `kind=image`), `count` (`one` atau `full`), `position` (`br`, `bl`, `tr`, `tl`, `c`), `angle` (`diag` atau `flat`), `size` (5 sampai 80, persen dari lebar foto), `opacity` (10 sampai 100).

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
│       └── components/     SheetPanel, WatermarkPanel, CompressPanel, Preview
├── docs/                   screenshot untuk README
└── README.md
```

## Demo online (opsional)

- Web: [isi alamat kalau sudah di-deploy]
- Swagger: [isi alamat kalau sudah di-deploy]
