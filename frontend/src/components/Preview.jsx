// Area pratinjau hasil.
export default function Preview({ res, busy }) {
  return (
    <div className={'stage' + (busy ? ' busy' : '')}>
      {res ? <img src={res.url} alt="Hasil foto" /> : <p>Pilih foto untuk melihat hasilnya di sini.</p>}
    </div>
  )
}
