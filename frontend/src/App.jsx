import { useEffect, useMemo, useRef, useState } from 'react'
import { API, callApi } from './api'
import SheetPanel from './components/SheetPanel'
import WatermarkPanel from './components/WatermarkPanel'
import CompressPanel from './components/CompressPanel'
import Preview from './components/Preview'

const TABS = [['sheet', 'Susun lembar'], ['watermark', 'Watermark'], ['compress', 'Kompres']]
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const kb = n => (n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB')

export default function App() {
  const [mode, setMode] = useState('sheet')
  const [file, setFile] = useState(null)
  const [logo, setLogo] = useState(null)
  const [opt, setOpt] = useState({
    preset: '3x4', cw: 3, ch: 4, paper: '4r', fit: 'cover', q: 70,
    wkind: 'text', wtext: '© Nama Kamu', wcount: 'one', wpos: 'br', wang: 'diag', wsize: 30, wop: 60,
  })
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const input = useRef(null)
  const set = patch => setOpt(o => ({ ...o, ...patch }))

  // Ukuran satu foto (cm) untuk lembar cetak
  const [wcm, hcm] = useMemo(() => (
    opt.preset === 'custom' ? [+opt.cw || 3, +opt.ch || 4] : opt.preset.split('x').map(Number)
  ), [opt.preset, opt.cw, opt.ch])

  // Panggil REST API tiap file / pengaturan berubah (ditunda supaya tidak spam)
  useEffect(() => {
    if (!file) return
    if (mode === 'watermark') {
      if (opt.wkind === 'image' && !logo) { setErr('Pilih gambar watermark dulu.'); return }
      if (opt.wkind === 'text' && !opt.wtext.trim()) { setErr('Isi tulisan watermark dulu.'); return }
    }
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      setBusy(true); setErr('')
      try {
        const f = new FormData()
        f.append('file', file)
        if (mode === 'sheet') {
          f.append('width_cm', wcm); f.append('height_cm', hcm)
          f.append('paper', opt.paper); f.append('fit', opt.fit)
        } else if (mode === 'watermark') {
          f.append('kind', opt.wkind); f.append('count', opt.wcount)
          f.append('position', opt.wpos); f.append('angle', opt.wang)
          f.append('size', opt.wsize); f.append('opacity', opt.wop)
          if (opt.wkind === 'text') f.append('text', opt.wtext)
          else f.append('logo', logo)
        } else f.append('quality', opt.q)
        const { blob, headers } = await callApi(mode, f, ctl.signal)
        const bmp = await createImageBitmap(blob)
        setRes(prev => {
          if (prev) URL.revokeObjectURL(prev.url)
          return { url: URL.createObjectURL(blob), size: blob.size, type: blob.type, w: bmp.width, h: bmp.height, count: headers.get('X-Photo-Count') }
        })
      } catch (e) {
        if (e.name !== 'AbortError') setErr(e.message === 'Failed to fetch' ? 'Server belum berjalan. Jalankan backend dulu.' : e.message)
      } finally {
        if (!ctl.signal.aborted) setBusy(false)
      }
    }, 200)
    return () => { clearTimeout(t); ctl.abort() }
  }, [file, logo, mode, wcm, hcm, opt.paper, opt.fit, opt.q,
    opt.wkind, opt.wtext, opt.wcount, opt.wpos, opt.wang, opt.wsize, opt.wop])

  const load = f => {
    if (!f) return
    if (!/\.(jpe?g|png|webp)$/i.test(f.name) && !/^image\/(png|jpe?g|webp)$/.test(f.type)) { setErr('Format belum didukung. Gunakan JPG, PNG, atau WebP.'); return }
    setErr(''); setFile(f)
  }

  const diff = res && file ? (res.size - file.size) / file.size * 100 : null
  const name = file && res ? file.name.replace(/\.[^.]+$/, '') + '-' + mode + '.' + EXT[res.type] : undefined

  return (
    <>
      <header>
        <div>
          <h1>🍒 Petit Pix</h1>
          <div className="tag">Susun lembar cetak, watermark &amp; kompres foto</div>
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
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr('') }}>{label}</button>
            ))}
          </div>
          {mode === 'sheet' && <SheetPanel opt={opt} set={set} count={res && res.count} />}
          {mode === 'watermark' && <WatermarkPanel opt={opt} set={set} logo={logo} setLogo={setLogo} />}
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
            <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden
              onChange={e => { load(e.target.files[0]); e.target.value = '' }} />
          </div>

          <h2>Hasil</h2>
          {err && <p className="err" role="alert">{err}</p>}
          <Preview res={res} busy={busy} />

          <div className="stats">
            <div><small>Ukuran piksel</small><b>{res ? `${res.w} × ${res.h}` : '–'}</b></div>
            <div><small>Ukuran file</small><b>{res ? kb(res.size) : '–'}</b></div>
            {mode === 'sheet' ? (
              <div><small>Jumlah foto</small><b>{res && res.count ? res.count : '–'}</b></div>
            ) : (
              <div><small>Selisih dari asli</small>
                <b className={diff < 0 ? 'good' : ''}>{diff === null ? '–' : (diff > 0 ? '+' : '') + diff.toFixed(0) + '%'}</b></div>
            )}
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
