const PRESETS = [
  ['2x3', '2 × 3', '2 × 3 cm'],
  ['3x4', '3 × 4', '3 × 4 cm'],
  ['4x6', '4 × 6', '4 × 6 cm'],
  ['custom', 'Kustom', 'Isi sendiri'],
]
const PAPERS = [
  ['4r', '4R', '10,2 × 15,2 cm'],
  ['a4', 'A4', '21 × 29,7 cm'],
]

export default function SheetPanel({ opt, set, count }) {
  return (
    <>
      <h2>Ukuran satu foto (cm)</h2>
      <div className="opts">
        {PRESETS.map(([v, b, s]) => (
          <label className="opt" key={v}>
            <input type="radio" name="preset" value={v} checked={opt.preset === v}
              onChange={() => set({ preset: v })} />
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

      <h2>Kertas</h2>
      <div className="opts">
        {PAPERS.map(([v, b, s]) => (
          <label className="opt" key={v}>
            <input type="radio" name="paper" value={v} checked={opt.paper === v}
              onChange={() => set({ paper: v })} />
            <span><b>{b}</b><small>{s}</small></span>
          </label>
        ))}
      </div>

      <div className="field">
        <label className="t" htmlFor="fit">Cara menyesuaikan foto</label>
        <select id="fit" value={opt.fit} onChange={e => set({ fit: e.target.value })}>
          <option value="cover">Potong bagian tepi (penuh)</option>
          <option value="contain">Muat semua, tambah latar putih</option>
        </select>
        <p className="hint">
          {count ? `Muat ${count} foto. ` : ''}Kertas tegak atau mendatar dipilih otomatis yang paling banyak muat. Resolusi 300 dpi, siap cetak.
        </p>
      </div>
    </>
  )
}
