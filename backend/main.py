"""Petit Pix API - layanan ubah ukuran, konversi, dan kompres foto."""
import io
import math
import os
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 10 * 1024 * 1024  # batas unggah 10 MB
DPI = 300
MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
IMG_RESP = {200: {"description": "Foto hasil pemrosesan", "content": {"image/*": {}}}}

app = FastAPI(
    title="Petit Pix API",
    description="REST API untuk **mengubah ukuran** (pasfoto 300 dpi), **mengonversi format**, "
    "dan **mengompres** foto JPG, PNG, dan WebP. Semua endpoint menerima `multipart/form-data` "
    "dan mengembalikan gambar hasil.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


async def read_image(file: UploadFile):
    """Validasi file lalu buka sebagai gambar. Format dicek dari isi file, bukan dari ekstensi."""
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Ukuran file maksimal 10 MB.")
    try:
        img = Image.open(io.BytesIO(data))
        fmt = img.format
        img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(415, "Format belum didukung. Gunakan JPG, JPEG, PNG, atau WebP.")
    if fmt == "MPO":
        fmt = "JPEG"
    if fmt not in MIME:
        raise HTTPException(415, "Isi file tidak sesuai format JPG, PNG, atau WebP.")
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA", "L"):
        img = img.convert("RGBA")
    return img, fmt


def flatten(img):
    """Ganti transparansi dengan latar putih (untuk JPEG)."""
    if img.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", img.size, "white")
        bg.paste(img, mask=img.getchannel("A"))
        return bg
    return img.convert("RGB")


def encode(img, fmt, quality=92, dpi=False):
    buf, kw = io.BytesIO(), {}
    if fmt == "JPEG":
        img = flatten(img)
        kw = dict(quality=quality, optimize=True, progressive=True)
    elif fmt == "WEBP":
        kw = dict(quality=quality, method=4)
    else:
        kw = dict(optimize=True)
    if dpi and fmt != "WEBP":
        kw["dpi"] = (DPI, DPI)
    img.save(buf, fmt, **kw)
    return buf.getvalue()


def respond(data, fmt, mode):
    ext = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}[fmt]
    return Response(
        content=data,
        media_type=MIME[fmt],
        headers={"Content-Disposition": f'inline; filename="petit-pix-{mode}.{ext}"'},
    )


@app.get("/health", tags=["Sistem"], summary="Cek status server")
def health():
    return {"status": "ok"}


@app.post("/api/v1/images/resize", tags=["Gambar"], summary="Ubah ukuran foto (cm, 300 dpi)",
          response_class=Response, responses=IMG_RESP)
async def resize(
    file: UploadFile = File(..., description="Foto JPG, PNG, atau WebP (maks 10 MB)"),
    width_cm: float = Form(..., gt=0, le=50, description="Lebar cetak dalam cm"),
    height_cm: float = Form(..., gt=0, le=50, description="Tinggi cetak dalam cm"),
    fit: Literal["cover", "contain"] = Form("cover", description="cover = potong tepi, contain = muat semua + latar putih"),
    fx: float = Form(0.5, ge=0, le=1, description="Posisi potong horizontal (0 kiri, 1 kanan)"),
    fy: float = Form(0.5, ge=0, le=1, description="Posisi potong vertikal (0 atas, 1 bawah)"),
):
    img, fmt = await read_image(file)
    w, h = round(width_cm * DPI / 2.54), round(height_cm * DPI / 2.54)
    iw, ih = img.size
    if fit == "cover":
        s = max(w / iw, h / ih)
        nw, nh = max(w, math.ceil(iw * s)), max(h, math.ceil(ih * s))
        im = img.resize((nw, nh), Image.LANCZOS)
        ox, oy = round((nw - w) * fx), round((nh - h) * fy)
        out = im.crop((ox, oy, ox + w, oy + h))
    else:
        s = min(w / iw, h / ih)
        nw, nh = max(1, round(iw * s)), max(1, round(ih * s))
        im = img.resize((nw, nh), Image.LANCZOS).convert("RGBA")
        out = Image.new("RGB", (w, h), "white")
        out.paste(im, ((w - nw) // 2, (h - nh) // 2), im)
    return respond(encode(out, fmt, dpi=True), fmt, "resize")


@app.post("/api/v1/images/convert", tags=["Gambar"], summary="Konversi format foto",
          response_class=Response, responses=IMG_RESP)
async def convert(
    file: UploadFile = File(..., description="Foto JPG, PNG, atau WebP (maks 10 MB)"),
    format: Literal["jpeg", "png", "webp"] = Form(..., description="Format hasil"),
):
    img, _ = await read_image(file)
    fmt = format.upper()
    return respond(encode(img, fmt), fmt, "convert")


@app.post("/api/v1/images/compress", tags=["Gambar"], summary="Kompres ukuran file foto",
          response_class=Response, responses=IMG_RESP)
async def compress(
    file: UploadFile = File(..., description="Foto JPG, PNG, atau WebP (maks 10 MB)"),
    quality: int = Form(70, ge=10, le=95, description="Kualitas 10-95 (makin kecil, file makin ringan)"),
):
    img, fmt = await read_image(file)
    out_fmt = "JPEG" if fmt == "JPEG" else "WEBP"  # PNG disimpan sebagai WebP agar bisa dikompres
    return respond(encode(img, out_fmt, quality=quality), out_fmt, "compress")
