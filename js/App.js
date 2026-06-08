const SITE_URL = 'https://kurastudio.vercel.app';
const DEFAULT_META = {
    title: 'KURA STUDIO | Ropa Streetwear Nicaragua',
    description: 'KURA STUDIO – Ropa streetwear auténtica hecha para los fans reales. Entregas en 24 a 72 horas en Nicaragua.',
    image: 'https://i.ibb.co/Q7V0K9jg/BOXY-DROP-KURA-12.png',
    url: SITE_URL + '/',
};

function updateMetaTags(product) {
    const meta = product ? {
        title: `${product.title} – KURA STUDIO`,
        description: (product.description || '').slice(0, 155) ||
            `${product.title} en KURA STUDIO. Streetwear auténtico con entregas en Nicaragua.`,
        image: product.images?.[0] || DEFAULT_META.image,
        url: `${SITE_URL}/?product=${product.id}`,
    } : DEFAULT_META;

    document.title = meta.title;
    const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('link[rel="canonical"]', 'href', meta.url);
    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:image"]', 'content', meta.image);
    setMeta('meta[property="og:url"]', 'content', meta.url);
    setMeta('meta[name="twitter:title"]', 'content', meta.title);
    setMeta('meta[name="twitter:description"]', 'content', meta.description);
    setMeta('meta[name="twitter:image"]', 'content', meta.image);

    const existing = document.getElementById('product-jsonld');
    if (existing) existing.remove();
    if (product) {
        const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
        const ld = {
            '@context': 'https://schema.org', '@type': 'Product',
            name: product.title, description: meta.description,
            image: product.images || [meta.image],
            sku: product.sku || product.id,
            brand: { '@type': 'Brand', name: 'KURA STUDIO' },
            offers: {
                '@type': 'Offer', url: meta.url, priceCurrency: 'NIO', price: price,
                availability: 'https://schema.org/InStock',
                seller: { '@type': 'Organization', name: 'KURA STUDIO' }
            }
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'product-jsonld';
        script.textContent = JSON.stringify(ld);
        document.head.appendChild(script);
    }
}

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

    const [shippingZone, setShippingZone] = useState('managua');
    const [discountCodes, setDiscountCodes] = useState([]);
    const [discountInput, setDiscountInput] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountError, setDiscountError] = useState('');

    const [popupBanners, setPopupBanners] = useState([]);
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('kura_cart')) || []; } catch { return []; } });
    useEffect(() => { localStorage.setItem('kura_cart', JSON.stringify(cart)); }, [cart]);

    // Pulsing dot on cart icon if a pending order exists (set by checkout page)
    const [hasPendingOrder] = useState(() => !!localStorage.getItem('kura_pending_order'));

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
        if (id) { const found = items.find(p => p.id === id); if (found) { openProduct(found); updateMetaTags(found); } }
    };

    const openProduct = (product) => {
        setSelectedProduct(product); setSelectedSize(''); setMainImageIndex(0);
        window.history.pushState(null, '', `?product=${product.id}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateMetaTags(product);
        trackEvent('product_view', { productId: product.id, productTitle: product.title, category: product.category || '' });
    };

    const closeProduct = () => {
        setSelectedProduct(null);
        window.history.pushState(null, '', window.location.pathname);
        updateMetaTags(null);
    };

    const addToCart = (product) => {
        if (!selectedSize && product.sizes?.length > 0) return alert('SELECCIONA UNA TALLA PARA CONTINUAR');
        const sizeToSave = selectedSize || 'ÚNICA';
        setCart([...cart, { ...product, selectedSize: sizeToSave, cartId: Date.now() }]);
        setToastMsg(`AGREGADO: ${product.title}`); setTimeout(() => setToastMsg(''), 3000);
        trackEvent('add_to_cart', { productId: product.id, productTitle: product.title, price: getPrice(product) });
    };

    const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'UNKNOWN')))];

    return (
        <div className="min-h-screen relative flex flex-col text-sm bg-black">
            <Toast message={toastMsg} isVisible={!!toastMsg} />

            <PopupBanner isPopupVisible={isPopupVisible} setIsPopupVisible={setIsPopupVisible} popupBanners={popupBanners} />

            <div className="marquee-container font-bebas text-lg tracking-[0.2em] z-50">
                <div className="marquee-content animate-marquee">REAL DROP FOR REAL FANS // ENTREGAS DE 24 a 72 HORAS // REAL DROP FOR REAL FANS // ENTREGAS DE 24 a 72 HORAS // REAL DROP FOR REAL FANS //</div>
            </div>

            <header className="px-4 md:px-8 py-4 flex justify-between items-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
                <div className="cursor-pointer" onClick={closeProduct}>
                    <h1 className="neon-flicker text-3xl md:text-5xl font-bebas tracking-wider leading-none m-0">KURA<span className="text-outline">STUDIO</span></h1>
                </div>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:text-kuraRed transition-colors" aria-label="Abrir carrito">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    {cart.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-kuraRed text-black text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                            {cart.length > 9 ? '9+' : cart.length}
                        </span>
                    )}
                    {hasPendingOrder && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kuraRed opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-kuraRed"></span>
                        </span>
                    )}
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

            <MiniCart
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
                cart={cart}
                setCart={setCart}
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
                shippingZone={shippingZone}
                setShippingZone={setShippingZone}
            />

            {/* Floating cart button */}
            <button
                onClick={() => setIsCartOpen(true)}
                aria-label="Ver carrito"
                className={`fixed bottom-6 right-4 z-[100] flex items-center gap-2 bg-kuraRed text-black font-bebas text-lg rounded-full transition-all duration-300 ${cart.length > 0 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                style={{ padding: '0.7rem 1.4rem 0.7rem 1.1rem', boxShadow: '0 4px 28px rgba(255,0,60,0.55), 0 2px 8px rgba(0,0,0,0.5)' }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {cart.length} {cart.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}
            </button>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<KuraStudio />);
