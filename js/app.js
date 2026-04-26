import { db, CATEGORIAS, fmt, getImageUrl } from './supabase.js'

let todos = []

/* ── Icono placeholder ─────────────────────────────────── */
const iconoCat = id => ({ quesos:'🧀', fiambres:'🥩', dulces:'🍯', aceitunas:'🫒', aderezos:'🫙' }[id] ?? '📦')

/* ── Construir tarjeta ─────────────────────────────────── */
function buildCard(p) {
  const tags = p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const tagsHTML = [
    `<span class="tag tag-marca">${p.marca}</span>`,
    ...tags.map(t => `<span class="tag tag-sintacc">${t}</span>`)
  ].join('')

  const imgUrl = getImageUrl(p.imagen)
  const imgHTML = imgUrl
    ? `<img src="${imgUrl}" alt="${p.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'ph\\'>${iconoCat(p.categoria)}</div>'">`
    : `<div class="ph">${iconoCat(p.categoria)}</div>`

  const promoHTML = (p.promo_cantidad && p.promo_precio)
    ? `<div class="precio-promo">
         <span class="promo-badge">x${p.promo_cantidad}</span>
         $${fmt(p.promo_precio)} <span class="por-unidad">c/u</span>
       </div>`
    : ''

  return `
    <div class="product-card"
         data-id="${p.id}"
         data-cat="${p.categoria}"
         data-nombre="${(p.nombre||'').toLowerCase()}"
         data-marca="${(p.marca||'').toLowerCase()}"
         data-promo="${p.promo_cantidad ? '1' : ''}">
      <div class="tags-row">${tagsHTML}</div>
      <div class="product-nombre">${p.nombre}</div>
      <div class="product-img-wrap">${imgHTML}</div>
      <div class="precios-wrap">
        <div class="precio-principal">$${fmt(p.precio)}<span class="unidad">/ ${p.unidad}</span></div>
        ${promoHTML}
      </div>
    </div>`
}

/* ── Renderizar catálogo ───────────────────────────────── */
function renderCatalogo(productos) {
  todos = productos
  const catalogo = document.getElementById('catalogo')

  // Agrupar por categoria → subcategoria
  const grupos = {}
  productos.forEach(p => {
    const cat = p.categoria || 'otros'
    const sub = p.subcategoria || 'General'
    if (!grupos[cat]) grupos[cat] = {}
    if (!grupos[cat][sub]) grupos[cat][sub] = []
    grupos[cat][sub].push(p)
  })

  // Nav
  const navEl = document.getElementById('nav-cats')
  navEl.innerHTML = Object.keys(grupos).map(catId => {
    const info = CATEGORIAS[catId] || { nombre: catId, icono: '📦' }
    return `<button class="nav-cat-btn" data-cat="${catId}">
      <span>${info.icono}</span>${info.nombre}
    </button>`
  }).join('')

  // Secciones
  catalogo.innerHTML = Object.keys(grupos).map(catId => {
    const info = CATEGORIAS[catId] || { nombre: catId, icono: '📦' }
    const subsHTML = Object.keys(grupos[catId]).map(subNombre => {
      const prods = grupos[catId][subNombre]
      return `<div class="subcat-section" data-subcat="${subNombre}">
        <div class="subcat-title">${subNombre}</div>
        <div class="productos-grid">${prods.map(buildCard).join('')}</div>
      </div>`
    }).join('')

    return `<section class="cat-section" id="cat-${catId}" data-cat="${catId}">
      <div class="cat-header">
        <span class="cat-icon">${info.icono}</span>
        <h2>${info.nombre}</h2>
        <div class="cat-line"></div>
      </div>
      ${subsHTML}
    </section>`
  }).join('')

  // Sin TACC virtual
  const sinTacc = productos.filter(p => p.tags && p.tags.includes('SIN TACC'))
  if (sinTacc.length) {
    const btn = `<button class="nav-cat-btn" data-cat="sin-tacc"><span>🌾</span>Sin TACC</button>`
    navEl.insertAdjacentHTML('beforeend', btn)
    catalogo.insertAdjacentHTML('beforeend', `
      <section class="cat-section" id="cat-sin-tacc" data-cat="sin-tacc">
        <div class="cat-header">
          <span class="cat-icon">🌾</span>
          <h2>Sin TACC</h2>
          <div class="cat-line"></div>
        </div>
        <div class="subcat-section">
          <div class="subcat-title">Productos certificados Sin TACC</div>
          <div class="productos-grid">${sinTacc.map(buildCard).join('')}</div>
        </div>
      </section>`)
  }

  // Marcas en filtro
  const marcas = [...new Set(productos.map(p => p.marca))].sort()
  const sel = document.getElementById('filter-marca')
  marcas.forEach(m => {
    const o = document.createElement('option')
    o.value = m.toLowerCase()
    o.textContent = m
    sel.appendChild(o)
  })

  document.getElementById('results-count').innerHTML = `<strong>${todos.length}</strong> productos`
  document.getElementById('loading').classList.add('hidden')

  // Activar primer nav
  const firstCat = Object.keys(grupos)[0]
  activarNav(firstCat)
  bindEvents()
}

/* ── Activar categoría ─────────────────────────────────── */
function activarNav(catId) {
  document.querySelectorAll('.nav-cat-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === catId))
  const sec = document.getElementById(`cat-${catId}`)
  if (sec) {
    const top = sec.getBoundingClientRect().top + window.scrollY - 70
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

/* ── Filtros ───────────────────────────────────────────── */
function aplicarFiltros() {
  const q = document.getElementById('search-input').value.trim().toLowerCase()
  const marca = document.getElementById('filter-marca').value
  const soloPromo = document.getElementById('filter-promo').checked
  let visibles = 0

  document.querySelectorAll('.product-card').forEach(card => {
    const ok =
      (!q || card.dataset.nombre.includes(q) || card.dataset.marca.includes(q)) &&
      (!marca || card.dataset.marca === marca) &&
      (!soloPromo || card.dataset.promo === '1')
    card.style.display = ok ? '' : 'none'
    if (ok) visibles++
  })

  document.querySelectorAll('.subcat-section').forEach(s => {
    s.style.display = [...s.querySelectorAll('.product-card')].some(c => c.style.display !== 'none') ? '' : 'none'
  })
  document.querySelectorAll('.cat-section').forEach(s => {
    s.style.display = [...s.querySelectorAll('.product-card')].some(c => c.style.display !== 'none') ? '' : 'none'
  })

  document.getElementById('results-count').innerHTML = `<strong>${visibles}</strong> producto${visibles !== 1 ? 's' : ''}`
  document.getElementById('no-results').classList.toggle('hidden', visibles > 0)
}

/* ── Eventos ───────────────────────────────────────────── */
function bindEvents() {
  document.getElementById('nav-cats').addEventListener('click', e => {
    const btn = e.target.closest('.nav-cat-btn')
    if (!btn) return
    document.getElementById('search-input').value = ''
    document.getElementById('filter-marca').value = ''
    document.getElementById('filter-promo').checked = false
    document.querySelectorAll('.product-card, .subcat-section, .cat-section').forEach(el => el.style.display = '')
    document.getElementById('results-count').innerHTML = `<strong>${todos.length}</strong> productos`
    document.getElementById('no-results').classList.add('hidden')
    activarNav(btn.dataset.cat)
  })

  document.getElementById('search-input').addEventListener('input', aplicarFiltros)
  document.getElementById('filter-marca').addEventListener('change', aplicarFiltros)
  document.getElementById('filter-promo').addEventListener('change', aplicarFiltros)

  // Nav activo al scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.nav-cat-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.cat === e.target.dataset.cat))
      }
    })
  }, { rootMargin: '-40% 0px -55% 0px' })
  document.querySelectorAll('.cat-section').forEach(s => observer.observe(s))

  // Nav sticky
  const nav = document.getElementById('nav-cats-wrap')
  window.addEventListener('scroll', () => {
    nav.classList.toggle('sticky', window.scrollY > 200)
  })
}

/* ── Arranque ──────────────────────────────────────────── */
async function init() {
  const { data, error } = await db.from('productos').select('*').order('categoria').order('nombre')
  if (error) {
    console.error('Error cargando productos:', error)
    document.getElementById('loading').innerHTML = `<p style="color:#e53e3e">⚠️ Error al cargar productos. Revisá la consola.</p>`
    return
  }
  if (!data || data.length === 0) {
    document.getElementById('loading').innerHTML = `<p style="color:#888">No hay productos cargados todavía.</p>`
    return
  }
  renderCatalogo(data)
}

init()
