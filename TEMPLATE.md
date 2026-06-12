# Kodia Shop — Plantilla white-label de tienda online

Plantilla de e-commerce (React + Firebase + Vercel) lista para clonar por cliente.
Se adapta a cualquier rubro — ropa, ferretería, cosméticos — porque toda la
identidad y el comportamiento de la tienda se configuran **desde el admin**,
sin tocar código.

## Qué se configura desde el admin (sin código)

**Diseño → Marca** (`settings/store.branding` en Firestore):

| Campo | Efecto |
|---|---|
| Nombre / Logo | Header de la tienda, títulos, mensajes de WhatsApp |
| Color de acento | Botones, precios, detalles (variables CSS en runtime) |
| Texto del marquee | Cinta superior animada |
| WhatsApp | Botón flotante + envío de órdenes (vacío = ocultos) |
| Moneda | Prefijo de todos los precios (C$, $, Q, L…) |
| Etiqueta de variante | "TALLA" para ropa, "MEDIDA"/"PRESENTACIÓN" para ferretería |
| Título del carrito / Prefijo de orden | Personalización fina |

**Diseño → Datos de pago**: cuentas bancarias/instrucciones que ve el cliente en el checkout.

**Diseño → Zonas de envío**: lista de zonas con su costo (reemplaza las zonas fijas).

**Super Admin** (vista visible solo para correos en `settings/platform.superAdmins`):

- **Módulos**: activa/desactiva Hero, Descuentos, Pop-ups, Guía de medidas, WhatsApp, Analytics. Lo apagado desaparece de la tienda y del panel.
- **Roles**: crea roles (ej. VENDEDOR) y marca qué vistas del panel ven.
- **Usuarios**: asigna rol por correo. La cuenta (correo+contraseña) se crea en Firebase Console → Authentication.
- **Super admins**: el equipo de la agencia. *El primer usuario que inicia sesión en un proyecto nuevo se convierte automáticamente en super admin.*

## Setup de un cliente nuevo

1. **Clona este repo** a un repositorio nuevo del cliente.
2. **Crea un proyecto Firebase**: activa Firestore y Authentication (Email/Password). Crea el primer usuario admin en Authentication.
3. **Crea una cuenta ImgBB** (hosting de imágenes) y copia su API key.
4. **Reemplaza los placeholders** (busca `TU_FIREBASE_API_KEY`, `TU_PROYECTO`, `TU_IMGBB_API_KEY`):
   - `index.html`, `product.html`, `checkout.html`, `admin/index.html`, `middleware.js`
5. **Ajusta el SEO estático** (busca `MI TIENDA` y `mitienda.vercel.app`):
   - `index.html` (title, meta, JSON-LD — cambia `@type` al rubro: `ClothingStore`, `HardwareStore`, `Store`), `product.html`, `checkout.html`, `middleware.js` (`BRAND`, `SITE`), `sitemap.xml`, `robots.txt`
6. **Compila y despliega**: `npm install && npm run build`, push a GitHub y conecta el repo en Vercel (no necesita build en Vercel: `vercel.json` ya lo desactiva, los `dist/` van commiteados).
7. **Primer login en `/admin`**: el primer usuario queda como super admin. Configura Marca, Pagos, Envíos y apaga los módulos que el cliente no use.
8. **Firestore Rules** (recomendado): restringe escritura de `settings/*`, `products`, `discountCodes`, `popupBanners` a usuarios autenticados; `orders` permite create público y lectura/edición autenticada.

## Estructura de datos (Firestore)

```
settings/store      → branding, features, shippingZones, paymentInfo,
                      heroSlides, categories, categoryCovers, sizeGuide
settings/platform   → superAdmins[], users[{email, role}], roles{ROL: [vistas]}
products/*          → título, sku, precios, categoría, sizes[] (variantes), stockBySizes{}
orders/*            → cliente, items, totales, estado, comprobante
discountCodes/*     → cupones
popupBanners/*      → pop-ups
analytics/*         → eventos (page_view, product_view, add_to_cart, whatsapp_click…)
```

## Notas

- **"Variantes"** = el antiguo campo "tallas": sirve para tallas de ropa, medidas de herramientas, presentaciones, etc. Un producto sin variantes se vende como "ÚNICA".
- El integrador de HubSpot (`/api/hubspot`) es opcional; si el cliente no lo usa, elimina la llamada en `js/checkout-entry.js` o el endpoint fallará silenciosamente (no rompe nada).
- El color por defecto de la plantilla es blanco/negro neutro; el cliente lo cambia en Diseño → Marca.
