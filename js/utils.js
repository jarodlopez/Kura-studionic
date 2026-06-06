// Globals disponibles desde index.html: React, db, IMGBB_API_KEY

window.trackEvent = async (type, data = {}) => {
    try {
        await db.collection("analytics").add({
            type, ...data,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        });
    } catch (e) { /* nunca interrumpir la UX por un error de tracking */ }
};

// Comprime y redimensiona una imagen en el navegador ANTES de subirla.
// Convierte a WebP (~1400px máx, calidad 82%) — una foto de varios MB
// suele bajar a ~150-250 KB. Si algo falla, devuelve el archivo original.
window.compressImage = async (file, { maxDim = 1400, quality = 0.82 } = {}) => {
    try {
        if (!file || !file.type || !file.type.startsWith('image/')) return file;
        // Los GIF (posible animación) y SVG (vectorial) se dejan tal cual.
        if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = dataUrl;
        });

        let { width, height } = img;
        if (!width || !height) return file;
        if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (!blob || blob.size >= file.size) return file; // si no ayuda, mantener original

        const baseName = (file.name || 'imagen').replace(/\.[^.]+$/, '');
        return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
    } catch (e) {
        return file; // ante cualquier error, subir el original
    }
};

window.uploadToImgBB = async (file) => {
    const optimized = await window.compressImage(file);
    const fd = new FormData();
    fd.append("image", optimized);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) return data.data.url;
    throw new Error("Error subiendo imagen a ImgBB");
};

// Sirve las imágenes de ImgBB a través de wsrv.nl (sobre Cloudflare):
// las convierte a WebP y las redimensiona al ancho necesario, on-the-fly.
// Optimiza también las imágenes ya subidas, sin re-subir nada.
// Si la URL no es de ImgBB (data:, relativa, etc.) se deja intacta.
window.optimizeImg = (url, width) => {
    if (!url || typeof url !== 'string') return url;
    if (!/^https?:\/\/i\.ibb\.co\//i.test(url)) return url;
    const clean = url.replace(/^https?:\/\//i, '');
    const w = width ? `&w=${width}` : '';
    // &we = no agrandar imágenes más chicas que el ancho pedido
    return `https://wsrv.nl/?url=${encodeURIComponent(clean)}${w}&output=webp&q=82&we`;
};

window.getPrice = (product) =>
    product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;

window.Toast = ({ message, isVisible }) => (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-kuraRed text-black font-bebas px-6 py-3 text-xl border-2 border-black flex items-center gap-3 shadow-[4px_4px_0_white]">
            <span className="text-2xl">✓</span> {message}
        </div>
    </div>
);

// width (opcional): ancho objetivo en px para que el proxy redimensione.
// Si el proxy fallara, onError cae automáticamente a la URL original.
window.SmoothImage = ({ src, className, alt, eager, width }) => (
    <img
        src={window.optimizeImg(src, width)}
        data-fallback={src}
        className={`img-fade ${className}`}
        onLoad={(e) => e.target.classList.add('img-loaded')}
        onError={(e) => {
            const original = e.target.dataset.fallback;
            if (original && e.target.src !== original) {
                e.target.src = original;
            }
        }}
        alt={alt || "KURA STUDIO"}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
    />
);
