"""Petit Pix API - layanan susun lembar cetak, watermark, dan kompres foto."""
import io
import math
import os
from typing import Literal, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, ImageDraw, ImageFont, ImageOps, UnidentifiedImageError

MAX_BYTES = 10 * 1024 * 1024  # batas unggah 10 MB
DPI = 300
MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
IMG_RESP = {200: {"description": "Foto hasil pemrosesan", "content": {"image/*": {}}}}

app = FastAPI(
    title="Petit Pix API",
    description="REST API untuk **menyusun lembar cetak** (banyak pasfoto di satu kertas 4R/A4, 300 dpi), "
    "**menambah watermark** (teks atau gambar), dan **mengompres** foto JPG, PNG, dan WebP. "
    "Semua endpoint menerima `multipart/form-data` dan mengembalikan gambar hasil.",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Photo-Count", "X-Sheet-Layout"],
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


def respond(data, fmt, mode, extra=None):
    ext = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}[fmt]
    headers = {"Content-Disposition": f'inline; filename="petit-pix-{mode}.{ext}"'}
    headers.update(extra or {})
    return Response(content=data, media_type=MIME[fmt], headers=headers)


@app.get("/health", tags=["Sistem"], summary="Cek status server")
def health():
    return {"status": "ok"}


PAPER_CM = {"4r": (10.2, 15.2), "a4": (21.0, 29.7)}  # lebar x tinggi, posisi tegak
MARGIN_CM, GAP_CM = 0.3, 0.1  # tepi kertas dan jarak antar foto (untuk garis potong)


def cm_px(cm):
    return round(cm * DPI / 2.54)


def make_cell(img, w, h, fit):
    """Satu foto ukuran w x h piksel di atas latar putih."""
    rgba = img.convert("RGBA")
    cell = Image.new("RGB", (w, h), "white")
    if fit == "cover":
        part = ImageOps.fit(rgba, (w, h), Image.LANCZOS, centering=(0.5, 0.4))  # sedikit condong ke atas untuk wajah
        cell.paste(part, (0, 0), part)
    else:
        part = ImageOps.contain(rgba, (w, h), Image.LANCZOS)
        cell.paste(part, ((w - part.width) // 2, (h - part.height) // 2), part)
    return cell


def grid_for(page_w, page_h, w, h):
    m, g = cm_px(MARGIN_CM), cm_px(GAP_CM)
    cols = max(0, (page_w - 2 * m + g) // (w + g))
    rows = max(0, (page_h - 2 * m + g) // (h + g))
    return cols, rows, g


@app.post("/api/v1/images/sheet", tags=["Gambar"], summary="Susun banyak foto di satu lembar cetak",
          response_class=Response, responses=IMG_RESP)
async def sheet(
    file: UploadFile = File(..., description="Foto JPG, PNG, atau WebP (maks 10 MB)"),
    width_cm: float = Form(..., gt=0, le=50, description="Lebar satu foto dalam cm"),
    height_cm: float = Form(..., gt=0, le=50, description="Tinggi satu foto dalam cm"),
    paper: Literal["4r", "a4"] = Form("4r", description="Kertas: 4r (10,2 x 15,2 cm) atau a4 (21 x 29,7 cm)"),
    fit: Literal["cover", "contain"] = Form("cover", description="cover = potong tepi, contain = muat semua + latar putih"),
):
    """Foto diulang sebanyak yang muat. Kertas dicoba tegak dan mendatar, lalu dipilih yang muat lebih banyak.
    Hasil JPG 300 dpi dengan garis tipis untuk panduan potong. Jumlah foto ada di header `X-Photo-Count`."""
    img, _ = await read_image(file)
    w, h = cm_px(width_cm), cm_px(height_cm)
    pw, ph = (cm_px(v) for v in PAPER_CM[paper])
    tegak, datar = grid_for(pw, ph, w, h), grid_for(ph, pw, w, h)
    if datar[0] * datar[1] > tegak[0] * tegak[1]:
        (cols, rows, g), (W, H), layout = datar, (ph, pw), "mendatar"
    else:
        (cols, rows, g), (W, H), layout = tegak, (pw, ph), "tegak"
    if cols * rows == 0:
        raise HTTPException(422, "Ukuran foto terlalu besar untuk kertas ini.")
    cell = make_cell(img, w, h, fit)
    page = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(page)
    x0 = (W - (cols * w + (cols - 1) * g)) // 2
    y0 = (H - (rows * h + (rows - 1) * g)) // 2
    for r in range(rows):
        for c in range(cols):
            x, y = x0 + c * (w + g), y0 + r * (h + g)
            page.paste(cell, (x, y))
            draw.rectangle([x, y, x + w - 1, y + h - 1], outline=(187, 187, 187))
    return respond(encode(page, "JPEG", quality=95, dpi=True), "JPEG", "sheet",
                   {"X-Photo-Count": str(cols * rows), "X-Sheet-Layout": f"{cols}x{rows} {layout}"})


def get_font(px):
    """Font tebal dari sistem; kalau tidak ada, pakai font bawaan Pillow."""
    for name in ("DejaVuSans-Bold.ttf", "arialbd.ttf", "Arial Bold.ttf", "LiberationSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, px)
        except OSError:
            continue
    return ImageFont.load_default(size=px)


def text_mark(text, target_w):
    """Tulisan putih dengan garis tepi gelap tipis (terbaca di latar terang maupun gelap)."""
    l, _, r, _ = get_font(100).getbbox(text)
    fs = max(8, round(100 * target_w / max(1, r - l)))
    font, sw = get_font(fs), max(1, round(fs / 10))
    l, t, r, b = font.getbbox(text, stroke_width=sw)
    layer = Image.new("RGBA", (r - l + 2, b - t + 2), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((1 - l, 1 - t), text, font=font, fill=(255, 255, 255, 255),
                               stroke_width=sw, stroke_fill=(0, 0, 0, 140))
    return layer


@app.post("/api/v1/images/watermark", tags=["Gambar"], summary="Tambah watermark teks atau gambar",
          response_class=Response, responses=IMG_RESP)
async def watermark(
    file: UploadFile = File(..., description="Foto JPG, PNG, atau WebP (maks 10 MB)"),
    kind: Literal["text", "image"] = Form("text", description="text = tulisan, image = gambar/logo"),
    text: str = Form("", max_length=60, description="Tulisan watermark (wajib kalau kind=text)"),
    logo: Optional[UploadFile] = File(None, description="Gambar watermark (wajib kalau kind=image, PNG transparan paling bagus)"),
    count: Literal["one", "full"] = Form("one", description="one = satu saja, full = diulang memenuhi foto"),
    position: Literal["br", "bl", "tr", "tl", "c"] = Form("br", description="Posisi kalau count=one: kanan bawah, kiri bawah, kanan atas, kiri atas, tengah"),
    angle: Literal["diag", "flat"] = Form("diag", description="Susunan kalau count=full: miring atau lurus"),
    size: int = Form(30, ge=5, le=80, description="Lebar watermark, persen dari lebar foto"),
    opacity: int = Form(60, ge=10, le=100, description="Kepekatan watermark, 10-100"),
):
    """Format hasil sama dengan format foto asli."""
    img, fmt = await read_image(file)
    has_alpha = img.mode == "RGBA"
    base = img.convert("RGBA")
    W, H = base.size
    tw = max(8, round(W * size / 100))
    if kind == "text":
        if not text.strip():
            raise HTTPException(422, "Isi tulisan watermark dulu.")
        mark = text_mark(text.strip(), tw)
    else:
        if logo is None:
            raise HTTPException(422, "Unggah gambar watermark dulu.")
        wm, _ = await read_image(logo)
        wm = wm.convert("RGBA")
        mark = wm.resize((tw, max(1, round(tw * wm.height / wm.width))), Image.LANCZOS)
    mark.putalpha(mark.getchannel("A").point(lambda v: v * opacity // 100))
    mw, mh = mark.size

    if count == "one":
        pad = round(W * 0.03)
        x = pad if "l" in position else W - mw - pad if "r" in position else (W - mw) // 2
        y = pad if "t" in position else H - mh - pad if "b" in position else (H - mh) // 2
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        overlay.paste(mark, (x, y))
    else:
        side = math.ceil(math.hypot(W, H))
        pw, ph = (side, side) if angle == "diag" else (W, H)
        pattern = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        gx, gy = round(mw * 1.6), round(mh * 2.6)
        for row, y in enumerate(range(0, ph, gy)):
            for x in range(-gx + (gx // 2 if row % 2 else 0), pw, gx):
                pattern.paste(mark, (x, y))
        if angle == "diag":
            pattern = pattern.rotate(30, resample=Image.BICUBIC)
            left, top = (side - W) // 2, (side - H) // 2
            pattern = pattern.crop((left, top, left + W, top + H))
        overlay = pattern

    out = Image.alpha_composite(base, overlay)
    if not has_alpha:
        out = out.convert("RGB")
    return respond(encode(out, fmt, quality=92), fmt, "watermark")


@app.post("/api/v1/images/compress", tags=["Gambar"], summary="Kompres ukuran file foto",
          response_class=Response, responses=IMG_RESP)
async def compress(
    file: UploadFile = File(..., description="Foto JPG, PNG, atau WebP (maks 10 MB)"),
    quality: int = Form(70, ge=10, le=95, description="Kualitas 10-95 (makin kecil, file makin ringan)"),
):
    img, fmt = await read_image(file)
    out_fmt = "JPEG" if fmt == "JPEG" else "WEBP"  # PNG disimpan sebagai WebP agar bisa dikompres
    return respond(encode(img, out_fmt, quality=quality), out_fmt, "compress")
