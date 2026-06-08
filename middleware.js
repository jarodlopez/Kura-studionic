const BOT_UA = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|googlebot|bingbot/i;
const SITE = 'https://kura-studionic.vercel.app';
const PROJECT = 'kuranic-b1034';
const FALLBACK_IMG = 'https://i.ibb.co/Q7V0K9jg/BOXY-DROP-KURA-12.png';

// Only runs on the root path — admin, checkout, assets are not touched
export const config = { matcher: '/' };

export default async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product');

  // No product param → pass through to index.html as normal
  if (!productId) return;

  // Real user → pass through, let React handle it
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) return;

  // Social bot with ?product=xxx → fetch from Firestore and return pre-rendered meta tags
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/products/${productId}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    // Product not found or Firestore error → pass through
    if (!res.ok) return;

    const { fields: f = {} } = await res.json();

    const title = f.title?.stringValue || 'KURA STUDIO';
    const rawDesc = f.description?.stringValue || '';
    const desc = rawDesc.slice(0, 155) ||
      `${title} en KURA STUDIO. Streetwear auténtico con entregas en Nicaragua.`;
    const imgArr = f.images?.arrayValue?.values || [];
    const image = imgArr[0]?.stringValue || FALLBACK_IMG;

    const pageTitle = `${title} – KURA STUDIO`;
    const pageUrl = `${SITE}/?product=${productId}`;

    // Escape HTML special chars to prevent injection in template
    const h = (s) => String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return new Response(`<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8">
<title>${h(pageTitle)}</title>
<meta name="description" content="${h(desc)}">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="product">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${h(pageTitle)}">
<meta property="og:description" content="${h(desc)}">
<meta property="og:image" content="${h(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1500">
<meta property="og:site_name" content="KURA STUDIO">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${h(pageTitle)}">
<meta name="twitter:description" content="${h(desc)}">
<meta name="twitter:image" content="${h(image)}">
</head><body></body></html>`, {
      headers: {
        'content-type': 'text/html;charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    // Any error (timeout, network, parse) → always pass through
    return;
  }
}
