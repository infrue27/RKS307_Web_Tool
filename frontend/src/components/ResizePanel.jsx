const PRESETS = [
  ['2x3', '2 × 3', '2 × 3 cm'],
  ['3x4', '3 × 4', '3 × 4 cm'],
  ['4x6', '4 × 6', '4 × 6 cm'],
  ['custom', 'Kustom', 'Isi sendiri'],
]

export default function ResizePanel({ opt, set }) {
  return (
    <>
      <h2>Ukuran cetak (cm)</h2>
      <div className="opts">
        {PRESETS.map(([v, b, s]) => (
          <label className="opt" key={v}>
            <input type="radio" name="preset" value={v} checked={opt.preset === v}
              onChange={() => set({ preset: v, fx: 0.5, fy: 0.5 })} />
            <span><b>{b}</b><small>{s}</small></span>
          </label>
        ))}
      </div>
      {opt.preset === 'custom' && (
        <div className="field">
          <div className="row">
            <input type="number" min="1" max="50" step="0.5" value={opt.cw} aria-label="Lebar cm"
              onChange={e => set({ cw: e.target.value })} />
            <span>×</span>
            <input type="number" min="1" max="50" step="0.5" value={opt.ch} aria-label="Tinggi cm"
              onChange={e => set({ ch: e.target.value })} />
          </div>
        </div>
      )}
      <div className="field">
        <label className="t" htmlFor="fit">Cara menyesuaikan foto</label>
        <select id="fit" value={opt.fit} onChange={e => set({ fit: e.target.value, fx: 0.5, fy: 0.5 })}>
          <option value="cover">Potong bagian tepi (penuh)</option>
          <option value="contain">Muat semua, tambah latar putih</option>
        </select>
        <p className="hint">Resolusi 300 dpi, siap cetak.</p>
      </div>
    </>
  )
}
