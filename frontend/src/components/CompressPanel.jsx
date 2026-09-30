export default function CompressPanel({ opt, set }) {
  return (
    <>
      <h2>Tingkat kompresi</h2>
      <div className="field">
        <label className="t" htmlFor="q">Kualitas: {opt.q}%</label>
        <input type="range" id="q" min="10" max="95" value={opt.q} onChange={e => set({ q: +e.target.value })} />
        <p className="hint">Makin kecil kualitas, makin kecil ukuran file. PNG akan disimpan sebagai WebP agar bisa dikompres.</p>
      </div>
    </>
  )
}
