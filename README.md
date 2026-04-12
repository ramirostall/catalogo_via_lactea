# DVR Distribuciones — Catálogo Mayorista

Catálogo web estático para distribuidora de quesos, fiambres y productos afines.  
Stack: **HTML + CSS + JS vanilla** · Deploy: **Vercel**

---

## 🚀 Cómo arrancar el proyecto

### 1. Crear el repositorio en GitHub

1. Entrá a [github.com](https://github.com) → **New repository**
2. Nombre: `catalogo-dvr` (o el que quieras)
3. Dejalo en **Public** (es gratis en Vercel)
4. **No** marques "Initialize with README" (ya tenés uno)
5. Copiá la URL del repo (ej: `https://github.com/tu-usuario/catalogo-dvr.git`)

### 2. Subir el proyecto

Abrí una terminal en la carpeta del proyecto y ejecutá:

```bash
git init
git add .
git commit -m "primer commit — catálogo DVR"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/catalogo-dvr.git
git push -u origin main
```

### 3. Deploy en Vercel

1. Entrá a [vercel.com](https://vercel.com) → **Add New Project**
2. Importá tu repositorio de GitHub
3. Vercel detecta que es HTML estático automáticamente
4. Click **Deploy** — ¡listo! Te da una URL pública

---

## 📦 Cómo agregar / editar productos

Abrí el archivo `data/productos.json`. Cada producto tiene esta forma:

```json
{
  "id": 1,
  "nombre": "Cremón Fraccionado La Serenísima",
  "marca": "La Serenísima",
  "precio": 13255.31,
  "unidad": "kg",
  "tags": ["SIN TACC"],
  "promo": { "cantidad": 4, "precio": 7505.02 },
  "imagen": ""
}
```

- **tags**: podés poner `"SIN TACC"`, `"OFERTA"`, o dejarlo vacío `[]`
- **promo**: si no hay promo, poné `null`
- **imagen**: URL de la imagen del producto (podés subir a [imgbb.com](https://imgbb.com) gratis)

### Para publicar los cambios:
```bash
git add data/productos.json
git commit -m "actualizo precios mayo"
git push
```
Vercel re-despliega automáticamente en ~30 segundos.

---

## 🏗️ Estructura del proyecto

```
catalogo-dvr/
├── index.html          ← página principal
├── css/
│   └── styles.css      ← todos los estilos
├── js/
│   └── app.js          ← lógica del catálogo
├── data/
│   └── productos.json  ← ACÁ EDITÁS LOS PRODUCTOS
└── README.md
```

---

## 📱 Funcionalidades

- ✅ Navegación por categorías sticky
- ✅ Búsqueda en tiempo real por nombre y marca
- ✅ Filtro por marca
- ✅ Badges SIN TACC y promos x4/x6
- ✅ Diseño oscuro premium con animaciones
- ✅ 100% responsive (mobile + desktop)
- ✅ Botón WhatsApp flotante
- ✅ Sin backend, sin base de datos, sin costo

---

## 🔮 Futuro (cuando quieras escalar)

- **Panel admin**: agregar [Supabase](https://supabase.com) como base de datos con panel visual para editar productos sin tocar código
- **Imágenes**: usar un CDN como Cloudinary para subir fotos
- **Pedidos**: integrar carrito y envío por WhatsApp con la API de wa.me

---

## 📞 WhatsApp

Cambiá el número en `index.html` línea del botón WhatsApp:
```html
<a href="https://wa.me/5492901000000" ...>
```
Reemplazá `5492901000000` con tu número internacional (549 + código de área sin 0 + número).
