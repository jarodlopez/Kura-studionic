const { useState, useEffect, useRef } = React;

function AdminPanel() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');

    const [view, setView] = useState(() => {
        const p = new URLSearchParams(window.location.search).get('view');
        return p || 'INVENTORY';
    });

    const [products, setProducts] = useState([]);
    const [inventoryFilter, setInventoryFilter] = useState('TODAS');
    const [formData, setFormData] = useState({ title: '', sku: '', price: '', discountPrice: '', category: '', description: '', details: '', sizes: [], stockBySizes: {}, stock: '', images: [] });
    const [editingId, setEditingId] = useState(null);

    const [storeConfig, setStoreConfig] = useState({ heroSlides: [], sizeGuide: '' });
    const [slideForm, setSlideForm] = useState({ subtitle: '', title: '', cta: '', categoryTarget: '' });

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderSearchQuery, setOrderSearchQuery] = useState('');

    const [discountCodes, setDiscountCodes] = useState([]);
    const [codeForm, setCodeForm] = useState({ code: '', type: 'percent', value: '', expiryDate: '', usageLimit: '' });
    const [editingCodeId, setEditingCodeId] = useState(null);

    const [popupBanners, setPopupBanners] = useState([]);
    const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', ctaText: '', active: true, image: '' });
    const [editingBannerId, setEditingBannerId] = useState(null);

    const [analyticsEvents, setAnalyticsEvents] = useState([]);
    const [analyticsRange, setAnalyticsRange] = useState('7');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [pwaReady, setPwaReady] = useState(!!window.__pwaInstallPrompt);
    const [notifGranted, setNotifGranted] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted');

    const showToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    useEffect(() => {
        window.__pwaReadyCallback = () => setPwaReady(true);
        return () => { window.__pwaReadyCallback = null; };
    }, []);

    const handleNavClick = (id) => {
        setView(id);
        history.pushState({ view: id }, '', '/admin/?view=' + id);
        if (id === 'ORDERS') fetchOrders();
        if (id === 'DISCOUNTS') fetchDiscountCodes();
        if (id === 'BANNERS') fetchPopupBanners();
        if (id === 'ANALYTICS') { fetchAnalytics(); fetchOrders(); }
    };

    useEffect(() => {
        const onPopState = (e) => {
            const p = new URLSearchParams(window.location.search).get('view');
            if (p) setView(p);
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const handleInstall = async () => {
        const prompt = window.__pwaInstallPrompt;
        if (!prompt) return;
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') { window.__pwaInstallPrompt = null; setPwaReady(false); }
    };

    const handleRequestNotif = async () => {
        if (typeof Notification === 'undefined') return showToast('Este dispositivo no soporta notificaciones.', 'error');
        if (Notification.permission === 'denied') return showToast('Notificaciones bloqueadas. Actívalas en los ajustes del navegador.', 'error');
        const perm = await Notification.requestPermission();
        setNotifGranted(perm === 'granted');
        showToast(perm === 'granted' ? 'Alertas de órdenes activadas.' : 'Actívalas desde los ajustes del navegador.', perm === 'granted' ? 'success' : 'error');
    };

    const checkNewOrdersSinceLastVisit = (fetchedOrders) => {
        const key = 'kura_admin_last_visit';
        const lastVisit = localStorage.getItem(key);
        localStorage.setItem(key, new Date().toISOString());
        if (!lastVisit || fetchedOrders.length === 0) return;
        const newOnes = fetchedOrders.filter(o => o.date && o.date > lastVisit);
        if (newOnes.length > 0) {
            showToast(`${newOnes.length} orden${newOnes.length > 1 ? 'es nuevas' : ' nueva'} desde tu última visita`);
        }
    };

    const unsubOrdersRef = useRef(null);

    const startOrderListener = (currentUser) => {
        if (unsubOrdersRef.current) return;
        let firstSnap = true;
        unsubOrdersRef.current = db.collection("orders")
            .orderBy("date", "desc")
            .onSnapshot(snap => {
                if (firstSnap) { firstSnap = false; return; }
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const order = { id: change.doc.id, ...change.doc.data() };
                        showToast(`Nueva orden: #${order.orderNumber} — ${order.customer?.name}`);
                        if (Notification.permission === 'granted') {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.showNotification('KURA STUDIO — Nueva Orden', {
                                    body: `#${order.orderNumber} · ${order.customer?.name} · NIO ${order.total}`,
                                    icon: '/admin/icons/icon-192.png',
                                    badge: '/admin/icons/icon-192.png',
                                    tag: order.orderNumber,
                                    data: { url: '/admin/?view=ORDERS' },
                                    actions: [
                                        { action: 'open', title: 'Ver orden' },
                                        { action: 'close', title: 'Cerrar' },
                                    ],
                                });
                            }).catch(() => {});
                        }
                    }
                });
            });
    };

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            if (currentUser) {
                fetchProducts();
                fetchStoreConfig();
                fetchOrders().then(checkNewOrdersSinceLastVisit);
                fetchDiscountCodes();
                fetchPopupBanners();
                fetchAnalytics();
                startOrderListener(currentUser);
            } else {
                if (unsubOrdersRef.current) { unsubOrdersRef.current(); unsubOrdersRef.current = null; }
            }
        });
        return () => { unsubAuth(); if (unsubOrdersRef.current) unsubOrdersRef.current(); };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsSaving(true);
        try {
            await auth.signInWithEmailAndPassword(loginData.email, loginData.password);
        } catch (error) {
            setLoginError('Credenciales incorrectas o error de conexión.');
        }
        setIsSaving(false);
    };

    const handleLogout = async () => { await auth.signOut(); };

    const fetchProducts = async () => {
        const snap = await db.collection("products").get();
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchStoreConfig = async () => {
        const doc = await db.collection("settings").doc("store").get();
        if (doc.exists) setStoreConfig(doc.data());
    };

    const fetchOrders = async () => {
        const snap = await db.collection("orders").get();
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(fetched);
        return fetched;
    };

    const fetchDiscountCodes = async () => {
        try {
            const snap = await db.collection("discountCodes").get();
            setDiscountCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error(e); }
    };

    const fetchPopupBanners = async () => {
        try {
            const snap = await db.collection("popupBanners").get();
            setPopupBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error(e); }
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const snap = await db.collection("analytics").get();
            setAnalyticsEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error(e); setAnalyticsEvents([]); }
        finally { setAnalyticsLoading(false); }
    };

    const compressImage = async (file, { maxDim = 1400, quality = 0.82 } = {}) => {
        try {
            if (!file || !file.type || !file.type.startsWith('image/')) return file;
            if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
            const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
            const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
            let { width, height } = img;
            if (!width || !height) return file;
            if (width > maxDim || height > maxDim) { const s = Math.min(maxDim / width, maxDim / height); width = Math.round(width * s); height = Math.round(height * s); }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', quality));
            if (!blob || blob.size >= file.size) return file;
            return new File([blob], (file.name || 'img').replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
        } catch (e) { return file; }
    };

    const uploadToImgBB = async (file) => {
        const opt = await compressImage(file);
        const fd = new FormData();
        fd.append("image", opt);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) return data.data.url;
        throw new Error("Error subiendo imagen");
    };

    const managedCats = storeConfig.categories || [];
    const orphanCats = products.map(p => p.category).filter(c => c && !managedCats.includes(c));
    const uniqueCategories = Array.from(new Set([...managedCats, ...orphanCats]));
    const filteredInventory = inventoryFilter === 'TODAS' ? products : products.filter(p => p.category === inventoryFilter);
    const filteredOrders = orders.filter(o => {
        const q = orderSearchQuery.toLowerCase();
        return o.orderNumber?.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q) || o.customer?.phone?.toLowerCase().includes(q);
    });

    const handleProductSubmit = async (e) => {
        e.preventDefault(); setIsSaving(true);
        if (!formData.category) { showToast('Selecciona una categoría.', 'error'); setIsSaving(false); return; }
        try {
            const cleanStock = {};
            Object.entries(formData.stockBySizes || {}).forEach(([sz, val]) => {
                if (val !== '' && val !== null && val !== undefined) cleanStock[sz] = Number(val);
            });
            const data = { ...formData, price: Number(formData.price), discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null, stock: Number(formData.stock), details: formData.details.split('\n').filter(d => d), stockBySizes: cleanStock };
            if (editingId) await db.collection("products").doc(editingId).update(data);
            else await db.collection("products").add({ ...data, createdAt: new Date().toISOString() });
            setFormData({ title: '', sku: '', price: '', discountPrice: '', category: '', description: '', details: '', sizes: [], stockBySizes: {}, stock: '', images: [] });
            setEditingId(null); fetchProducts();
            showToast(editingId ? 'Prenda actualizada.' : 'Prenda añadida al catálogo.');
        } catch (error) { showToast("Error al guardar: " + error.message, 'error'); }
        finally { setIsSaving(false); }
    };

    const handleProductImage = async (e) => {
        setIsSaving(true);
        for (const file of e.target.files) {
            const url = await uploadToImgBB(file);
            setFormData(p => ({ ...p, images: [...p.images, url] }));
        }
        setIsSaving(false);
    };

    const saveStoreConfig = async (newConfig) => {
        await db.collection("settings").doc("store").set(newConfig, { merge: true });
        setStoreConfig(newConfig);
    };

    const handleSizeGuideUpload = async (e) => {
        if (!e.target.files[0]) return;
        setIsSaving(true);
        const url = await uploadToImgBB(e.target.files[0]);
        await saveStoreConfig({ ...storeConfig, sizeGuide: url });
        setIsSaving(false);
    };

    // --- Cuentas bancarias (pestaña PAGOS) ---
    const handleAddBank = async (bank) => {
        const name = (bank.name || '').trim();
        const accountNumber = (bank.accountNumber || '').trim();
        const holder = (bank.holder || '').trim();
        if (!name || !accountNumber || !holder) { showToast('Completa banco, cuenta y titular', 'error'); return; }
        setIsSaving(true);
        try {
            let logoUrl = '';
            if (bank.logoFile) logoUrl = await uploadToImgBB(bank.logoFile);
            const newBank = {
                id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
                name, accountNumber, holder,
                currency: (bank.currency || 'C$').trim(),
                logoUrl,
            };
            await saveStoreConfig({ ...storeConfig, bankAccounts: [...(storeConfig.bankAccounts || []), newBank] });
            showToast('Banco agregado');
        } catch { showToast('Error al agregar el banco', 'error'); }
        setIsSaving(false);
    };

    const handleSeedDefaultBanks = async () => {
        const defaults = [
            { id: `${Date.now()}1`, name: 'BAC', accountNumber: '367298642', holder: 'KATHY VALESKA MEMBREÑO MEDINA', currency: 'C$', logoUrl: '' },
            { id: `${Date.now()}2`, name: 'LAFISE', accountNumber: '117240166', holder: 'KATHY VALESKA MEMBREÑO MEDINA', currency: 'C$', logoUrl: '' },
        ];
        setIsSaving(true);
        try {
            await saveStoreConfig({ ...storeConfig, bankAccounts: [...(storeConfig.bankAccounts || []), ...defaults] });
            showToast('Cuentas anteriores cargadas');
        } catch { showToast('Error al cargar las cuentas', 'error'); }
        setIsSaving(false);
    };

    const handleRemoveBank = async (id) => {
        if (!window.confirm('¿Eliminar esta cuenta bancaria?')) return;
        const banks = (storeConfig.bankAccounts || []).filter(b => b.id !== id);
        await saveStoreConfig({ ...storeConfig, bankAccounts: banks });
    };

    const handleBankLogoUpload = async (id, file) => {
        if (!file) return;
        setIsSaving(true);
        try {
            const logoUrl = await uploadToImgBB(file);
            const banks = (storeConfig.bankAccounts || []).map(b => b.id === id ? { ...b, logoUrl } : b);
            await saveStoreConfig({ ...storeConfig, bankAccounts: banks });
        } catch { showToast('Error al subir el logo', 'error'); }
        setIsSaving(false);
    };

    const handleAddCategory = async (name) => {
        const trimmed = name.trim().toUpperCase();
        if (!trimmed || uniqueCategories.includes(trimmed)) return;
        const base = storeConfig.categories?.length > 0 ? storeConfig.categories : uniqueCategories;
        await saveStoreConfig({ ...storeConfig, categories: [...base, trimmed] });
    };

    const handleRemoveCategory = async (name) => {
        if (!window.confirm(`¿Eliminar la colección "${name}"? Los productos asignados no se eliminan.`)) return;
        const cats = (storeConfig.categories || uniqueCategories).filter(c => c !== name);
        const covers = { ...(storeConfig.categoryCovers || {}) };
        delete covers[name];
        await saveStoreConfig({ ...storeConfig, categories: cats, categoryCovers: covers });
    };

    const handleMoveCategoryUp = async (index) => {
        const cats = [...(storeConfig.categories || uniqueCategories)];
        if (index === 0) return;
        [cats[index - 1], cats[index]] = [cats[index], cats[index - 1]];
        await saveStoreConfig({ ...storeConfig, categories: cats });
    };

    const handleMoveCategoryDown = async (index) => {
        const cats = [...(storeConfig.categories || uniqueCategories)];
        if (index === cats.length - 1) return;
        [cats[index], cats[index + 1]] = [cats[index + 1], cats[index]];
        await saveStoreConfig({ ...storeConfig, categories: cats });
    };

    const handleCategoryCoversUpload = async (category, file) => {
        setIsSaving(true);
        const covers = { ...(storeConfig.categoryCovers || {}) };
        if (file) {
            const url = await uploadToImgBB(file);
            covers[category] = url;
        } else {
            delete covers[category];
        }
        await saveStoreConfig({ ...storeConfig, categoryCovers: covers });
        setIsSaving(false);
    };

    const handleSlideAdd = async (e) => {
        if (!e.target.files[0]) return;
        setIsSaving(true);
        const url = await uploadToImgBB(e.target.files[0]);
        const newSlide = { id: Date.now(), image: url, subtitle: slideForm.subtitle.toUpperCase(), title: slideForm.title.toUpperCase(), cta: slideForm.cta.toUpperCase() || 'VER COLECCIÓN', categoryTarget: slideForm.categoryTarget };
        await saveStoreConfig({ ...storeConfig, heroSlides: [...(storeConfig.heroSlides || []), newSlide] });
        setSlideForm({ subtitle: '', title: '', cta: '', categoryTarget: '' });
        setIsSaving(false);
    };

    const removeSlide = async (id) => {
        await saveStoreConfig({ ...storeConfig, heroSlides: storeConfig.heroSlides.filter(s => s.id !== id) });
    };

    const deleteOrder = async (id) => {
        if (!window.confirm('¿Eliminar esta orden? Esta acción no se puede deshacer.')) return;
        try {
            await db.collection("orders").doc(id).delete();
            setOrders(prev => prev.filter(o => o.id !== id));
            setSelectedOrder(null);
            showToast('Orden eliminada.');
        } catch (error) { showToast("Error al eliminar: " + error.message, 'error'); }
    };

    const markOrderSeen = async (id) => {
        const order = orders.find(o => o.id === id);
        if (!order || order.seenByAdmin) return;
        try {
            await db.collection("orders").doc(id).update({ seenByAdmin: true });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, seenByAdmin: true } : o));
        } catch { /* no interrumpir UX */ }
    };

    const updateOrderStatus = async (id, status) => {
        try {
            await db.collection("orders").doc(id).update({ status });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            setSelectedOrder(prev => prev?.id === id ? { ...prev, status } : prev);
        } catch { showToast('Error al actualizar estado', 'error'); }
    };

    const getPrice = (product) => product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
    const formatDate = (iso) => { if (!iso) return 'Fecha desconocida'; return new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' }); };

    const handleCodeSubmit = async (e) => {
        e.preventDefault(); setIsSaving(true);
        try {
            const existing = editingCodeId ? discountCodes.find(c => c.id === editingCodeId) : null;
            const data = { code: codeForm.code.toUpperCase().trim(), type: codeForm.type, value: Number(codeForm.value), expiryDate: codeForm.expiryDate || '', usageLimit: codeForm.usageLimit ? Number(codeForm.usageLimit) : 0, usageCount: existing ? existing.usageCount : 0, active: true, createdAt: existing ? existing.createdAt : new Date().toISOString() };
            if (editingCodeId) await db.collection("discountCodes").doc(editingCodeId).update(data);
            else await db.collection("discountCodes").add(data);
            setCodeForm({ code: '', type: 'percent', value: '', expiryDate: '', usageLimit: '' });
            setEditingCodeId(null); fetchDiscountCodes();
            showToast(editingCodeId ? 'Código actualizado.' : 'Código creado.');
        } catch (error) { showToast("Error: " + error.message, 'error'); }
        finally { setIsSaving(false); }
    };

    const deleteCode = async (id) => {
        if (!window.confirm('¿Eliminar este código?')) return;
        await db.collection("discountCodes").doc(id).delete(); fetchDiscountCodes();
    };

    const toggleCodeActive = async (id, current) => {
        await db.collection("discountCodes").doc(id).update({ active: !current }); fetchDiscountCodes();
    };

    const handleBannerImageUpload = async (e) => {
        if (!e.target.files[0]) return;
        setIsSaving(true);
        const url = await uploadToImgBB(e.target.files[0]);
        setBannerForm(p => ({ ...p, image: url }));
        setIsSaving(false);
    };

    const handleBannerSubmit = async (e) => {
        e.preventDefault();
        if (!bannerForm.image) return showToast('Sube una imagen para el banner.', 'error');
        setIsSaving(true);
        try {
            const existing = editingBannerId ? popupBanners.find(b => b.id === editingBannerId) : null;
            const data = { title: bannerForm.title.toUpperCase(), subtitle: bannerForm.subtitle, ctaText: bannerForm.ctaText.toUpperCase(), active: bannerForm.active, image: bannerForm.image, createdAt: existing ? existing.createdAt : new Date().toISOString() };
            if (editingBannerId) await db.collection("popupBanners").doc(editingBannerId).update(data);
            else await db.collection("popupBanners").add(data);
            setBannerForm({ title: '', subtitle: '', ctaText: '', active: true, image: '' });
            setEditingBannerId(null); fetchPopupBanners();
            showToast(editingBannerId ? 'Banner actualizado.' : 'Banner guardado.');
        } catch (error) { showToast("Error: " + error.message, 'error'); }
        finally { setIsSaving(false); }
    };

    const deleteBanner = async (id) => {
        if (!window.confirm('¿Eliminar este banner?')) return;
        await db.collection("popupBanners").doc(id).delete(); fetchPopupBanners();
    };

    const toggleBannerActive = async (id, current) => {
        await db.collection("popupBanners").doc(id).update({ active: !current }); fetchPopupBanners();
    };

    if (authLoading) return <div className="min-h-screen bg-black flex justify-center items-center font-bebas text-4xl text-kuraRed animate-pulse">VERIFICANDO SISTEMA...</div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center px-4" style={{ backgroundImage: 'linear-gradient(rgba(255, 0, 60, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 60, 0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="font-bebas text-6xl text-white leading-none">KURA<span className="text-kuraRed">STUDIO</span></h1>
                        <p className="text-zinc-600 font-mono text-[11px] tracking-[0.3em] mt-2">PANEL DE ADMINISTRACIÓN</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl">
                        {loginError && (
                            <div className="flex items-center gap-2 bg-red-950/50 border border-red-900 text-red-300 text-xs p-3 mb-5 font-mono">
                                <span className="text-red-500">✕</span> {loginError}
                            </div>
                        )}
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold tracking-widest block mb-1.5">CORREO</label>
                                <input type="email" required className="brutalist-input" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold tracking-widest block mb-1.5">CONTRASEÑA</label>
                                <input type="password" required className="brutalist-input" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
                            </div>
                            <button type="submit" disabled={isSaving} className="brutalist-btn w-full mt-2 flex items-center justify-center gap-2">
                                {isSaving && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>}
                                {isSaving ? 'CONECTANDO...' : 'ENTRAR AL SISTEMA'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    const IC = {
        INVENTORY: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
        DESIGN:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
        ORDERS:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>,
        DISCOUNTS: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>,
        BANNERS:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
        ANALYTICS: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
        PAYMENTS:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    };
    const navItems = [
        { id: 'INVENTORY', label: 'Inventario', short: 'Stock',   icon: IC.INVENTORY },
        { id: 'DESIGN',    label: 'Diseño',     short: 'Diseño',  icon: IC.DESIGN },
        { id: 'ORDERS',    label: 'Órdenes',    short: 'Órdenes', icon: IC.ORDERS,   badge: orders.filter(o => !o.seenByAdmin).length || undefined },
        { id: 'PAYMENTS',  label: 'Pagos',      short: 'Pagos',   icon: IC.PAYMENTS },
        { id: 'DISCOUNTS', label: 'Descuentos', short: 'Códigos', icon: IC.DISCOUNTS },
        { id: 'BANNERS',   label: 'Pop-ups',    short: 'Banners', icon: IC.BANNERS },
        { id: 'ANALYTICS', label: 'Analytics',  short: 'Stats',   icon: IC.ANALYTICS },
    ];

    const viewTitles = { INVENTORY: 'INVENTARIO', DESIGN: 'DISEÑO WEB', ORDERS: 'ÓRDENES', PAYMENTS: 'PAGOS', DISCOUNTS: 'DESCUENTOS', BANNERS: 'POP-UPS', ANALYTICS: 'ANALYTICS' };

    return (
        <div className="h-screen flex overflow-hidden bg-zinc-950">
            {/* TOASTS */}
            <div className="fixed top-4 right-4 z-[500] flex flex-col gap-2 w-64 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`px-4 py-3 font-mono text-xs font-bold flex items-center gap-3 shadow-2xl animate-slideUp pointer-events-auto border-l-4 rounded-xl ${t.type === 'error' ? 'bg-zinc-950 border-red-500 text-red-300' : 'bg-zinc-950 border-kuraRed text-white'}`}>
                        <span className={`text-base shrink-0 ${t.type === 'error' ? 'text-red-500' : 'text-kuraRed'}`}>{t.type === 'error' ? '✕' : '✓'}</span>
                        <span className="leading-tight">{t.msg}</span>
                    </div>
                ))}
            </div>

            {/* SIDEBAR — desktop only */}
            <aside className="admin-sidebar">
                <div className="px-5 py-5 border-b border-zinc-900">
                    <p className="font-bebas text-xl text-white leading-none">KURA <span className="text-kuraRed">STUDIO</span></p>
                    <p className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] mt-1">ADMINISTRACIÓN</p>
                </div>
                <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ id, label, icon, badge }) => (
                        <button
                            key={id}
                            onClick={() => handleNavClick(id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-medium rounded-lg transition-all text-left ${view === id ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}
                        >
                            <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${view === id ? 'text-kuraRed' : 'text-zinc-500'}`}>{icon}</span>
                            {label}
                            {badge !== undefined && (
                                <span className={`ml-auto text-[10px] px-1.5 py-0.5 font-mono rounded ${view === id ? 'bg-kuraRed text-black' : 'bg-zinc-800 text-zinc-500'}`}>{badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-zinc-900">
                    {pwaReady && (
                        <button onClick={handleInstall} className="w-full mb-3 flex items-center gap-2 px-3 py-2 bg-kuraRed text-black text-[11px] font-bold hover:opacity-90 transition-opacity">
                            <span>↓</span> INSTALAR APP
                        </button>
                    )}
                    {!notifGranted && (
                        <button onClick={handleRequestNotif} className="w-full mb-3 flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] font-bold hover:border-kuraRed hover:text-white transition-colors">
                            <span className="text-kuraRed">◉</span> ACTIVAR ALERTAS
                        </button>
                    )}
                    <p className="text-[10px] text-zinc-600 font-mono truncate mb-2">{user.email}</p>
                    <button onClick={handleLogout} className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors font-bold tracking-widest">CERRAR SESIÓN →</button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-black border-b border-zinc-900 px-4 h-12 flex items-center justify-between shrink-0">
                    <h2 className="font-bebas text-xl text-white tracking-wide">{viewTitles[view]}</h2>
                    <div className="flex items-center gap-2">
                        {(view === 'ORDERS' || view === 'ANALYTICS') && (
                            <button onClick={() => { fetchOrders(); if (view === 'ANALYTICS') fetchAnalytics(); }} className="text-[11px] font-bold text-zinc-500 hover:text-white flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 hover:border-zinc-600 transition-colors">↻ ACTUALIZAR</button>
                        )}
                        {!notifGranted && (
                            <button onClick={handleRequestNotif} title="Activar alertas de órdenes" className="text-[11px] font-bold text-kuraRed flex items-center gap-1 border border-zinc-800 px-2.5 py-1.5 hover:border-kuraRed transition-colors">
                                ◉ ALERTAS
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto pt-4 px-4 admin-main-padding">
                    {isSaving && (
                        <div className="admin-saving-offset fixed left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-5 py-3 text-xs font-mono font-bold text-white shadow-2xl rounded-full">
                            <span className="w-3 h-3 border-2 border-kuraRed border-t-transparent rounded-full animate-spin shrink-0"></span>
                            Guardando...
                        </div>
                    )}

                    {view === 'INVENTORY' && (
                        <window.InventoryView
                            products={products} formData={formData} setFormData={setFormData}
                            editingId={editingId} setEditingId={setEditingId}
                            handleProductSubmit={handleProductSubmit} handleProductImage={handleProductImage}
                            isSaving={isSaving} uniqueCategories={uniqueCategories}
                            filteredInventory={filteredInventory} inventoryFilter={inventoryFilter}
                            setInventoryFilter={setInventoryFilter} fetchProducts={fetchProducts} db={db}
                        />
                    )}
                    {view === 'DESIGN' && (
                        <window.DesignView
                            storeConfig={storeConfig} slideForm={slideForm} setSlideForm={setSlideForm}
                            uniqueCategories={uniqueCategories} handleSizeGuideUpload={handleSizeGuideUpload}
                            handleCategoryCoversUpload={handleCategoryCoversUpload}
                            handleAddCategory={handleAddCategory} handleRemoveCategory={handleRemoveCategory}
                            handleMoveCategoryUp={handleMoveCategoryUp} handleMoveCategoryDown={handleMoveCategoryDown}
                            handleSlideAdd={handleSlideAdd} removeSlide={removeSlide} isSaving={isSaving}
                        />
                    )}
                    {view === 'ORDERS' && (
                        <window.OrdersView
                            orders={orders} filteredOrders={filteredOrders}
                            selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
                            orderSearchQuery={orderSearchQuery} setOrderSearchQuery={setOrderSearchQuery}
                            deleteOrder={deleteOrder} formatDate={formatDate} getPrice={getPrice}
                            markOrderSeen={markOrderSeen} updateOrderStatus={updateOrderStatus}
                            showToast={showToast}
                        />
                    )}
                    {view === 'PAYMENTS' && (
                        <window.PaymentsView
                            storeConfig={storeConfig}
                            handleAddBank={handleAddBank}
                            handleRemoveBank={handleRemoveBank}
                            handleBankLogoUpload={handleBankLogoUpload}
                            handleSeedDefaultBanks={handleSeedDefaultBanks}
                            isSaving={isSaving}
                        />
                    )}
                    {view === 'DISCOUNTS' && (
                        <window.DiscountsView
                            discountCodes={discountCodes} codeForm={codeForm} setCodeForm={setCodeForm}
                            editingCodeId={editingCodeId} setEditingCodeId={setEditingCodeId}
                            handleCodeSubmit={handleCodeSubmit} deleteCode={deleteCode}
                            toggleCodeActive={toggleCodeActive} isSaving={isSaving}
                        />
                    )}
                    {view === 'BANNERS' && (
                        <window.BannersView
                            popupBanners={popupBanners} bannerForm={bannerForm} setBannerForm={setBannerForm}
                            editingBannerId={editingBannerId} setEditingBannerId={setEditingBannerId}
                            handleBannerSubmit={handleBannerSubmit} handleBannerImageUpload={handleBannerImageUpload}
                            deleteBanner={deleteBanner} toggleBannerActive={toggleBannerActive} isSaving={isSaving}
                        />
                    )}
                    {view === 'ANALYTICS' && (
                        <window.AnalyticsView
                            analyticsEvents={analyticsEvents} analyticsRange={analyticsRange}
                            setAnalyticsRange={setAnalyticsRange} analyticsLoading={analyticsLoading}
                            orders={orders} fetchAnalytics={fetchAnalytics} fetchOrders={fetchOrders}
                        />
                    )}
                </main>
            </div>

            {/* BOTTOM NAV — mobile only */}
            <nav className="admin-bottom-nav">
                {navItems.map(({ id, short, label, icon, badge }) => (
                    <button
                        key={id}
                        onClick={() => handleNavClick(id)}
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative ${view === id ? 'text-kuraRed' : 'text-zinc-500'}`}
                        style={{ touchAction: 'manipulation' }}
                    >
                        {view === id && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-kuraRed rounded-full" />
                        )}
                        <span className="relative flex items-center justify-center">
                            {icon}
                            {badge !== undefined && badge > 0 && (
                                <span className="absolute -top-1.5 -right-2 bg-kuraRed text-black text-[8px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">{badge > 9 ? '9+' : badge}</span>
                            )}
                        </span>
                        <span className="text-[10px] font-medium leading-none tracking-tight">{short || label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminPanel />);
