const FORMATS = [
  ['jpeg', 'JPG', 'PNG → JPG'],
  ['png', 'PNG', 'JPG → PNG'],
  ['webp', 'WebP', 'Lebih ringan'],
]

export default function ConvertPanel({ opt, set }) {
  return (
    <>
      <h2>Format hasil</h2>
      <div className="opts">
        {FORMATS.map(([v, b, s]) => (
          <label className="opt" key={v}>
            <input type="radio" name="fmt" value={v} checked={opt.fmt === v} onChange={() => set({ fmt: v })} />
            <span><b>{b}</b><small>{s}</small></span>
          </label>
        ))}
      </div>
      <p className="hint">Ukuran piksel foto tidak berubah. Transparansi PNG diganti latar putih saat jadi JPG.</p>
    </>
  )
}
