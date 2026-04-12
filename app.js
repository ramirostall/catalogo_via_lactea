/* ============================================================
   CATÁLOGO DISTRIBUCIONES — app.js
   ============================================================ */

let todosLosProductos = [];   // lista plana de todos los productos
let categorias = [];

/* ── Formateador de precios ARS ───────────────────────────── */
const fmt = n =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/* ── Generar icono de placeholder según categoría ─────────── */
const iconoPlaceholder = catId => {
  const map = { quesos: '🧀', fiambres: '🥩', dulces: '🍯', aceitunas: '🫒', aderezos: '🫙', 'sin-tacc': '🌾' };
  return map[catId] ?? '📦';
};

/* ── Construir HTML de una tarjeta ────────────────────────── */
function buildCard(prod, catId) {
  const tagsHTML = [
    `<span class="tag tag-marca">${prod.marca}</span>`,
    ...prod.tags.map(t => `<span class="tag tag-sintacc">${t}</span>`)
  ].join('');

  const imgHTML = prod.imagen
    ? `<img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy">`
    : `<div class="product-img-placeholder">${iconoPlaceholder(catId)}</div>`;

  const promoHTML = prod.promo
    ? `<div class="precio-promo">
         <span class="promo-badge">x${prod.promo.cantidad}</span>
         $${fmt(prod.promo.precio)} <span style="font-weight:400;color:var(--texto-muted)">c/u</span>
       </div>`
    : '';

  return `
    <div class="product-card" data-id="${prod.id}" data-cat="${catId}" data-nombre="${prod.nombre.toLowerCase()}" data-marca="${prod.marca.toLowerCase()}">
      <div class="tags-row">${tagsHTML}</div>
      <div class="product-nombre">${prod.nombre}</div>
      <div class="product-img-wrap">${imgHTML}</div>
      <div class="precios-wrap">
        <div class="precio-principal">$${fmt(prod.precio)}<span class="unidad">x ${prod.unidad}</span></div>
        ${promoHTML}
      </div>
    </div>`;
}

/* ── Renderizar todo el catálogo ──────────────────────────── */
function renderCatalogo(data) {
  categorias = data.categorias;

  // Construir lista plana para búsqueda
  todosLosProductos = [];
  categorias.forEach(cat => {
    cat.subcategorias.forEach(sub => {
      sub.productos.forEach(p => {
        todosLosProductos.push({ ...p, catId: cat.id, subId: sub.id });
      });
    });
  });

  // Inyectar nav
  const nav = document.getElementById('nav-cats');
  nav.innerHTML = categorias.map(cat => `
    <button class="nav-cat-btn" data-cat="${cat.id}">
      <span class="icon">${cat.icono}</span>${cat.nombre}
    </button>`).join('');

  // Inyectar secciones
  const main = document.getElementById('catalogo');
  main.innerHTML = categorias.map(cat => {
    // Si es "sin-tacc" mostramos sólo productos con tag
    let subcatsHTML;
    if (cat.id === 'sin-tacc') {
      const prods = todosLosProductos.filter(p => p.tags.includes('SIN TACC'));
      subcatsHTML = `
        <div class="subcat-section">
          <div class="subcat-title">Todos los productos certificados Sin TACC</div>
          <div class="productos-grid">
            ${prods.map(p => buildCard(p, p.catId)).join('') || '<p style="color:var(--texto-muted)">Sin productos.</p>'}
          </div>
        </div>`;
    } else {
      subcatsHTML = cat.subcategorias.map(sub => {
        if (!sub.productos.length) return '';
        return `
          <div class="subcat-section" data-subcat="${sub.id}">
            <div class="subcat-title">${sub.nombre}</div>
            <div class="productos-grid">
              ${sub.productos.map(p => buildCard(p, cat.id)).join('')}
            </div>
          </div>`;
      }).join('');
    }

    return `
      <section class="cat-section" id="cat-${cat.id}" data-cat="${cat.id}">
        <div class="cat-title">
          <span style="font-size:1.6rem">${cat.icono}</span>
          <h2 class="cat-title-text">${cat.nombre}</h2>
          <div class="cat-title-line"></div>
        </div>
        ${subcatsHTML}
      </section>`;
  }).join('');

  // Inyectar opciones de filtro por marca
  const marcas = [...new Set(todosLosProductos.map(p => p.marca))].sort();
  const sel = document.getElementById('filter-marca');
  marcas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.toLowerCase();
    opt.textContent = m;
    sel.appendChild(opt);
  });

  // Activar primer nav
  activarNav(categorias[0].id);
  bindEvents();
}

/* ── Activar categoría en el nav ──────────────────────────── */
function activarNav(catId) {
  document.querySelectorAll('.nav-cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === catId);
  });
  // Scroll a la sección
  const sec = document.getElementById(`cat-${catId}`);
  if (sec) {
    const offset = 64;
    const top = sec.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

/* ── Búsqueda + filtro ────────────────────────────────────── */
function aplicarFiltros() {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const marca = document.getElementById('filter-marca').value;
  const soloPromo = document.getElementById('filter-promo')?.checked ?? false;

  let visibles = 0;

  document.querySelectorAll('.product-card').forEach(card => {
    const nombre = card.dataset.nombre ?? '';
    const cardMarca = card.dataset.marca ?? '';

    const matchQuery = !query || nombre.includes(query) || cardMarca.includes(query);
    const matchMarca = !marca || cardMarca === marca;
    const matchPromo = !soloPromo || card.querySelector('.precio-promo');

    const show = matchQuery && matchMarca && matchPromo;
    card.style.display = show ? '' : 'none';
    if (show) visibles++;
  });

  // Ocultar subcats vacías
  document.querySelectorAll('.subcat-section').forEach(sub => {
    const hayVisibles = [...sub.querySelectorAll('.product-card')].some(c => c.style.display !== 'none');
    sub.style.display = hayVisibles ? '' : 'none';
  });

  // Ocultar secciones vacías
  document.querySelectorAll('.cat-section').forEach(sec => {
    const hayVisibles = [...sec.querySelectorAll('.product-card')].some(c => c.style.display !== 'none');
    sec.style.display = hayVisibles ? '' : 'none';
  });

  // Contador
  document.getElementById('results-count').innerHTML =
    `<strong>${visibles}</strong> producto${visibles !== 1 ? 's' : ''}`;

  // No results
  document.getElementById('no-results').classList.toggle('visible', visibles === 0);
}

/* ── Bind de eventos ──────────────────────────────────────── */
function bindEvents() {
  // Nav categorías
  document.getElementById('nav-cats').addEventListener('click', e => {
    const btn = e.target.closest('.nav-cat-btn');
    if (!btn) return;
    // Reset filtros al cambiar categoría
    document.getElementById('search-input').value = '';
    document.getElementById('filter-marca').value = '';
    // Mostrar todo
    document.querySelectorAll('.product-card, .subcat-section, .cat-section').forEach(el => el.style.display = '');
    document.getElementById('results-count').innerHTML =
      `<strong>${todosLosProductos.length}</strong> productos`;
    document.getElementById('no-results').classList.remove('visible');
    activarNav(btn.dataset.cat);
  });

  // Búsqueda
  document.getElementById('search-input').addEventListener('input', aplicarFiltros);
  document.getElementById('filter-marca').addEventListener('change', aplicarFiltros);

  // Intersection observer para el nav activo al scroll
  const secciones = document.querySelectorAll('.cat-section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const catId = entry.target.dataset.cat;
        document.querySelectorAll('.nav-cat-btn').forEach(btn =>
          btn.classList.toggle('active', btn.dataset.cat === catId));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  secciones.forEach(s => observer.observe(s));
}

/* ── Fetch y arranque ─────────────────────────────────────── */
fetch('data/productos.json')
  .then(r => r.json())
  .then(data => {
    renderCatalogo(data);
    // Actualizar contador inicial
    document.getElementById('results-count').innerHTML =
      `<strong>${todosLosProductos.length}</strong> productos`;
  })
  .catch(err => {
    console.error('Error cargando productos:', err);
    document.getElementById('catalogo').innerHTML =
      `<p style="color:var(--rojo-promo);text-align:center;padding:60px">
        ⚠️ No se pudieron cargar los productos. Revisá la consola.
      </p>`;
  });
