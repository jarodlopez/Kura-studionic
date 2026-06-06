# KURA STUDIO

Tienda streetwear — React 18 (vía CDN) + Firebase Firestore. Sin framework
de build pesado: el JSX se pre-compila a un solo archivo con esbuild y el CSS
de Tailwind se genera estático. El navegador del cliente ya **no** compila nada.

## Estructura

```
index.html                 → shell HTML (carga dist/styles.css y dist/app.js)
admin.html                 → panel de administración
js/                        → código fuente (se edita aquí)
  utils.js                 → helpers compartidos
  App.js                   → componente raíz + estado + handlers
  components/              → HomeView, ProductDetail, Cart, PopupBanner, OrderConfirmModal
src/input.css              → directivas Tailwind + estilos propios
tailwind.config.js         → tema (colores, fuentes, animaciones)
build.js                   → compila js/ → dist/app.js
dist/                      → SALIDA del build (se commitea; lo sirve Vercel)
api/hubspot.js             → función serverless de Vercel
```

## Cómo trabajar

1. Editás los archivos en `js/` y/o estilos en `src/input.css`.
2. Antes de subir, regenerás el build:

   ```bash
   npm install   # solo la primera vez
   npm run build
   ```

   Esto produce `dist/styles.css` (CSS minificado) y `dist/app.js`
   (JSX transpilado y minificado).
3. Commiteás **tanto los fuentes (`js/`, `src/`) como `dist/`** y subís.

> Importante: si editás `js/` o `src/` pero **no** corrés `npm run build`,
> la web seguirá mostrando la versión anterior (la de `dist/`).

### Atajos

- `npm run build:css` → solo el CSS
- `npm run build:js`  → solo el JS
