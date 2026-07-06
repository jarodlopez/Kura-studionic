// Globals disponibles desde checkout.html: React, ReactDOM, db, firebase, IMGBB_API_KEY
// Utils: getPrice, optimizeImg, trackEvent, Toast, compressImage, uploadToImgBB, SmoothImage
// Componente: PaymentModule (js/components/PaymentModule.js)

const PENDING_KEY = 'kura_pending_order';

// Cuentas por defecto (las que se usaban antes). Se muestran mientras el admin
// no configure cuentas propias en la pestaña PAGOS.
const DEFAULT_BANKS = [
    { id: 'bac', name: 'BAC', accountNumber: '367298642', holder: 'KATHY VALESKA MEMBREÑO MEDINA', currency: 'C$', logoUrl: '' },
    { id: 'lafise', name: 'LAFISE', accountNumber: '117240166', holder: 'KATHY VALESKA MEMBREÑO MEDINA', currency: 'C$', logoUrl: '' },
];

function CheckoutApp() {
    const { useState, useEffect } = React;

    const [cart] = useState(() => {
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

    const [bankAccounts, setBankAccounts] = useState(DEFAULT_BANKS);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Orden activa (recién creada o reanudada desde caché) y estado de pago
    const [activeOrder, setActiveOrder] = useState(() => {
        try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || null; } catch { return null; }
    });
    const [paid, setPaid] = useState(false);

    useEffect(() => {
        db.collection("discountCodes").get().then(snap => {
            setDiscountCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => {});
        db.collection("settings").doc("store").get().then(doc => {
            const configured = doc.exists ? doc.data().bankAccounts : null;
            if (configured && configured.length) setBankAccounts(configured);
        }).catch(() => {});
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cart.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const orderNum = `KURA-${Math.floor(100000 + Math.random() * 900000)}`;
            // Token auto-generado al crear la orden (evita escrituras posteriores a Firestore).
            const paymentToken = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
            const shippingZoneLabel = shippingZone === 'managua' ? 'Managua' : 'Departamentos';
            const order = {
                orderNumber: orderNum,
                customer: formData,
                items: cart,
                subtotal: cartSubtotal,
                discountCode: appliedDiscount?.code || null,
                discountAmount,
                shippingZone: shippingZoneLabel,
                shippingCost: currentShippingCost,
                total: cartTotal,
                date: new Date().toISOString(),
                status: 'awaiting_payment',
                seenByAdmin: false,
                paymentToken,
                paymentReference: null,
            };
            await db.collection("orders").doc(orderNum).set(order);
            trackEvent('checkout_started', { itemCount: cart.length, subtotal: cartSubtotal });

            if (appliedDiscount) {
                db.collection("discountCodes").doc(appliedDiscount.id).update({
                    usageCount: firebase.firestore.FieldValue.increment(1)
                });
            }

            // La orden queda cacheada hasta que suba el comprobante o cancele.
            localStorage.setItem(PENDING_KEY, JSON.stringify(order));
            localStorage.removeItem('kura_cart');
            localStorage.removeItem('kura_checkout_meta');

            setActiveOrder(order);
        } catch {
            alert("Ocurrió un error. Verifica tu conexión e intenta de nuevo.");
        }
        setIsSubmitting(false);
    };

    const handlePaid = () => { localStorage.removeItem(PENDING_KEY); setPaid(true); };
    const handleCancelOrder = () => {
        if (!window.confirm('¿Seguro que quieres cancelar esta orden? Perderás el progreso del pago.')) return;
        localStorage.removeItem(PENDING_KEY);
        setActiveOrder(null);
        window.location.href = '/';
    };

    // --- Pago completado ---
    if (paid) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md border border-green-700 bg-black rounded-2xl overflow-hidden">
                    <div className="bg-green-600 px-6 py-4 flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                        <h2 className="font-bebas text-3xl text-black tracking-widest">COMPROBANTE ENVIADO</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="font-bebas text-2xl text-kuraRed">{activeOrder?.orderNumber}</p>
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

    // --- Orden activa: módulo de pago (recién creada o reanudada) ---
    if (activeOrder) {
        return (
            <div className="min-h-screen bg-black text-white">
                <header className="px-4 py-4 flex items-center justify-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
                    <span className="text-zinc-600 text-xs font-mono mr-2">🔒</span>
                    <h1 className="font-bebas text-2xl tracking-widest">PAGO SEGURO — KURA STUDIO</h1>
                </header>
                <div className="p-4 pb-12">
                    <PaymentModule
                        order={activeOrder}
                        bankAccounts={bankAccounts}
                        waNumber="50587091008"
                        onPaid={handlePaid}
                        onCancel={handleCancelOrder}
                    />
                </div>
            </div>
        );
    }

    // --- Carrito vacío ---
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <h1 className="font-bebas text-4xl text-zinc-600">CARRITO VACÍO</h1>
                <p className="text-zinc-500 text-sm">No hay artículos para pagar.</p>
                <a href="/" className="brutalist-btn px-10 py-4 text-xl">← VOLVER A LA TIENDA</a>
            </div>
        );
    }

    // --- Formulario principal ---
    return (
        <div className="min-h-screen bg-black text-white">
            <header className="px-4 md:px-8 py-4 flex justify-between items-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
                <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold tracking-widest">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    TIENDA
                </a>
                <h1 className="font-bebas text-2xl tracking-widest">CONFIRMAR PEDIDO</h1>
                <div className="w-20"></div>
            </header>

            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    {/* Resumen del pedido */}
                    <div className="space-y-4 md:sticky md:top-24">
                        <h2 className="font-bebas text-xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">RESUMEN DEL PEDIDO</h2>
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.cartId} className="flex gap-3 border border-zinc-800 p-3 bg-zinc-950 rounded-xl">
                                    <img src={optimizeImg(item.images?.[0], 120)} onError={(e) => { if (item.images?.[0] && e.target.src !== item.images[0]) e.target.src = item.images[0]; }} className="w-14 h-16 object-cover border border-zinc-900 shrink-0 rounded-lg" decoding="async" draggable={false} alt={item.title} />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bebas text-lg leading-none text-zinc-100 line-clamp-2">{item.title}</p>
                                        <p className="text-xs text-zinc-500 mt-1 font-bold">TALLA: {item.selectedSize}</p>
                                        {item.discountPrice && item.discountPrice > 0 ? (
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-kuraRed text-sm font-bold">NIO {item.discountPrice}</span>
                                                <span className="text-zinc-600 text-[10px] line-through">NIO {item.price}</span>
                                            </div>
                                        ) : (
                                            <p className="text-kuraRed text-sm mt-1 font-bold">NIO {item.price}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Descuento */}
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
                                    <input type="text" placeholder="INGRESA TU CÓDIGO" value={discountInput} onChange={e => setDiscountInput(e.target.value.toUpperCase())} className="flex-1 bg-black border border-zinc-800 p-3 text-white text-sm outline-none focus:border-kuraRed transition-colors font-mono tracking-widest rounded-lg" />
                                    <button type="button" onClick={applyDiscount} className="px-4 bg-zinc-800 hover:bg-kuraRed hover:text-black text-white text-xs font-bold transition-colors border border-zinc-700 whitespace-nowrap rounded-lg">APLICAR</button>
                                </div>
                            )}
                            {discountError && <p className="text-red-500 text-xs mt-2 font-mono">{discountError}</p>}
                        </div>

                        {/* Zona de envío */}
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

                        {/* Total */}
                        <div className="bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm rounded-xl">
                            <div className="flex justify-between mb-2 text-zinc-400"><span>SUBTOTAL</span><span>NIO {cartSubtotal}</span></div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between mb-2 text-green-400 font-bold">
                                    <span>DESCUENTO ({appliedDiscount.code})</span><span>- NIO {discountAmount}</span>
                                </div>
                            )}
                            <div className="flex justify-between mb-2 text-zinc-400"><span>ENVÍO ({shippingZone === 'managua' ? 'Managua' : 'Departamentos'})</span><span>NIO {currentShippingCost}</span></div>
                            <div className="flex justify-between pt-3 border-t border-zinc-800 items-end mt-2">
                                <span className="font-bebas text-lg text-white">TOTAL</span>
                                <span className="font-bebas text-3xl text-kuraRed leading-none">NIO {cartTotal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Datos de entrega */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h2 className="font-bebas text-xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">DATOS DE ENTREGA</h2>
                        <input required type="text" placeholder="NOMBRE COMPLETO"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed transition-colors rounded-xl" />
                        <input required type="tel" placeholder="TELÉFONO (Ej: 8888 8888)"
                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed transition-colors rounded-xl" />
                        <textarea required placeholder="DIRECCIÓN EXACTA"
                            value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                            className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed h-24 resize-none transition-colors rounded-xl"></textarea>

                        <div className="border border-zinc-800 bg-zinc-950 p-4 rounded-xl flex items-start gap-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kuraRed shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <p className="text-zinc-400 text-xs leading-relaxed">Al confirmar, podrás pagar por <strong className="text-white">transferencia aquí mismo</strong> (subiendo tu comprobante) o <strong className="text-white">coordinar por WhatsApp</strong>. Tu orden queda guardada hasta que completes el pago.</p>
                        </div>

                        <PaymentGuide variant="inline" />

                        <button type="submit" disabled={isSubmitting}
                            className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-3">
                            {isSubmitting ? (
                                <span className="animate-pulse">REGISTRANDO PEDIDO...</span>
                            ) : (
                                <>CONFIRMAR PEDIDO →</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CheckoutApp />);
