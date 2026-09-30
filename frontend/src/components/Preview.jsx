import { useRef } from 'react'

// Area pratinjau hasil. Kalau draggable, foto bisa digeser (mouse / sentuh) untuk mengatur potongan.
export default function Preview({ res, busy, draggable, onPanStart, onPan }) {
  const start = useRef(null)

  const down = e => {
    const im = e.currentTarget.querySelector('img')
    if (!draggable || !im) return
    start.current = { x: e.clientX, y: e.clientY, k: im.getBoundingClientRect().width / im.naturalWidth }
    onPanStart()
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = e => {
    const s = start.current
    if (s) onPan((e.clientX - s.x) / s.k, (e.clientY - s.y) / s.k)
  }
  const up = () => { start.current = null }

  return (
    <>
      <div className={'stage' + (draggable ? ' drag' : '') + (busy ? ' busy' : '')}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {res ? <img src={res.url} alt="Hasil foto" /> : <p>Pilih foto untuk melihat hasilnya di sini.</p>}
      </div>
      {draggable && <p className="hint">👆 Geser foto untuk mengatur bagian yang dipotong.</p>}
    </>
  )
}
