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

window.uploadToImgBB = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) return data.data.url;
    throw new Error("Error subiendo imagen a ImgBB");
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

window.SmoothImage = ({ src, className, alt, eager }) => (
    <img
        src={src}
        className={`img-fade ${className}`}
        onLoad={(e) => e.target.classList.add('img-loaded')}
        alt={alt || "KURA STUDIO"}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
    />
);
