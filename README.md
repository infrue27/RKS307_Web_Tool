# 🍒 Petit Pix

Web tool untuk **mengubah ukuran** (pasfoto 2×3, 3×4, 4×6, kustom, 300 dpi), **mengonversi format** (JPG / PNG / WebP), dan **mengompres** foto. Dibuat untuk PBL RKS307 - tema *Document & Media Transformation Service*.

- **Backend:** FastAPI + Pillow (REST API, Swagger di `/docs`)
- **Frontend:** React + Vite

## Endpoint
| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/v1/images/resize` | Ubah ukuran ke cm (300 dpi), mode `cover` / `contain` |
| POST | `/api/v1/images/convert` | Konversi ke `jpeg` / `png` / `webp` |
| POST | `/api/v1/images/compress` | Kompres dengan `quality` 10-95 |
| GET | `/health` | Cek status server |

## Cara menjalankan
Butuh Python 3.10+ dan Node.js 18+.

**1. Backend** (terminal pertama)
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Swagger: http://localhost:8000/docs

**2. Frontend** (terminal kedua)
```
cd frontend
npm install
npm run dev
```
Buka http://localhost:5173

## Struktur
```
backend/    main.py, requirements.txt
frontend/   index.html, src/ (App.jsx, components/, api.js, styles.css)
```
