import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://menpgxstirxkehlbmzsd.supabase.co'
const SUPABASE_KEY = 'sb_publishable_6HtJ1NgpwJNSJrrJj2qSKA_fnk5r2r0'

export const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// Categorías con su info
export const CATEGORIAS = {
  quesos:     { nombre: 'Quesos',     icono: '🧀' },
  fiambres:   { nombre: 'Fiambres',   icono: '🥩' },
  lacteos:    { nombre: 'Lácteos',    icono: '🥛' },
  dulces:     { nombre: 'Dulces',     icono: '🍯' },
  aceitunas:  { nombre: 'Aceitunas',  icono: '🫒' },
  copetin:    { nombre: 'Copetín',    icono: '🍿' },
  congelados: { nombre: 'Congelados', icono: '❄️' },
  pastas:     { nombre: 'Pastas',     icono: '🍝' },
  aderezos:   { nombre: 'Aderezos',   icono: '🫙' },
}

export const fmt = n =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

// Obtener URL pública de imagen desde Supabase Storage
export function getImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const { data } = db.storage.from('productos').getPublicUrl(path)
  return data.publicUrl
}
