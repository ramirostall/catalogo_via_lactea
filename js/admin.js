import { db, CATEGORIAS, fmt, getImageUrl } from './supabase.js'

let productos = []
let editandoId = null
let borrandoId = null
let imagenPath = null // path en storage

/* ══════════════════════════════════════════════════════════
   AUTENTICACIÓN
══════════════════════════════════════════════════════════ */
async function initAuth() {
  const { data: { session } } = await db.auth.getSession()
  if (session) {
    await verifyAdmin(session)
    return
  }

  showLogin()
  db.auth.onAuthStateChange(async (_event, authSession) => {
    if (authSession?.session) await verifyAdmin(authSession.session)
    else showLogin()
  })
}

function clearLoginFields() {
  document.getElementById('login-user').value = ''
  document.getElementById('login-pass').value = ''
}

function showLogin(message = '') {
  document.getElementById('login-overlay').classList.remove('hidden')
  document.getElementById('admin-wrap').classList.add('hidden')
  clearLoginFields()
  const errorEl = document.getElementById('login-error')
  if (message) {
    errorEl.textContent = message
    errorEl.classList.remove('hidden')
  } else {
    errorEl.classList.add('hidden')
  }
}

async function activateAdmin() {
  document.getElementById('login-overlay').classList.add('hidden')
  document.getElementById('admin-wrap').classList.remove('hidden')
  await cargarProductos()
}

document.getElementById('login-btn').addEventListener('click', loginWithEmail)
document.getElementById('register-btn').addEventListener('click', registerWithEmail)

async function verifyAdmin(session) {
  const userId = session.user?.id
  if (!userId) {
    await db.auth.signOut()
    showLogin('No se detectó sesión válida.')
    return
  }

  const { data, error } = await db.from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data || data.role !== 'admin') {
    await db.auth.signOut()
    showLogin('No tenés permisos de administrador.')
    return
  }

  activateAdmin()
}

document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-btn').click()
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await db.auth.signOut()
  showLogin()
})

document.getElementById('toggle-pass').addEventListener('click', () => {
  const input = document.getElementById('login-pass')
  const btn = document.getElementById('toggle-pass')
  const isPassword = input.type === 'password'
  input.type = isPassword ? 'text' : 'password'
  btn.textContent = isPassword ? '🙈' : '👁️'
})

async function loginWithEmail() {
  const email = document.getElementById('login-user').value.trim()
  const password = document.getElementById('login-pass').value
  if (!email || !password) {
    document.getElementById('login-error').textContent = 'Completá email y contraseña'
    document.getElementById('login-error').classList.remove('hidden')
    return
  }

  const { error, data } = await db.auth.signInWithPassword({ email, password })
  if (error) {
    document.getElementById('login-error').textContent = error.message
    document.getElementById('login-error').classList.remove('hidden')
    return
  }

  await verifyAdmin(data.session)
}

async function registerWithEmail() {
  const email = document.getElementById('login-user').value.trim()
  const password = document.getElementById('login-pass').value
  if (!email || !password) {
    document.getElementById('login-error').textContent = 'Completá email y contraseña para registrarte.'
    document.getElementById('login-error').classList.remove('hidden')
    return
  }

  const { error } = await db.auth.signUp({ email, password })
  if (error) {
    document.getElementById('login-error').textContent = error.message
    document.getElementById('login-error').classList.remove('hidden')
    return
  }

  showLogin('Te registraste correctamente. Pedí el cambio de rol admin con quien administra el proyecto.')
}

/* ══════════════════════════════════════════════════════════
   NAVEGACIÓN
══════════════════════════════════════════════════════════ */
function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  document.getElementById(`view-${viewName}`).classList.add('active')
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active')
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'nuevo') nuevoProducto()
    else showView(btn.dataset.view)
  })
})

/* ══════════════════════════════════════════════════════════
   CARGAR PRODUCTOS
══════════════════════════════════════════════════════════ */
async function cargarProductos() {
  document.getElementById('admin-loading').classList.remove('hidden')
  document.getElementById('productos-tbody').innerHTML = ''

  const { data, error } = await db.from('productos').select('*').order('categoria').order('nombre')
  document.getElementById('admin-loading').classList.add('hidden')

  if (error) { alert('Error cargando productos: ' + error.message); return }
  productos = data || []
  renderTabla(productos)
  document.getElementById('productos-count').textContent = `${productos.length} productos en total`
}

function renderTabla(lista) {
  const tbody = document.getElementById('productos-tbody')
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No hay productos todavía. ¡Agregá el primero!</td></tr>`
    return
  }
  tbody.innerHTML = lista.map(p => {
    const imgUrl = getImageUrl(p.imagen)
    const catLabel = CATEGORIAS[p.categoria]?.nombre || p.categoria
    const catEmoji = CATEGORIAS[p.categoria]?.icono || '📦'
    return `
      <tr data-id="${p.id}">
        <td class="td-img">
          ${imgUrl ? `<img src="${imgUrl}" alt="${p.nombre}" class="thumb">` : `<div class="thumb-ph">${catEmoji}</div>`}
        </td>
        <td>
          <div class="td-nombre">${p.nombre}</div>
          <div class="td-sub">${p.subcategoria || ''}</div>
        </td>
        <td>${p.marca}</td>
        <td><span class="cat-badge">${catEmoji} ${catLabel}</span></td>
        <td class="td-precio">$${fmt(p.precio)}<br><small>/ ${p.unidad}</small></td>
        <td class="td-actions">
          <button class="btn-edit" data-id="${p.id}">Editar</button>
          <button class="btn-delete" data-id="${p.id}" data-nombre="${p.nombre}">Eliminar</button>
        </td>
      </tr>`
  }).join('')

  // Eventos de tabla
  tbody.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => editarProducto(parseInt(btn.dataset.id))))
  tbody.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => confirmarBorrar(parseInt(btn.dataset.id), btn.dataset.nombre)))
}

/* ── Búsqueda admin ──────────────────────────────────── */
document.getElementById('admin-search').addEventListener('input', filtrarTabla)
document.getElementById('admin-filter-cat').addEventListener('change', filtrarTabla)

function filtrarTabla() {
  const q = document.getElementById('admin-search').value.toLowerCase()
  const cat = document.getElementById('admin-filter-cat').value
  const filtrados = productos.filter(p =>
    (!q || p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q)) &&
    (!cat || p.categoria === cat)
  )
  renderTabla(filtrados)
}

/* ══════════════════════════════════════════════════════════
   FORMULARIO NUEVO / EDITAR
══════════════════════════════════════════════════════════ */
function nuevoProducto() {
  editandoId = null
  imagenPath = null
  limpiarForm()
  document.getElementById('form-title').textContent = 'Nuevo Producto'
  document.getElementById('btn-guardar-txt').textContent = 'Guardar producto'
  showView('nuevo')
}

function editarProducto(id) {
  const p = productos.find(x => x.id === id)
  if (!p) return
  editandoId = id
  imagenPath = p.imagen || null

  document.getElementById('prod-id').value = p.id
  document.getElementById('prod-nombre').value = p.nombre || ''
  document.getElementById('prod-marca').value = p.marca || ''
  document.getElementById('prod-unidad').value = p.unidad || ''
  document.getElementById('prod-categoria').value = p.categoria || ''
  document.getElementById('prod-subcategoria').value = p.subcategoria || ''
  document.getElementById('prod-precio').value = p.precio || ''
  document.getElementById('tag-sintacc').checked = !!(p.tags && p.tags.includes('SIN TACC'))

  const tienePromo = !!(p.promo_cantidad && p.promo_precio)
  document.getElementById('tiene-promo').checked = tienePromo
  document.getElementById('promo-fields').classList.toggle('hidden', !tienePromo)
  if (tienePromo) {
    document.getElementById('prod-promo-cant').value = p.promo_cantidad
    document.getElementById('prod-promo-precio').value = p.promo_precio
  }

  // Imagen preview
  const imgUrl = getImageUrl(p.imagen)
  if (imgUrl) {
    document.getElementById('preview-img').src = imgUrl
    document.getElementById('upload-preview').classList.remove('hidden')
    document.getElementById('upload-placeholder').classList.add('hidden')
  } else {
    document.getElementById('upload-preview').classList.add('hidden')
    document.getElementById('upload-placeholder').classList.remove('hidden')
  }

  document.getElementById('form-title').textContent = 'Editar Producto'
  document.getElementById('btn-guardar-txt').textContent = 'Guardar cambios'
  showView('nuevo')
}

function limpiarForm() {
  ['prod-nombre', 'prod-marca', 'prod-unidad', 'prod-subcategoria', 'prod-precio', 'prod-promo-cant', 'prod-promo-precio', 'prod-id']
    .forEach(id => { document.getElementById(id).value = '' })
  document.getElementById('prod-categoria').value = ''
  document.getElementById('tiene-promo').checked = false
  document.getElementById('promo-fields').classList.add('hidden')
  document.getElementById('tag-sintacc').checked = false
  document.getElementById('upload-preview').classList.add('hidden')
  document.getElementById('upload-placeholder').classList.remove('hidden')
  document.getElementById('img-input').value = ''
  document.getElementById('form-msg').classList.add('hidden')
  imagenPath = null
}

document.getElementById('tiene-promo').addEventListener('change', e => {
  document.getElementById('promo-fields').classList.toggle('hidden', !e.target.checked)
})

document.getElementById('btn-cancelar').addEventListener('click', () => showView('productos'))
document.getElementById('btn-cancelar2').addEventListener('click', () => showView('productos'))

/* ── Guardar ──────────────────────────────────────────── */
document.getElementById('btn-guardar').addEventListener('click', guardarProducto)

async function guardarProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim()
  const marca = document.getElementById('prod-marca').value.trim()
  const unidad = document.getElementById('prod-unidad').value.trim()
  const categoria = document.getElementById('prod-categoria').value
  const subcategoria = document.getElementById('prod-subcategoria').value.trim()
  const precio = parseFloat(document.getElementById('prod-precio').value)
  const tienePromo = document.getElementById('tiene-promo').checked
  const sinTacc = document.getElementById('tag-sintacc').checked

  if (!nombre || !marca || !categoria || isNaN(precio)) {
    mostrarMsg('Completá todos los campos obligatorios (*)', 'error')
    return
  }

  const btn = document.getElementById('btn-guardar')
  btn.disabled = true
  document.getElementById('btn-guardar-txt').textContent = 'Guardando…'

  // Subir imagen si hay nueva
  const fileInput = document.getElementById('img-input')
  if (fileInput.files[0]) {
    const uploaded = await subirImagen(fileInput.files[0])
    if (uploaded) imagenPath = uploaded
  }

  const payload = {
    nombre, marca, unidad, categoria, subcategoria,
    precio,
    promo_cantidad: tienePromo ? parseInt(document.getElementById('prod-promo-cant').value) || null : null,
    promo_precio: tienePromo ? parseFloat(document.getElementById('prod-promo-precio').value) || null : null,
    tags: sinTacc ? 'SIN TACC' : '',
    imagen: imagenPath || ''
  }

  let error
  if (editandoId) {
    ; ({ error } = await db.from('productos').update(payload).eq('id', editandoId))
  } else {
    ; ({ error } = await db.from('productos').insert(payload))
  }

  btn.disabled = false
  document.getElementById('btn-guardar-txt').textContent = editandoId ? 'Guardar cambios' : 'Guardar producto'

  if (error) {
    mostrarMsg('Error al guardar: ' + error.message, 'error')
  } else {
    mostrarMsg(editandoId ? '✅ Producto actualizado!' : '✅ Producto creado!', 'ok')
    await cargarProductos()
    setTimeout(() => showView('productos'), 1200)
  }
}

/* ══════════════════════════════════════════════════════════
   SUBIR IMAGEN
══════════════════════════════════════════════════════════ */
async function subirImagen(file) {
  const ext = file.name.split('.').pop()
  const nombre = `producto_${Date.now()}.${ext}`

  document.getElementById('upload-progress').classList.remove('hidden')
  document.getElementById('progress-fill').style.width = '30%'
  document.getElementById('progress-text').textContent = 'Subiendo imagen…'

  const { data, error } = await db.storage.from('productos').upload(nombre, file, { upsert: true })

  document.getElementById('progress-fill').style.width = '100%'
  document.getElementById('progress-text').textContent = error ? '❌ Error al subir' : '✅ Imagen subida'
  setTimeout(() => document.getElementById('upload-progress').classList.add('hidden'), 2000)

  if (error) { alert('Error al subir imagen: ' + error.message); return null }
  return data.path
}

/* ── Upload UI ────────────────────────────────────────── */
const uploadArea = document.getElementById('upload-area')
const imgInput = document.getElementById('img-input')

uploadArea.addEventListener('click', e => {
  if (!e.target.closest('#remove-img')) imgInput.click()
})

uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over') })
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'))
uploadArea.addEventListener('drop', e => {
  e.preventDefault()
  uploadArea.classList.remove('drag-over')
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) previewFile(file)
})

imgInput.addEventListener('change', () => {
  if (imgInput.files[0]) previewFile(imgInput.files[0])
})

function previewFile(file) {
  const reader = new FileReader()
  reader.onload = e => {
    document.getElementById('preview-img').src = e.target.result
    document.getElementById('upload-preview').classList.remove('hidden')
    document.getElementById('upload-placeholder').classList.add('hidden')
  }
  reader.readAsDataURL(file)
}

document.getElementById('remove-img').addEventListener('click', e => {
  e.stopPropagation()
  document.getElementById('upload-preview').classList.add('hidden')
  document.getElementById('upload-placeholder').classList.remove('hidden')
  imgInput.value = ''
  imagenPath = null
})

/* ══════════════════════════════════════════════════════════
   BORRAR PRODUCTO
══════════════════════════════════════════════════════════ */
function confirmarBorrar(id, nombre) {
  borrandoId = id
  document.getElementById('modal-delete-name').textContent = `"${nombre}" será eliminado permanentemente.`
  document.getElementById('modal-delete').classList.remove('hidden')
}

document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('modal-delete').classList.add('hidden')
  borrandoId = null
})

document.getElementById('modal-confirm').addEventListener('click', async () => {
  if (!borrandoId) return
  const { error } = await db.from('productos').delete().eq('id', borrandoId)
  document.getElementById('modal-delete').classList.add('hidden')
  borrandoId = null
  if (error) alert('Error al eliminar: ' + error.message)
  else await cargarProductos()
})

/* ── Helpers ──────────────────────────────────────────── */
function mostrarMsg(txt, tipo) {
  const el = document.getElementById('form-msg')
  el.textContent = txt
  el.className = `form-msg ${tipo}`
  el.classList.remove('hidden')
  setTimeout(() => el.classList.add('hidden'), 4000)
}

/* ── Init ─────────────────────────────────────────────── */
initAuth()
