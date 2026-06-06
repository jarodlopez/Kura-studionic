function KuraStudio() {
    const { useState, useEffect } = React;

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [storeConfig, setStoreConfig] = useState({ heroSlides: [] });
    const [isLoading, setIsLoading] = useState(true);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [mainImageIndex, setMainImageIndex] = useState(0);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

    const [shippingZone, setShippingZone] = useState('managua');
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    const [discountCodes, setDiscountCodes] = useState([]);
    const [discountInput, setDiscountInput] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountError, setDiscountError] = useState('');

    const [popupBanners, setPopupBanners] = useState([]);
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const [confirmedOrder, setConfirmedOrder] = useState(null);

    const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('kura_cart')) || []; } catch (e) { return []; } });
    useEffect(() => { localStorage.setItem('kura_cart', JSON.stringify(cart)); }, [cart]);

    const [pendingOrder, setPendingOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('kura_pending_order')) || null; } catch (e) { return null; } });
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

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            if (!sessionStorage.getItem('kura_session')) {
                sessionStorage.setItem('kura_session', '1');
                trackEvent('page_view');
            }
            try {
                const prodSnap = await db.collection("products").get();
                const items = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(items); setFilteredProducts(items);

                const confSnap = await db.collection("settings").doc("store").get();
                if (confSnap.exists) setStoreConfig(confSnap.data());

                const codesSnap = await db.collection("discountCodes").get();
                setDiscountCodes(codesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const bannersSnap = await db.collection("popupBanners").get();
                const activeBanners = bannersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(b => b.active);
                if (activeBanners.length > 0) {
                    setPopupBanners(activeBanners);
                    setTimeout(() => setIsPopupVisible(true), 2000);
                }

                checkDynamicLink(items);
            } catch (error) { console.error("Error conectando al sistema", error); }
            setIsLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        let result = [...products];
        if (activeCategory !== 'ALL') result = result.filter(p => p.category === activeCategory);
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toUpperCase();
            result = result.filter(p =>
                p.title.toUpperCase().includes(query) ||
                (p.sku && p.sku.toUpperCase().includes(query)) ||
                (p.category && p.category.toUpperCase().includes(query))
            );
        }
        setFilteredProducts(result);
    }, [activeCategory, searchQuery, products]);

    const checkDynamicLink = (items) => {
        const id = new URLSearchParams(window.location.search).get('product');
        if (id) { const found = items.find(p => p.id === id); if (found) openProduct(found); }
    };

    const openProduct = (product) => {
        setSelectedProduct(product); setSelectedSize(''); setMainImageIndex(0);
        window.history.pushState(null, '', `?product=${product.id}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        trackEvent('product_view', { productId: product.id, productTitle: product.title, category: product.category || '' });
    };

    const closeProduct = () => { setSelectedProduct(null); window.history.pushState(null, '', window.location.pathname); };

    const addToCart = (product) => {
        if (!selectedSize && product.sizes?.length > 0) return alert('SELECCIONA UNA TALLA PARA CONTINUAR');
        const sizeToSave = selectedSize || 'ÚNICA';
        setCart([...cart, { ...product, selectedSize: sizeToSave, cartId: Date.now() }]);
        setToastMsg(`AGREGADO: ${product.title}`); setTimeout(() => setToastMsg(''), 3000);
        trackEvent('add_to_cart', { productId: product.id, productTitle: product.title, price: getPrice(product) });
    };

    const handleProceedToPayment = (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        trackEvent('checkout_started', { itemCount: cart.length, subtotal: cartSubtotal });
        const orderNum = `KURA-${Math.floor(100000 + Math.random() * 900000)}`;
        const orderData = {
            orderNumber: orderNum,
            customer: formData,
            items: cart,
            subtotal: cartSubtotal,
            discountCode: appliedDiscount ? appliedDiscount.code : null,
            discountAmount: discountAmount,
            shippingZone: shippingZone === 'managua' ? 'Managua' : 'Departamentos',
            shippingCost: currentShippingCost,
            total: cartTotal,
            date: new Date().toISOString()
        };
        if (appliedDiscount) {
            db.collection("discountCodes").doc(appliedDiscount.id).update({ usageCount: (appliedDiscount.usageCount || 0) + 1 });
        }
        setPendingOrder(orderData);
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
        } catch (error) { console.error("Error conectando con API", error); }
    };

    const handleFinalizeOrder = async () => {
        if (!receiptFile) return alert("Por favor, adjunta tu comprobante de pago.");
        setIsUploading(true);
        try {
            const receiptUrl = await uploadToImgBB(receiptFile);
            const finalOrder = { ...pendingOrder, receiptUrl, status: 'paid_pending_verification' };
            await db.collection("orders").doc(pendingOrder.orderNumber).set(finalOrder);
            syncToHubSpot(finalOrder);

            let m = `*NUEVA ORDEN: #${pendingOrder.orderNumber}* 🩸\n\n`;
            m += `*Cliente:* ${pendingOrder.customer.name}\n`;
            m += `*Tel:* ${pendingOrder.customer.phone}\n`;
            m += `*Dirección:* ${pendingOrder.customer.address} (${pendingOrder.shippingZone})\n\n`;
            m += `*ARSENAL:*\n`;
            pendingOrder.items.forEach(i => { m += `▪️ ${i.title} (${i.selectedSize}) - NIO ${getPrice(i)}\n`; });
            m += `\n*Subtotal:* NIO ${pendingOrder.subtotal}\n`;
            if (pendingOrder.discountAmount > 0) m += `*Descuento (${pendingOrder.discountCode}):* - NIO ${pendingOrder.discountAmount}\n`;
            m += `*Envío:* NIO ${pendingOrder.shippingCost}\n`;
            m += `*TOTAL PAGADO:* NIO ${pendingOrder.total}\n\n`;
            m += `*Comprobante Adjunto:* ${receiptUrl}`;

            const whatsappUrl = `https://wa.me/50587091008?text=${encodeURIComponent(m)}`;
            setCart([]);
            setReceiptFile(null);
            setAcceptTerms(false);
            setIsCartOpen(false);
            setConfirmedOrder({ orderNumber: pendingOrder.orderNumber, customer: pendingOrder.customer, shippingZone: pendingOrder.shippingZone, total: pendingOrder.total, whatsappUrl });
            setPendingOrder(null);
        } catch (error) {
            alert("Ocurrió un error al procesar el pago. Verifica tu conexión e intenta de nuevo.");
        }
        setIsUploading(false);
    };

    const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'UNKNOWN')))];

    return (
        <div className="min-h-screen relative flex flex-col font-mono text-sm bg-black">
            <Toast message={toastMsg} isVisible={!!toastMsg} />

            <PopupBanner isPopupVisible={isPopupVisible} setIsPopupVisible={setIsPopupVisible} popupBanners={popupBanners} />

            <div className="marquee-container font-bebas text-lg tracking-[0.2em] z-50">
                <div className="marquee-content animate-marquee">REAL DROP FOR REAL FANS // ENTREGAS DE 24 a 72 HORAS // REAL DROP FOR REAL FANS // ENTREGAS DE 24 a 72 HORAS // REAL DROP FOR REAL FANS //</div>
            </div>

            <header className="px-4 md:px-8 py-4 flex justify-between items-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
                <div className="cursor-pointer" onClick={closeProduct}>
                    <h1 className="neon-flicker text-3xl md:text-5xl font-bebas tracking-wider leading-none m-0">KURA<span className="text-outline">STUDIO</span></h1>
                </div>
                <button onClick={() => setIsCartOpen(true)} className="brutalist-card px-4 py-2 font-bold flex items-center gap-2 relative text-xs md:text-sm">
                    {pendingOrder && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kuraRed opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-kuraRed"></span></span>}
                    <span className="w-2 h-2 bg-kuraRed rounded-full animate-pulse"></span> CARRITO [{cart.length}]
                </button>
            </header>

            <div className="flex-1 w-full max-w-[1440px] mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[70vh] bg-black">
                        <p className="text-4xl md:text-6xl font-bebas text-zinc-800 animate-pulse">CARGANDO SISTEMA...</p>
                    </div>
                ) : !selectedProduct ? (
                    <HomeView
                        storeConfig={storeConfig}
                        filteredProducts={filteredProducts}
                        products={products}
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        categories={categories}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        openProduct={openProduct}
                    />
                ) : (
                    <ProductDetailView
                        selectedProduct={selectedProduct}
                        closeProduct={closeProduct}
                        products={products}
                        openProduct={openProduct}
                        setIsSizeModalOpen={setIsSizeModalOpen}
                        addToCart={addToCart}
                        selectedSize={selectedSize}
                        setSelectedSize={setSelectedSize}
                        mainImageIndex={mainImageIndex}
                        setMainImageIndex={setMainImageIndex}
                        storeConfig={storeConfig}
                    />
                )}
            </div>

            <SizeModal isSizeModalOpen={isSizeModalOpen} setIsSizeModalOpen={setIsSizeModalOpen} storeConfig={storeConfig} />

            <CartModal
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
                cart={cart}
                setCart={setCart}
                pendingOrder={pendingOrder}
                setPendingOrder={setPendingOrder}
                shippingZone={shippingZone}
                setShippingZone={setShippingZone}
                formData={formData}
                setFormData={setFormData}
                discountInput={discountInput}
                setDiscountInput={setDiscountInput}
                appliedDiscount={appliedDiscount}
                applyDiscount={applyDiscount}
                removeDiscount={removeDiscount}
                discountError={discountError}
                discountAmount={discountAmount}
                cartSubtotal={cartSubtotal}
                cartTotal={cartTotal}
                currentShippingCost={currentShippingCost}
                handleProceedToPayment={handleProceedToPayment}
                receiptFile={receiptFile}
                setReceiptFile={setReceiptFile}
                isUploading={isUploading}
                acceptTerms={acceptTerms}
                setAcceptTerms={setAcceptTerms}
                handleFinalizeOrder={handleFinalizeOrder}
            />

            <OrderConfirmModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<KuraStudio />);
