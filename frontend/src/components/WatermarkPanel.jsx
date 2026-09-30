const KINDS = [['text', 'Teks', 'Tulisan'], ['image', 'Gambar', 'Logo atau stempel']]
const COUNTS = [['one', 'Satu saja', 'Di satu posisi'], ['full', 'Memenuhi foto', 'Diulang di seluruh area']]
const POS = [['br', 'Kanan bawah'], ['bl', 'Kiri bawah'], ['tr', 'Kanan atas'], ['tl', 'Kiri atas'], ['c', 'Tengah']]
const ANGLES = [['diag', 'Miring', 'Lebih sulit dihapus'], ['flat', 'Lurus', 'Rapi sejajar']]

function Choice({ name, items, value, onPick, wideLast }) {
  return (
    <div className="opts">
      {items.map(([v, b, s], i) => (
        <label className={'opt' + (wideLast && i === items.length - 1 ? ' wide' : '')} key={v}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onPick(v)} />
          <span><b>{b}</b>{s && <small>{s}</small>}</span>
        </label>
      ))}
    </div>
  )
}

export default function WatermarkPanel({ opt, set, logo, setLogo }) {
  return (
    <>
      <h2>Jenis watermark</h2>
      <Choice name="wkind" items={KINDS} value={opt.wkind} onPick={v => set({ wkind: v })} />

      {opt.wkind === 'text' ? (
        <div className="field">
          <label className="t" htmlFor="wtext">Tulisan</label>
          <input type="text" id="wtext" maxLength={60} value={opt.wtext} onChange={e => set({ wtext: e.target.value })} />
        </div>
      ) : (
        <div className="field">
          <label className="btn ghost">
            {logo ? 'Ganti gambar watermark' : 'Pilih gambar watermark'}
            <input type="file" hidden accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={e => { setLogo(e.target.files[0] || null); e.target.value = '' }} />
          </label>
          <p className="hint">{logo ? logo.name : 'PNG transparan paling bagus.'}</p>
        </div>
      )}

      <h2>Jumlah</h2>
      <Choice name="wcount" items={COUNTS} value={opt.wcount} onPick={v => set({ wcount: v })} />

      {opt.wcount === 'one' ? (
        <>
          <h2>Posisi</h2>
          <Choice name="wpos" items={POS} value={opt.wpos} onPick={v => set({ wpos: v })} wideLast />
        </>
      ) : (
        <>
          <h2>Susunan</h2>
          <Choice name="wang" items={ANGLES} value={opt.wang} onPick={v => set({ wang: v })} />
        </>
      )}

      <div className="field">
        <label className="t" htmlFor="wsize">Ukuran: {opt.wsize}%</label>
        <input type="range" id="wsize" min="5" max="80" value={opt.wsize} onChange={e => set({ wsize: +e.target.value })} />
      </div>
      <div className="field">
        <label className="t" htmlFor="wop">Kepekatan: {opt.wop}%</label>
        <input type="range" id="wop" min="10" max="100" value={opt.wop} onChange={e => set({ wop: +e.target.value })} />
        <p className="hint">Ukuran adalah lebar watermark dibanding lebar foto.</p>
      </div>
    </>
  )
}
