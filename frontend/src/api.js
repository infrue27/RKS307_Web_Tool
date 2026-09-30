export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Kirim form ke endpoint /api/v1/images/{path}, kembalikan Blob gambar hasil
export async function callApi(path, form, signal) {
  const res = await fetch(`${API}/api/v1/images/${path}`, { method: 'POST', body: form, signal })
  if (!res.ok) {
    let msg = 'Gagal memproses foto.'
    try {
      const j = await res.json()
      msg = typeof j.detail === 'string' ? j.detail : 'Pengaturan tidak valid.'
    } catch { /* abaikan */ }
    throw new Error(msg)
  }
  return res.blob()
}
