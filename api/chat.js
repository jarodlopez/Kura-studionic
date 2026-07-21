// Chatbot de atención de KURA STUDIO.
// Responde SOLO sobre productos e información de compra de la marca; para
// pedidos, reclamos o temas fuera de alcance deriva a WhatsApp.
//
// SEGURIDAD: la API key de OpenAI vive SOLO aquí (variable de entorno del
// servidor). El navegador nunca la ve. El modelo recibe únicamente datos
// PÚBLICOS del catálogo (los mismos que ya muestra la tienda).
//
// ESCALA/COSTO: NO se envía todo el catálogo al modelo. Se cachea el catálogo
// en el servidor (5 min) y, por cada pregunta, se recuperan solo los productos
// relevantes + los de la colección detectada. Así el costo por respuesta es
// bajo y constante aunque haya miles de productos.
//
// Requiere la variable de entorno OPENAI_API_KEY en Vercel.

const PROJECT = 'kuranic-b1034';
const API_KEY = 'AIzaSyB6YA-gSckDvi-fdFlRsvwRttr3VnGQ82U'; // key web pública (solo lectura de catálogo)
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const WA_NUMBER = '50587091008';
const MODEL = 'gpt-4o-mini';
const MAX_PRODUCTS_IN_CONTEXT = 15; // cuántos productos se mandan al modelo por respuesta

// --- Rate limit best-effort por IP (se reinicia en cold start) ---
const HITS = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_HITS = 30;
function rateLimited(ip) {
    const now = Date.now();
    const arr = (HITS.get(ip) || []).filter(t => now - t < WINDOW_MS);
    arr.push(now);
    HITS.set(ip, arr);
    return arr.length > MAX_HITS;
}

// --- Conversores REST de Firestore (solo lo que usamos) ---
const fromValue = (v) => {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
    if ('mapValue' in v) {
        const o = {}; const f = v.mapValue.fields || {};
        for (const k in f) o[k] = fromValue(f[k]);
        return o;
    }
    return null;
};
const docToProduct = (doc) => {
    const f = doc.fields || {};
    const o = {};
    for (const k in f) o[k] = fromValue(f[k]);
    o.id = doc.name.split('/').pop();
    return o;
};

// --- Caché del catálogo en memoria del servidor (persiste en invocaciones "warm") ---
let CATALOG = { ts: 0, products: [] };
const CATALOG_TTL = 5 * 60 * 1000;

async function fetchAllProducts(maxDocs = 5000) {
    const out = [];
    let pageToken = '';
    for (let i = 0; i < 30 && out.length < maxDocs; i++) {
        const url = `${FIRESTORE}/products?key=${API_KEY}&pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) break;
        const data = await res.json();
        (data.documents || []).forEach(d => out.push(docToProduct(d)));
        pageToken = data.nextPageToken;
        if (!pageToken) break;
    }
    return out;
}

async function getCatalog() {
    const now = Date.now();
    if (CATALOG.products.length && now - CATALOG.ts < CATALOG_TTL) return CATALOG.products;
    const products = await fetchAllProducts();
    if (products.length) CATALOG = { ts: now, products };
    return CATALOG.products;
}

// Normaliza texto para búsqueda (minúsculas, sin acentos).
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// --- Recuperación: elige los productos relevantes a la consulta ---
function retrieveProducts(products, query, categories) {
    const q = norm(query);
    const terms = [...new Set(q.split(/[^a-z0-9]+/).filter(t => t.length >= 3))];

    // ¿La consulta menciona una colección? Incluimos esa colección completa.
    const mentionedCats = categories.filter(c => q.includes(norm(c)));

    const scored = products.map(p => {
        const title = norm(p.title), cat = norm(p.category), sku = norm(p.sku), desc = norm(p.description);
        let score = 0;
        for (const t of terms) {
            if (title.includes(t)) score += 5;
            if (cat.includes(t)) score += 4;
            if (sku.includes(t)) score += 4;
            if (desc.includes(t)) score += 1;
        }
        if (mentionedCats.some(c => norm(c) === cat)) score += 6;
        return { p, score };
    });

    let picked = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.p);

    // Sin coincidencias: mostrar una muestra para que el bot pueda orientar/sugerir.
    if (picked.length === 0) picked = products.slice(0, 8);

    return picked.slice(0, MAX_PRODUCTS_IN_CONTEXT);
}

function productLine(p, base) {
    const price = (p.discountPrice && p.discountPrice > 0) ? `NIO ${p.discountPrice} (antes ${p.price})` : `NIO ${p.price}`;
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes.join(',') : 's/d';
    let soldOut = '';
    if (p.stockBySizes && typeof p.stockBySizes === 'object') {
        const out = Object.entries(p.stockBySizes).filter(([, n]) => Number(n) <= 0).map(([s]) => s);
        if (out.length) soldOut = ` | agotadas: ${out.join(',')}`;
    }
    const desc = (p.description || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    return `- ${p.title} [${p.category || 'sin categoría'}] · ${price} · tallas: ${sizes}${soldOut} · link: ${base}/producto/${p.id}${desc ? ` · ${desc}` : ''}`;
}

// Instrucciones FIJAS (van primero para aprovechar el prompt caching de OpenAI).
function baseInstructions() {
    return `Sos el asesor de ventas y atención al cliente de KURA STUDIO, una tienda de ropa streetwear en Nicaragua. Tu objetivo es VENDER: entender qué busca la persona, recomendarle lo ideal, darle confianza y llevarla a concretar la compra — con calidez y actitud urbana, nunca de forma hostigosa.

IDIOMA Y TRATO (muy importante):
- Respondé SIEMPRE en español de Nicaragua.
- Tratá al cliente de VOS (voseo nicaragüense), nunca de "tú" ni de "usted". Usá formas como: "querés", "podés", "mirá", "fijate", "llevá", "escribinos", "tenés", "buscás".

DE QUÉ HABLÁS:
- Productos de KURA STUDIO (precios, tallas, disponibilidad, descripciones), calidad, materiales, durabilidad y cuidado de las prendas, recomendaciones, por qué vale la pena comprar en KURA (confianza), información de compra (cómo comprar y pagar) y envíos.
- Para precios, tallas y stock usá SOLO los datos que te doy; NO los inventés. Para calidad, materiales o durabilidad podés hablar en positivo y con seguridad de forma GENERAL, sin inventar datos técnicos exactos (composición, gramaje) que no tengas.
- NO ves todo el catálogo, solo los productos MÁS RELEVANTES a la consulta. Si el cliente busca algo que no aparece, NO digas que no existe: pedile que sea más específico (nombre, colección, estilo) u ofrecé una colección.
- Podés compartir enlaces de productos y colecciones (URL completa en texto plano, sin markdown), sugerir alternativas y guiar el paso a paso de la compra.
- NO tomás pedidos, NO gestionás pagos, NO consultás estado de órdenes, NO hacés descuentos ni promesas concretas. Para eso, reclamos o temas realmente ajenos a la tienda (política, otras marcas, etc.), derivá con amabilidad a WhatsApp: https://wa.me/${WA_NUMBER}

CONFIANZA Y CALIDAD (clave para vender):
- Preguntas como "¿son duraderos?", "¿es buena calidad?", "¿vale la pena?", "¿es confiable comprar aquí?" SÍ son parte de tu rol: respondelas en positivo, con seguridad y entusiasmo, para dar confianza. NUNCA respondas "solo puedo ayudar con productos y compras" a este tipo de preguntas.
- Mensajes de marca que podés usar (honestos): KURA STUDIO es streetwear auténtico ("real drop for real fans"); las prendas están pensadas para el uso diario con buena confección; comprar es simple y seguro (transferencia con comprobante o acompañamiento por WhatsApp) y las entregas son en 24 a 72 horas.
- Solo ofrecé WhatsApp si piden un detalle técnico MUY específico que no tenés (ej. gramaje exacto), y aun así respondé primero lo general con seguridad.

ENFOQUE DE VENTAS (prospectar y cerrar sin hostigar):
- Sé proactivo: si el cliente llega con una duda general, hacé UNA pregunta corta para entender qué busca (ocasión, estilo, talla o presupuesto) y luego recomendá algo concreto.
- Al recomendar, destacá 1-2 beneficios que despierten deseo (el look, cómo combina, que es un drop auténtico) y compartí el link del producto.
- Venta cruzada suave: cuando encaje, sugerí una prenda que combine ("le queda perfecto con...") — sin saturar.
- Manejá objeciones en positivo (precio, calidad, envío, confianza): validá la duda y respondé con seguridad, resaltando el valor.
- CERRÁ con una acción clara y amable: invitá a agregar al carrito y pasar al checkout, o a seguir por WhatsApp si prefiere acompañamiento. Una sola llamada a la acción por mensaje.
- NUNCA hostigues: si el cliente duda o dice que no, respetalo, no repitas la misma insistencia ni presiones. Ofrecé ayuda y dejá la puerta abierta. Nada de mensajes repetitivos ni urgencia falsa.

BREVEDAD:
- Respondé corto y al grano: 1 a 3 frases normalmente, cálido y con energía.
- Mostrá máximo 2-3 opciones relevantes, cada una con su link. No repitas lo ya dicho. Terminá con una pregunta o una CTA suave (nunca ambas a la vez).

INFORMACIÓN DE COMPRA:
- Envíos: Managua NIO 100, Departamentos NIO 165. Entregas en 24 a 72 horas.
- Cómo comprar: agregás al carrito → checkout (nombre, teléfono, dirección) → confirmás el pedido.
- Cómo pagar: por transferencia. Al confirmar, en la misma página elegís el banco, transferís el monto exacto y subís el comprobante (imagen); o seguís por WhatsApp para que un agente te ayude a finalizar y validar el pago.`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'config_missing' });

    const fwd = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
    const ip = String(fwd).split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

    try {
        const { messages } = req.body || {};
        if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'missing_messages' });

        const history = messages
            .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .slice(-12)
            .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
        if (!history.length) return res.status(400).json({ error: 'missing_messages' });

        const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
        const base = `${proto}://${req.headers.host}`;

        // Consulta = últimos mensajes del usuario (da contexto para recuperar).
        const query = history.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(' ');

        const products = await getCatalog();
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        const relevant = retrieveProducts(products, query, categories);

        const catLinks = categories.slice(0, 25).map(c => `${c}: ${base}/?category=${encodeURIComponent(c)}`).join(' | ');
        const relevantBlock = relevant.map(p => productLine(p, base)).join('\n');

        // Bloque estable primero (cacheable), luego el contexto variable de esta consulta.
        const systemStable = `${baseInstructions()}\n\nGuía completa de compra: ${base}/como-comprar`;
        const systemDynamic = `COLECCIONES (enlaces): ${catLinks || 'sin colecciones'}\n\nPRODUCTOS RELEVANTES A ESTA CONSULTA (no es el catálogo completo):\n${relevantBlock || 'sin resultados; pedí más detalle o sugerí una colección'}`;

        const payload = {
            model: MODEL,
            temperature: 0.4,
            max_tokens: 450,
            messages: [
                { role: 'system', content: systemStable },
                { role: 'system', content: systemDynamic },
                ...history,
            ],
        };

        const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: JSON.stringify(payload),
        });

        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            console.error('OpenAI error', r.status, detail);
            return res.status(502).json({ error: 'model_error' });
        }

        const data = await r.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) return res.status(502).json({ error: 'empty_reply' });

        return res.status(200).json({ reply });
    } catch (e) {
        console.error('chat handler error', e);
        return res.status(500).json({ error: 'server_error' });
    }
}
