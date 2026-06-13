// Globals: React, ReactDOM, db, IMGBB_API_KEY
// Utils: getPrice, optimizeImg, uploadToImgBB, compressImage

function PagoApp() {
    const { useState, useEffect } = React;

    // 'loading' | 'invalid' | 'already_paid' | 'form' | 'done'
    const [state, setState] = useState('loading');
    const [order, setOrder] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        // URL: /pago/KURA-XXXXXX?t=TOKEN
        const parts = window.location.pathname.split('/').filter(Boolean);
        const orderNumber = parts[parts.length - 1];
        const token = new URLSearchParams(window.location.search).get('t');

        if (!orderNumber || !token) { setState('invalid'); return; }

        db.collection("orders").doc(orderNumber).get()
            .then(doc => {
                if (!doc.exists) { setState('invalid'); return; }
                const data = { id: doc.id, ...doc.data() };
                if (data.paymentToken !== token) { setState('invalid'); return; }
                // Ya fue pagado
                const paidStatuses = ['paid_pending_verification', 'verified', 'preparing', 'shipped', 'delivered'];
                if (paidStatuses.includes(data.status)) {
                    setOrder(data);
                    setState('already_paid');
                    return;
                }
                setOrder(data);
                setState('form');
            })
            .catch(() => setState('invalid'));
    }, []);

    const handleConfirm = async () => {
        if (!receiptFile || !acceptTerms || isUploading) return;
        setIsUploading(true);
        try {
            const receiptUrl = await uploadToImgBB(receiptFile);
            await db.collection("orders").doc(order.orderNumber).update({
                receiptUrl,
                status: 'paid_pending_verification',
                seenByAdmin: false,
                paidAt: new Date().toISOString(),
            });
            // Sync a HubSpot
            try {
                const detalles = (order.items || []).map(i => `${i.title} (Talla: ${i.selectedSize})`).join(' | ');
                await fetch('/api/hubspot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderNumber: order.orderNumber,
                        name: order.customer.name,
                        phone: order.customer.phone,
                        address: `${order.customer.address} (${order.shippingZone})`,
                        total: order.total,
                        orderDetails: detalles,
                    })
                });
            } catch {}
            setState('done');
        } catch {
            alert("Error al subir el comprobante. Verifica tu conexión e intenta de nuevo.");
        }
        setIsUploading(false);
    };

    // --- Cargando ---
    if (state === 'loading') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="font-bebas text-4xl text-zinc-800 animate-pulse">CARGANDO...</p>
            </div>
        );
    }

    // --- Link inválido ---
    if (state === 'invalid') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8 text-center">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <h1 className="font-bebas text-4xl text-zinc-600">LINK INVÁLIDO</h1>
                <p className="text-zinc-500 text-sm max-w-xs">Este link de pago no existe o expiró. Escríbenos para recibir uno nuevo.</p>
                <a href="https://wa.me/50587091008" target="_blank" rel="noopener noreferrer"
                    className="brutalist-btn px-8 py-3 text-xl">CONTACTAR A KURA →</a>
            </div>
        );
    }

    // --- Ya fue pagado ---
    if (state === 'already_paid') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md border border-green-700 bg-black rounded-2xl overflow-hidden">
                    <div className="bg-green-600 px-6 py-4 flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                        <h2 className="font-bebas text-3xl text-black tracking-widest">PAGO RECIBIDO</h2>
                    </div>
                    <div className="p-6 space-y-3">
                        <p className="font-bebas text-2xl text-kuraRed">{order?.orderNumber}</p>
                        <p className="text-zinc-400 text-sm">Ya recibimos tu comprobante de pago. Te contactaremos pronto para coordinar la entrega.</p>
                        <a href="/" className="block w-full py-3 text-xs font-bold tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-xl text-center mt-4">
                            VOLVER A LA TIENDA
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // --- Pago completado en esta sesión ---
    if (state === 'done') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md border border-kuraRed bg-black rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(255,0,60,0.35)]">
                    <div className="bg-kuraRed px-6 py-4 flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                        <h2 className="font-bebas text-3xl text-black tracking-widest">COMPROBANTE ENVIADO</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="font-bebas text-2xl text-kuraRed">{order?.orderNumber}</p>
                        <div className="flex items-start gap-3 border border-zinc-800 p-4 bg-zinc-950 rounded-xl">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 shrink-0 animate-pulse"></span>
                            <p className="text-zinc-400 text-xs leading-relaxed">Recibimos tu comprobante. Verificaremos el pago en las próximas 24 horas y te contactaremos por WhatsApp para coordinar la entrega. 🖤</p>
                        </div>
                        <a href="/" className="block w-full py-3 text-xs font-bold tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-xl text-center">
                            VOLVER A LA TIENDA
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // --- Formulario de pago ---
    return (
        <div className="min-h-screen bg-black text-white">
            <header className="px-4 py-4 flex items-center justify-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
                <span className="text-zinc-600 text-xs font-mono mr-2">🔒</span>
                <h1 className="font-bebas text-2xl tracking-widest">PAGO SEGURO — KURA STUDIO</h1>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4 pb-12">

                {/* Resumen de la orden */}
                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">ORDEN</p>
                    <h2 className="font-bebas text-3xl text-kuraRed leading-none">{order.orderNumber}</h2>
                    <p className="text-zinc-400 text-xs mt-1 font-mono">{order.customer.name} · {order.shippingZone}</p>

                    <div className="mt-4 space-y-2">
                        {(order.items || []).map((item, i) => (
                            <div key={i} className="flex justify-between items-start text-xs font-mono gap-3">
                                <span className="text-zinc-400 leading-relaxed">{item.title} <span className="text-zinc-600">({item.selectedSize})</span></span>
                                <span className="text-white shrink-0">NIO {getPrice(item)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>NIO {order.subtotal}</span></div>
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-green-400">
                                <span>Descuento ({order.discountCode})</span><span>- NIO {order.discountAmount}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-zinc-500"><span>Envío ({order.shippingZone})</span><span>NIO {order.shippingCost}</span></div>
                        <div className="flex justify-between items-end pt-2 mt-1 border-t border-zinc-800">
                            <span className="font-bebas text-xl text-white">TOTAL A PAGAR</span>
                            <span className="font-bebas text-3xl text-kuraRed leading-none">NIO {order.total}</span>
                        </div>
                    </div>
                </div>

                {/* Datos bancarios */}
                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
                    <p className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 inline-block rounded-full animate-pulse"></span>
                        DATOS PARA TRANSFERIR
                    </p>
                    <div className="space-y-4 text-xs font-mono text-zinc-300">
                        <div className="bg-black p-3 rounded-xl border border-zinc-900">
                            <p className="text-kuraRed font-bold mb-1.5">BAC CÓRDOBAS</p>
                            <p><span className="text-zinc-500">Cuenta: </span>367298642</p>
                            <p><span className="text-zinc-500">A nombre de: </span>KATHY VALESKA MEMBREÑO MEDINA</p>
                        </div>
                        <div className="bg-black p-3 rounded-xl border border-zinc-900">
                            <p className="text-kuraRed font-bold mb-1.5">LAFISE CÓRDOBAS</p>
                            <p><span className="text-zinc-500">Cuenta: </span>117240166</p>
                            <p><span className="text-zinc-500">A nombre de: </span>KATHY VALESKA MEMBREÑO MEDINA</p>
                        </div>
                    </div>
                </div>

                {/* Subir comprobante */}
                <div>
                    <p className="text-xs text-white mb-3 font-bold border-l-2 border-kuraRed pl-2">ADJUNTA TU COMPROBANTE DE PAGO:</p>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed hover:border-kuraRed hover:bg-zinc-900 transition-colors cursor-pointer rounded-xl">
                        {receiptFile ? (
                            <div className="text-center p-2">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-kuraRed mx-auto mb-2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                                <span className="text-kuraRed font-bold text-xs block truncate max-w-[200px]">{receiptFile.name}</span>
                                <span className="text-zinc-500 text-[10px] mt-1 block">(Toca para cambiar)</span>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                                <span className="text-xs">Toca para subir la captura</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} className="hidden" />
                    </label>
                </div>

                {/* Términos */}
                <label className="flex items-start gap-3 cursor-pointer text-xs text-zinc-400 p-3 border border-zinc-800 bg-black rounded-xl">
                    <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-kuraRed w-4 h-4 shrink-0" />
                    <span className="leading-tight">Confirmo que realicé el pago de <strong className="text-kuraRed">NIO {order.total}</strong> y el comprobante adjunto es correcto.</span>
                </label>

                {/* Botón confirmar */}
                <button
                    onClick={handleConfirm}
                    disabled={!receiptFile || !acceptTerms || isUploading}
                    className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-2"
                >
                    {isUploading ? (
                        <span className="animate-pulse">ENVIANDO COMPROBANTE...</span>
                    ) : (
                        'CONFIRMAR PAGO →'
                    )}
                </button>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PagoApp />);
