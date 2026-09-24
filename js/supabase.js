import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://menpgxstirxkehlbmzsd.supabase.co'
const SUPABASE_KEY = 'sb_publishable_6HtJ1NgpwJNSJrrJj2qSKA_fnk5r2r0'

export const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// Categorías: arrancan con valores por defecto y se sobreescriben desde la tabla `categorias`
export let CATEGORIAS = {
  quesos:     { nombre: 'Quesos',     icono: '🧀', orden: 10 },
  fiambres:   { nombre: 'Fiambres',   icono: '🥩', orden: 20 },
  lacteos:    { nombre: 'Lácteos',    icono: '🥛', orden: 30 },
  dulces:     { nombre: 'Dulces',     icono: '🍯', orden: 40 },
  aceitunas:  { nombre: 'Aceitunas',  icono: '🫒', orden: 50 },
  copetin:    { nombre: 'Copetín',    icono: '🍿', orden: 60 },
  congelados: { nombre: 'Congelados', icono: '❄️', orden: 70 },
  pastas:     { nombre: 'Pastas',     icono: '🍝', orden: 80 },
  aderezos:   { nombre: 'Aderezos',   icono: '🫙', orden: 90 },
}

const CATEGORIAS_FALLBACK = CATEGORIAS

export async function cargarCategorias() {
  const { data, error } = await db.from('categorias').select('*').order('orden').order('nombre')
  if (error || !data) {
    console.error('Error cargando categorías:', error)
    CATEGORIAS = CATEGORIAS_FALLBACK
    return false
  }
  const mapa = {}
  data.forEach(c => {
    mapa[c.slug] = {
      id: c.id,
      nombre: c.nombre,
      icono: c.icono || '📦',
      orden: typeof c.orden === 'number' ? c.orden : 0,
    }
  })
  CATEGORIAS = mapa
  return true
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
