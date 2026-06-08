// Globals disponibles desde checkout.html: React, ReactDOM, db, firebase, IMGBB_API_KEY
// Utils: getPrice, optimizeImg, uploadToImgBB, trackEvent, SmoothImage, Toast, compressImage

function CheckoutApp() {
    const { useState, useEffect } = React;

    const [cart, setCart] = useState(() => {
        try { return JSON.parse(localStorage.getItem('kura_cart')) || []; } catch { return []; }
    });

    const [meta] = useState(() => {
        try { return JSON.parse(localStorage.getItem('kura_checkout_meta')) || {}; } catch { return {}; }
    });

    const [shippingZone, setShippingZone] = useState(meta.shippingZone || 'managua');
    const [appliedDiscount, setAppliedDiscount] = useState(meta.appliedDiscount || null);
    const [discountCodes, setDiscountCodes] = useState([]);
    const [discountInput, setDiscountInput] = useState('');
    const [discountError, setDiscountError] = useState('');

    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [pendingOrder, setPendingOrder] = useState(() => {
        try { return JSON.parse(localStorage.getItem('kura_pending_order')) || null; } catch { return null; }
    });
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        db.collection("discountCodes").get().then(snap => {
            setDiscountCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (pendingOrder) localStorage.setItem('kura_pending_order', JSON.stringify(pendingOrder));
        else localStorage.removeItem('kura_pending_order');
    }, [pendingOrder]);

    const shippingRates = { managua: 100, departamentos: 165 };
    const currentShippingCost = shippingRates[shippingZone] || 0;
    const cartSubtotal = cart.reduce((a, b) => a + getPrice(b), 0);
    const discountAmount = appliedDiscount
        ? (appliedDiscount.type === 'percent'
            ? Math.round(cartSubtotal * appliedDiscount.value / 100)
            : Math.min(appliedDiscount.value, cartSubtotal))
        : 0;
    const cartTotal = cartSubtotal - discountAmount + (cart.length > 0 ? currentShippingCost : 0);

    const applyDiscount = () => {
        setDiscountError('');
        const code = discountInput.toUpperCase().trim();
        const found = discountCodes.find(c => c.code === code && c.active);
        if (!found) { setDiscountError('CÓDIGO INVÁLIDO O INACTIVO'); return; }
        if (found.expiryDate && new Date(found.expiryDate) < new Date()) { setDiscountError('CÓDIGO EXPIRADO'); return; }
        if (found.usageLimit > 0 && found.usageCount >= found.usageLimit) { setDiscountError('CÓDIGO SIN USOS DISPONIBLES'); return; }
        setAppliedDiscount(found);
    };

    const removeDiscount = () => { setAppliedDiscount(null); setDiscountInput(''); setDiscountError(''); };

    const handleProceedToPayment = (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        trackEvent('checkout_started', { itemCount: cart.length, subtotal: cartSubtotal });
        const orderNum = `KURA-${Math.floor(100000 + Math.random() * 900000)}`;
        setPendingOrder({
            orderNumber: orderNum,
            customer: formData,
            items: cart,
            subtotal: cartSubtotal,
            discountCode: appliedDiscount ? appliedDiscount.code : null,
            discountAmount,
            shippingZone: shippingZone === 'managua' ? 'Managua' : 'Departamentos',
            shippingCost: currentShippingCost,
            total: cartTotal,
            date: new Date().toISOString()
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const syncToHubSpot = async (orderData) => {
        try {
            const detalles = orderData.items.map(i => `${i.title} (Talla: ${i.selectedSize})`).join(' | ');
            await fetch('/api/hubspot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderNumber: orderData.orderNumber,
                    name: orderData.customer.name,
                    phone: orderData.customer.phone,
                    address: `${orderData.customer.address} (${orderData.shippingZone})`,
                    total: orderData.total,
                    orderDetails: detalles
                })
            });
        } catch { /* no interrumpir UX */ }
    };

    const handleFinalizeOrder = async () => {
        if (!receiptFile) return alert("Por favor, adjunta tu comprobante de pago.");
        setIsUploading(true);
        try {
            const receiptUrl = await uploadToImgBB(receiptFile);
            const finalOrder = { ...pendingOrder, receiptUrl, status: 'paid_pending_verification', seenByAdmin: false };
            await db.collection("orders").doc(pendingOrder.orderNumber).set(finalOrder);
            syncToHubSpot(finalOrder);

            let m = `*NUEVA ORDEN: #${pendingOrder.orderNumber}*\n\n`;
            m += `*Cliente:* ${pendingOrder.customer.name}\n`;
            m += `*Tel:* ${pendingOrder.customer.phone}\n`;
            m += `*Dirección:* ${pendingOrder.customer.address} (${pendingOrder.shippingZone})\n\n`;
            m += `*ARSENAL:*\n`;
            pendingOrder.items.forEach(i => { m += `▪️ ${i.title} (${i.selectedSize}) - NIO ${getPrice(i)}\n`; });
            m += `\n*Subtotal:* NIO ${pendingOrder.subtotal}\n`;
            if (pendingOrder.discountAmount > 0) m += `*Descuento (${pendingOrder.discountCode}):* - NIO ${pendingOrder.discountAmount}\n`;
            m += `*Envío:* NIO ${pendingOrder.shippingCost}\n`;
            m += `*TOTAL PAGADO:* NIO ${pendingOrder.total}\n\n`;
            m += `*Comprobante:* ${receiptUrl}`;

            const whatsappUrl = `https://wa.me/50587091008?text=${encodeURIComponent(m)}`;

            if (appliedDiscount) {
                db.collection("discountCodes").doc(appliedDiscount.id).update({
                    usageCount: firebase.firestore.FieldValue.increment(1)
                });
            }

            localStorage.removeItem('kura_cart');
            localStorage.removeItem('kura_checkout_meta');
            setCart([]);
            setReceiptFile(null);
            setAcceptTerms(false);
            setAppliedDiscount(null);
            setDiscountInput('');
            setConfirmedOrder({
                orderNumber: pendingOrder.orderNumber,
                customer: pendingOrder.customer,
                shippingZone: pendingOrder.shippingZone,
                total: pendingOrder.total,
                whatsappUrl
            });
            setPendingOrder(null);
        } catch {
            alert("Ocurrió un error al procesar el pago. Verifica tu conexión e intenta de nuevo.");
        }
        setIsUploading(false);
    };

    // --- Carrito vacío y sin orden ---
    if (cart.length === 0 && !pendingOrder && !confirmedOrder) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <h1 className="font-bebas text-4xl text-zinc-600">CARRITO VACÍO</h1>
                <p className="text-zinc-500 text-sm">No hay artículos para pagar.</p>
                <a href="/" className="brutalist-btn px-10 py-4 text-xl">← VOLVER A LA TIENDA</a>
            </div>
        );
    }

    // --- Orden confirmada ---
    if (confirmedOrder) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md border border-kuraRed bg-black rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(255,0,60,0.35)]">
                    <div className="bg-kuraRed px-6 py-4 flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                        <h2 className="font-bebas text-3xl text-black tracking-widest leading-none">ORDEN CONFIRMADA</h2>
                    </div>
                    <div className="p-6">
                        <div className="border border-zinc-800 bg-zinc-950 p-4 mb-6 text-center rounded-xl">
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Tu número de orden</p>
                            <p className="font-bebas text-4xl text-kuraRed tracking-widest">#{confirmedOrder.orderNumber}</p>
                        </div>
                        <div className="flex items-start gap-3 mb-6 border border-zinc-800 p-4 bg-zinc-950 rounded-xl">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 shrink-0 animate-pulse"></span>
                            <div>
                                <p className="text-white font-bold text-sm mb-1">EN PROCESO DE VERIFICACIÓN</p>
                                <p className="text-zinc-400 text-xs leading-relaxed">Recibimos tu comprobante. Te contactaremos por WhatsApp en máximo 24 horas para coordinar la entrega.</p>
                            </div>
                        </div>
                        <div className="text-xs font-mono text-zinc-500 mb-6 space-y-1 border-t border-zinc-900 pt-4">
                            <div className="flex justify-between"><span>Cliente:</span><span className="text-white">{confirmedOrder.customer.name}</span></div>
                            <div className="flex justify-between"><span>Envío:</span><span className="text-white">{confirmedOrder.shippingZone}</span></div>
                            <div className="flex justify-between text-kuraRed font-bold text-sm mt-2 pt-2 border-t border-zinc-900">
                                <span>TOTAL:</span><span>NIO {confirmedOrder.total}</span>
                            </div>
                        </div>
                        <a href={confirmedOrder.whatsappUrl} target="_blank" rel="noopener noreferrer" className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-3 mb-3" style={{ pointerEvents: 'auto' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            ENVIAR ORDEN POR WHATSAPP
                        </a>
                        <a href="/" className="block w-full py-3 text-xs font-bold tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-xl text-center">
                            VOLVER A LA TIENDA
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // --- Checkout principal ---
    return (
        <div className="min-h-screen bg-black text-white">
            <Toast message={toastMsg} isVisible={!!toastMsg} />

            {/* Header */}
            <header className="px-4 md:px-8 py-4 flex justify-between items-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
                <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold tracking-widest">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    TIENDA
                </a>
                <h1 className="font-bebas text-2xl tracking-widest">CHECKOUT</h1>
                <div className="w-20"></div>
            </header>

            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    {/* Columna izquierda — Resumen del pedido */}
                    <div className="space-y-4 md:sticky md:top-24">
                        <h2 className="font-bebas text-xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">RESUMEN DEL PEDIDO</h2>

                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.cartId} className="flex gap-3 border border-zinc-800 p-3 bg-zinc-950 rounded-xl">
                                    <img src={optimizeImg(item.images?.[0], 120)} onError={(e) => { if (item.images?.[0] && e.target.src !== item.images[0]) e.target.src = item.images[0]; }} className="w-14 h-16 object-cover border border-zinc-900 shrink-0 rounded-lg" decoding="async" draggable={false} alt={item.title} />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bebas text-lg leading-none text-zinc-100 line-clamp-2">{item.title}</p>
                                        <p className="text-xs text-zinc-500 mt-1 font-bold">TALLA: {item.selectedSize}</p>
                                        <p className="text-kuraRed text-sm font-bold mt-1">NIO {getPrice(item)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Discount en checkout */}
                        <div className="border border-zinc-800 p-4 bg-zinc-950 rounded-xl">
                            <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">CÓDIGO DE DESCUENTO</p>
                            {appliedDiscount ? (
                                <div className="flex items-center justify-between bg-kuraRed/10 border border-kuraRed p-3 rounded-lg">
                                    <div>
                                        <span className="text-kuraRed font-bebas text-xl">{appliedDiscount.code}</span>
                                        <span className="text-green-400 text-xs ml-3">
                                            {appliedDiscount.type === 'percent' ? `${appliedDiscount.value}% OFF` : `NIO ${appliedDiscount.value} OFF`}
                                        </span>
                                    </div>
                                    <button type="button" onClick={removeDiscount} className="text-zinc-500 hover:text-white text-xs font-bold">✕ QUITAR</button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="INGRESA TU CÓDIGO"
                                        value={discountInput}
                                        onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                                        className="flex-1 bg-black border border-zinc-800 p-3 text-white text-sm outline-none focus:border-kuraRed transition-colors font-mono tracking-widest rounded-lg"
                                    />
                                    <button type="button" onClick={applyDiscount} className="px-4 bg-zinc-800 hover:bg-kuraRed hover:text-black text-white text-xs font-bold transition-colors border border-zinc-700 whitespace-nowrap rounded-lg">APLICAR</button>
                                </div>
                            )}
                            {discountError && <p className="text-red-500 text-xs mt-2 font-mono">{discountError}</p>}
                        </div>

                        {/* Shipping */}
                        {!pendingOrder && (
                            <div>
                                <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">ZONA DE ENVÍO</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setShippingZone('managua')} className={`flex-1 py-3 text-xs font-bold transition-all rounded-xl border-2 ${shippingZone === 'managua' ? 'bg-kuraRed text-black border-kuraRed' : 'bg-transparent text-zinc-500 border-zinc-800'}`}>
                                        MANAGUA<br /><span className="font-mono font-normal">NIO 100</span>
                                    </button>
                                    <button type="button" onClick={() => setShippingZone('departamentos')} className={`flex-1 py-3 text-xs font-bold transition-all rounded-xl border-2 ${shippingZone === 'departamentos' ? 'bg-kuraRed text-black border-kuraRed' : 'bg-transparent text-zinc-500 border-zinc-800'}`}>
                                        DEPTO.<br /><span className="font-mono font-normal">NIO 165</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm rounded-xl">
                            <div className="flex justify-between mb-2 text-zinc-400"><span>SUBTOTAL</span><span>NIO {cartSubtotal}</span></div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between mb-2 text-green-400 font-bold">
                                    <span>DESCUENTO ({appliedDiscount.code})</span><span>- NIO {discountAmount}</span>
                                </div>
                            )}
                            <div className="flex justify-between mb-2 text-zinc-400"><span>ENVÍO ({pendingOrder ? pendingOrder.shippingZone : (shippingZone === 'managua' ? 'Managua' : 'Departamentos')})</span><span>NIO {pendingOrder ? pendingOrder.shippingCost : currentShippingCost}</span></div>
                            <div className="flex justify-between pt-3 border-t border-zinc-800 items-end mt-2">
                                <span className="font-bebas text-lg text-white">TOTAL</span>
                                <span className="font-bebas text-3xl text-kuraRed leading-none">NIO {pendingOrder ? pendingOrder.total : cartTotal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha — Formulario o pago */}
                    <div>
                        {!pendingOrder ? (
                            <form onSubmit={handleProceedToPayment} className="space-y-4">
                                <h2 className="font-bebas text-xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">DATOS DE ENTREGA</h2>
                                <input
                                    required type="text" placeholder="NOMBRE COMPLETO"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed transition-colors rounded-xl"
                                />
                                <input
                                    required type="tel" placeholder="TELÉFONO (Ej: 8888 8888)"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed transition-colors rounded-xl"
                                />
                                <textarea
                                    required placeholder="DIRECCIÓN EXACTA"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                                    className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed h-24 resize-none transition-colors rounded-xl"
                                ></textarea>
                                <button type="submit" className="brutalist-btn w-full py-4 text-xl mt-2">CONFIRMAR PEDIDO →</button>
                            </form>
                        ) : (
                            <div className="space-y-4 animate-slideUp">
                                <h2 className="font-bebas text-xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">COMPROBANTE DE PAGO</h2>

                                {/* Aviso */}
                                <div className="bg-[#111] border border-kuraRed p-4 rounded-xl">
                                    <h4 className="text-kuraRed font-bebas text-xl mb-1 flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        AVISO DE ENTREGA
                                    </h4>
                                    <p className="text-zinc-400 text-xs font-mono">Envíos de 24 a 72 horas hábiles tras confirmar tu pago. Te contactaremos por WhatsApp para coordinar.</p>
                                </div>

                                {/* Orden + datos bancarios */}
                                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-kuraRed opacity-10 rotate-45 pointer-events-none"></div>
                                    <p className="text-zinc-500 text-[10px] uppercase mb-1">ORDEN RESERVADA</p>
                                    <h3 className="text-white font-bebas text-3xl mb-4 tracking-wider">#{pendingOrder.orderNumber}</h3>

                                    <div className="bg-black border border-zinc-800 p-4 text-xs text-zinc-300 font-mono rounded-xl">
                                        <p className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 inline-block rounded-full"></span> DATOS DE TRANSFERENCIA
                                        </p>
                                        <div className="mb-4">
                                            <p className="text-kuraRed font-bold mb-1">BAC CÓRDOBAS</p>
                                            <p className="mb-1"><span className="text-zinc-500">Cliente:</span> KATHY VALESKA MEMBREÑO MEDINA</p>
                                            <p className="mb-1"><span className="text-zinc-500">Número de cuenta:</span> 367298642</p>
                                        </div>
                                        <div>
                                            <p className="text-kuraRed font-bold mb-1">LAFISE CÓRDOBAS</p>
                                            <p className="mb-1"><span className="text-zinc-500">Cliente:</span> KATHY VALESKA MEMBREÑO MEDINA</p>
                                            <p className="mb-1"><span className="text-zinc-500">Número de cuenta:</span> 117240166</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload comprobante */}
                                <div>
                                    <p className="text-xs text-white mb-3 font-bold border-l-2 border-kuraRed pl-2">ADJUNTA TU COMPROBANTE:</p>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed hover:border-kuraRed hover:bg-zinc-900 transition-colors cursor-pointer relative rounded-xl">
                                        {receiptFile ? (
                                            <div className="text-center p-2">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-kuraRed mx-auto mb-2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                                                <span className="text-kuraRed font-bold text-xs block truncate max-w-[200px]">{receiptFile.name}</span>
                                                <span className="text-zinc-500 text-[10px] mt-1 block">(Clic para cambiar)</span>
                                            </div>
                                        ) : (
                                            <div className="text-center text-zinc-500">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                                                <span className="text-xs">Toca para subir la captura</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files[0])} className="hidden" />
                                    </label>
                                </div>

                                {/* Terms */}
                                <label className="flex items-start gap-3 cursor-pointer text-xs text-zinc-400 p-3 border border-zinc-800 bg-black rounded-xl">
                                    <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-kuraRed w-4 h-4 shrink-0" />
                                    <span className="leading-tight">Acepto la <a href="#" className="text-white underline">política de envíos</a> de Kura Studio.</span>
                                </label>

                                {/* Confirm button */}
                                <button
                                    onClick={handleFinalizeOrder}
                                    disabled={!receiptFile || !acceptTerms || isUploading}
                                    className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-2"
                                >
                                    {isUploading ? (
                                        <span className="animate-pulse">ENVIANDO ORDEN...</span>
                                    ) : (
                                        <>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                            CONFIRMAR ORDEN
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => { setPendingOrder(null); setReceiptFile(null); setAcceptTerms(false); }}
                                    disabled={isUploading}
                                    className="w-full text-xs font-bold tracking-widest text-zinc-600 hover:text-white transition-colors py-2"
                                >
                                    ← VOLVER AL FORMULARIO
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CheckoutApp />);
