# Vía Láctea — Catálogo Mayorista 🧀

Catálogo web de una distribuidora mayorista de lácteos y alimentos (quesos, fiambres, dulces, aceitunas y más), con catálogo público para visitantes y un panel de administración protegido con login.

Sin frameworks: **HTML + CSS + JavaScript vanilla (ES modules)** sobre **Supabase** (Auth, Postgres con RLS y Storage para imágenes).

---

## Características

### Catálogo público (`index.html`)
- Productos agrupados por categoría y subcategoría, ordenadas dinámicamente.
- Navegación por categorías con scroll suave y barra sticky.
- Búsqueda por nombre, marca o categoría.
- Filtros por marca y "solo con promo".
- Precios promocionales por cantidad (ej. "x4 c/u").
- Sección virtual "Sin TACC" para productos con esa etiqueta.
- Botón flotante de WhatsApp. Responsive.

### Panel admin (`admin.html`)
- Login con correo y contraseña (Supabase Auth, siempre arranca deslogueado).
- Registro de usuarios; el rol `admin` lo asigna quien administra el proyecto.
- CRUD completo de productos: imagen con preview, promos, etiqueta Sin TACC.
- Gestor de categorías dinámicas (nombre, emoji, orden, slug autogenerado).
- Subida de imágenes con validación de formato y tamaño (máx. 5 MB).

### Seguridad
- **RLS en Supabase**: lectura pública del catálogo; escritura solo para usuarios con rol `admin`.
- Escape de HTML (`esc()`) en todas las interpolaciones de `innerHTML` para prevenir XSS.
- Validación de tipo y tamaño en la subida de imágenes.

---

## Stack

| Capa            | Tecnología                                       |
|-----------------|--------------------------------------------------|
| Frontend        | HTML, CSS, JavaScript vanilla (ES modules)       |
| Backend         | Supabase — Auth + Postgres + Storage             |
| Sin build step  | Se sirve como estática (los módulos se cargan vía `<script type="module">`) |

No hay `package.json` ni bundler: no se necesitan dependencias para correr.

---

## Estructura del proyecto

```
.
├── index.html              # Catálogo público
├── admin.html              # Panel de administración
├── css/
│   ├── styles.css          # Estilos del catálogo
│   └── admin.css           # Estilos del panel admin
├── js/
│   ├── supabase.js         # Cliente, categorías, helpers (fmt, esc, getImageUrl)
│   ├── app.js              # Catálogo público (render, filtros, navegación)
│   └── admin.js            # Panel admin (auth, CRUD, upload, categorías)
├── assets/                 # Logo e íconos
└── supabase/
    └── migracion_categorias.sql  # Migración: tabla categorías + RLS
```

---

## Puesta en marcha

### 1. Servir la página

Al usar ES modules (imports), la página **no puede abrirse con `file://`** — hay que servirla por HTTP. Cualquier opción sirve:

```bash
# Python
python -m http.server 8000

# VS Code → Live Server, o cualquier servidor estático
```

### 2. Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Copiá la **URL** y la **anon key** (publicable) en `js/supabase.js`:
   ```js
   const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co'
   const SUPABASE_KEY = 'tu-anon-key'
   ```
   > La anon key es pública por diseño y segura porque la protección real la da el **RLS** (solo admins escriben).

3. Ejecutá `supabase/migracion_categorias.sql` en **SQL Editor** para crear la tabla `categorias` y sus políticas de RLS.

### 3. Tablas necesarias

La app espera estas tablas en `public`:

- **`productos`**: `id`, `nombre`, `marca`, `unidad`, `categoria`, `subcategoria`, `precio`, `promo_cantidad`, `promo_precio`, `tags`, `imagen`
- **`categorias`**: `id`, `slug`, `nombre`, `icono`, `orden` (creada por la migración)
- **`profiles`**: `id`, `role` (con `role = 'admin'` para quienes pueden escribir)

### 4. Storage

1. Creá un bucket público llamado `productos`.
2. Configurá el RLS del bucket: lectura pública, escritura solo admin (misma lógica que `productos`/`categorias`).

### 5. Crear tu usuario admin

1. Abrí `admin.html` y registrate con correo y contraseña.
2. En la tabla `profiles` de Supabase, cambiá el `role` de tu usuario a `admin`.
3. Volvé a iniciar sesión: ya tenés acceso completo al panel.

---

## Panel de administración

El acceso está en `admin.html` (o desde el botón **Admin** del catálogo).

- **Productos**: buscar, filtrar por categoría, editar o eliminar (con confirmación).
- **Nuevo Producto**: nombre, marca, unidad, categoría/subcategoría, precio, promo (cantidad mínima + precio), imagen (drag & drop o clic, máx. 5 MB, formato imagen) y etiqueta Sin TACC.
- **Categorías**: alta, edición, orden y borrado (protegido si tiene productos asignados).

---

## Despliegue

Como es un sitio 100% estático, se puede publicar en cualquier hosting gratuito (Netlify, Vercel, Cloudflare Pages, GitHub Pages). Solo hay que:

1. Subir la carpeta del proyecto (HTML, CSS, JS, assets).
2. Asegurarse de que `js/supabase.js` apunte al proyecto de Supabase correcto.
3. Quedarse tranquilo: toda la lógica de permisos vive en el RLS del lado de Supabase, no en el front.

---

## Aviso legal

Los precios son orientativos y pueden variar sin previo aviso. El catálogo es una vitrina informativa — los pedidos se coordinan por WhatsApp.