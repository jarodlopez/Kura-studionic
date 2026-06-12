# MIGRACIÓN — Instrucciones para Claude (léeme primero)

> **Para el humano:** subí el ZIP de este branch al chat de una sesión de Claude Code
> apuntando al repo destino y decile: "Seguí las instrucciones del MIGRATION.md que
> está dentro del ZIP". Este archivo le da todo el contexto.

## Contexto

Este ZIP contiene **Kodia Shop**, una plantilla white-label de tienda online
(React + Firebase + Vercel), desarrollada por Kodialabs a partir de la tienda
KURA STUDIO (repo `jarodlopez/Kura-studionic`, rama `kodia-template-clean`,
commit `1d6bc90`). La plantilla ya está completamente genericizada:

- Sin credenciales reales: Firebase/ImgBB son placeholders (`TU_FIREBASE_API_KEY`, etc.)
- Sin marca: textos "MI TIENDA", color neutro blanco/negro
- Toda la identidad se configura en runtime desde el admin (ver `TEMPLATE.md`)
- Incluye Super Admin con módulos activables, roles y usuarios del panel
- Los `dist/*` van commiteados (Vercel no compila; `vercel.json` lo desactiva)

## Tarea: migrar este contenido al repo destino (`jarodlopez/Kodiashop`)

1. Extrae el ZIP. Si vino del archive de GitHub, el contenido está dentro de una
   carpeta `Kura-studionic-kodia-template-clean/` — lo que va al repo es el
   **contenido** de esa carpeta, no la carpeta misma.
2. Copia todos los archivos a la raíz del repo destino. **Elimina este
   `MIGRATION.md`** — no forma parte de la plantilla.
3. Verifica que estén los archivos clave: `TEMPLATE.md`, `index.html`,
   `product.html`, `checkout.html`, `admin/index.html`,
   `admin/views/SuperAdminView.js`, `js/`, `dist/`, `middleware.js`,
   `vercel.json`, `package.json`, `.gitignore`, y los binarios
   `admin/icons/*.png`.
4. Confirma que NO haya credenciales reales: `grep -r "AIzaSy\|kuranic" .`
   no debe devolver nada (fuera de node_modules).
5. Haz **un único commit inicial** en `main`:
   `Initial commit — Kodia Shop white-label store template`
6. Push a `origin main`.
7. Sanity check opcional: `npm install && npm run build` debe regenerar `dist/`
   sin errores (no es obligatorio commitear el resultado si no cambió).

## Después del push, recuérdale al humano

- Activar **Settings → Template repository** en GitHub para tener el botón
  "Use this template" por cada cliente nuevo.
- El flujo por cliente está documentado en `TEMPLATE.md` (crear Firebase,
  reemplazar placeholders, deploy en Vercel, primer login = super admin).
- Los íconos en `admin/icons/` aún son de la primera tienda; reemplazarlos
  con el logo de cada cliente.
