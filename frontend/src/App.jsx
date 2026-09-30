import { useEffect, useMemo, useRef, useState } from 'react'
import { API, callApi } from './api'
import ResizePanel from './components/ResizePanel'
import ConvertPanel from './components/ConvertPanel'
import CompressPanel from './components/CompressPanel'
import Preview from './components/Preview'

const TABS = [['resize', 'Ubah ukuran'], ['convert', 'Konversi'], ['compress', 'Kompres']]
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const kb = n => (n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB')

export default function App() {
  const [mode, setMode] = useState('resize')
  const [file, setFile] = useState(null)
  const [dims, setDims] = useState(null)
  const [opt, setOpt] = useState({ preset: '2x3', cw: 3, ch: 4, fit: 'cover', fmt: 'jpeg', q: 70, fx: 0.5, fy: 0.5 })
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const input = useRef(null)
  const base = useRef({ fx: 0.5, fy: 0.5 })
  const set = patch => setOpt(o => ({ ...o, ...patch }))

  // Ukuran cetak (cm) dan piksel target
  const [wcm, hcm] = useMemo(() => (
    opt.preset === 'custom' ? [+opt.cw || 3, +opt.ch || 4] : opt.preset.split('x').map(Number)
  ), [opt.preset, opt.cw, opt.ch])
  const [tw, th] = [Math.round(wcm * 300 / 2.54), Math.round(hcm * 300 / 2.54)]

  // Sisa foto yang terpotong (piksel) -> menentukan apakah foto bisa digeser
  let ov = [0, 0]
  if (dims && mode === 'resize' && opt.fit === 'cover') {
    const s = Math.max(tw / dims.w, th / dims.h)
    ov = [tw - dims.w * s, th - dims.h * s]
  }
  const canPan = ov[0] < -1 || ov[1] < -1

  // Panggil REST API tiap file / pengaturan berubah (ditunda supaya tidak spam)
  useEffect(() => {
    if (!file) return
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      setBusy(true); setErr('')
      try {
        const f = new FormData()
        f.append('file', file)
        if (mode === 'resize') {
          f.append('width_cm', wcm); f.append('height_cm', hcm)
          f.append('fit', opt.fit); f.append('fx', opt.fx); f.append('fy', opt.fy)
        } else if (mode === 'convert') f.append('format', opt.fmt)
        else f.append('quality', opt.q)
        const blob = await callApi(mode, f, ctl.signal)
        const bmp = await createImageBitmap(blob)
        setRes(prev => {
          if (prev) URL.revokeObjectURL(prev.url)
          return { url: URL.createObjectURL(blob), size: blob.size, type: blob.type, w: bmp.width, h: bmp.height }
        })
      } catch (e) {
        if (e.name !== 'AbortError') setErr(e.message === 'Failed to fetch' ? 'Server belum berjalan. Jalankan backend dulu.' : e.message)
      } finally {
        if (!ctl.signal.aborted) setBusy(false)
      }
    }, 200)
    return () => { clearTimeout(t); ctl.abort() }
  }, [file, mode, wcm, hcm, opt.fit, opt.fx, opt.fy, opt.fmt, opt.q])

  const load = f => {
    if (!f) return
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { setErr('Format belum didukung. Gunakan JPG, PNG, atau WebP.'); return }
    setErr(''); setFile(f); set({ fx: 0.5, fy: 0.5 })
    createImageBitmap(f).then(b => setDims({ w: b.width, h: b.height }))
  }

  const panStart = () => { base.current = { fx: opt.fx, fy: opt.fy } }
  const pan = (dx, dy) => {
    const nf = (o, d, r) => (r < -1 ? Math.min(1, Math.max(0, (o * r + d) / r)) : o)
    set({ fx: nf(base.current.fx, dx, ov[0]), fy: nf(base.current.fy, dy, ov[1]) })
  }

  const diff = res && file ? (res.size - file.size) / file.size * 100 : null
  const name = file && res ? file.name.replace(/\.[^.]+$/, '') + '-' + mode + '.' + EXT[res.type] : undefined

  return (
    <>
      <header>
        <div>
          <h1>🍒 Petit Pix</h1>
          <div className="tag">Ubah ukuran, konversi &amp; kompres foto</div>
        </div>
        <div className="api">
          <code>POST /api/v1/images/{mode}</code>
          <a href={API + '/docs'} target="_blank" rel="noreferrer">Swagger /docs</a>
        </div>
      </header>

      <main>
        <section className="card" aria-label="Pengaturan">
          <div className="tabs" role="tablist">
            {TABS.map(([m, label]) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>{label}</button>
            ))}
          </div>
          {mode === 'resize' && <ResizePanel opt={opt} set={set} />}
          {mode === 'convert' && <ConvertPanel opt={opt} set={set} />}
          {mode === 'compress' && <CompressPanel opt={opt} set={set} />}
        </section>

        <section className="card" aria-label="Pratinjau">
          <div id="drop" className={over ? 'over' : ''} tabIndex={0} role="button" aria-label="Pilih foto"
            onClick={() => input.current.click()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current.click() } }}
            onDragOver={e => { e.preventDefault(); setOver(true) }}
            onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); load(e.dataTransfer.files[0]) }}>
            <strong>{file ? file.name : 'Tarik foto ke sini atau klik untuk memilih'}</strong>
            <span className="hint" style={{ margin: 0 }}>{file ? 'Klik untuk ganti foto' : 'JPG, PNG, atau WebP'}</span>
            <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden
              onChange={e => { load(e.target.files[0]); e.target.value = '' }} />
          </div>

          <h2>Hasil</h2>
          {err && <p className="err" role="alert">{err}</p>}
          <Preview res={res} busy={busy} draggable={canPan && !!res} onPanStart={panStart} onPan={pan} />

          <div className="stats">
            <div><small>Ukuran piksel</small><b>{res ? `${res.w} × ${res.h}` : '–'}</b></div>
            <div><small>Ukuran file</small><b>{res ? kb(res.size) : '–'}</b></div>
            <div><small>Selisih dari asli</small>
              <b className={diff < 0 ? 'good' : ''}>{diff === null ? '–' : (diff > 0 ? '+' : '') + diff.toFixed(0) + '%'}</b></div>
          </div>
          <div className="bar">
            <a className="btn" href={res ? res.url : '#'} download={name} aria-disabled={!res}>Unduh hasil</a>
            <button className="btn ghost" type="button" onClick={() => input.current.click()}>Ganti foto</button>
          </div>
        </section>
      </main>
      <footer>Petit Pix – foto diproses oleh REST API (FastAPI + Pillow). Dokumentasi API ada di Swagger /docs.</footer>
    </>
  )
}
