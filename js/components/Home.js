window.HomeView = ({ storeConfig, filteredProducts, products, activeCategory, setActiveCategory, categories, searchQuery, setSearchQuery, openProduct }) => {
    const [currentHeroSlide, setCurrentHeroSlide] = React.useState(0);

    // Rotación automática — solo activa cuando HomeView está montado (sin producto seleccionado)
    React.useEffect(() => {
        if (!storeConfig.heroSlides || storeConfig.heroSlides.length <= 1) return;
        const timer = setInterval(() => setCurrentHeroSlide(prev => (prev + 1) % storeConfig.heroSlides.length), 5000);
        return () => clearInterval(timer);
    }, [storeConfig.heroSlides]);

    return (
        <div className="animate-slideUp pb-20">

            {/* HERO SLIDER */}
            {storeConfig.heroSlides && storeConfig.heroSlides.length > 0 && (
                <div className="relative w-full h-[50vh] md:h-[70vh] bg-kuraDark overflow-hidden border-b-2 border-zinc-900">
                    {storeConfig.heroSlides.map((slide, index) => (
                        <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentHeroSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
                            <SmoothImage src={slide.image} width={1600} className="w-full h-full object-cover scale-105" alt={slide.title ? `KURA STUDIO – ${slide.title}` : "KURA STUDIO colección"} eager={index === 0} />
                            <div className="absolute bottom-10 left-4 md:left-12 z-20">
                                <p className="text-kuraRed font-mono text-xs md:text-sm tracking-[0.3em] mb-2">{slide.subtitle}</p>
                                <h2 className="text-5xl md:text-8xl font-bebas text-white leading-none mb-6">{slide.title}</h2>
                                <button
                                    onClick={() => {
                                        if (slide.categoryTarget) setActiveCategory(slide.categoryTarget);
                                        window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' });
                                    }}
                                    className="brutalist-btn px-8 py-3"
                                >
                                    {slide.cta || 'VER COLECCIÓN'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* BARRA DE CATEGORÍAS Y BÚSQUEDA */}
            {products.length > 0 && (
                <div className="px-4 md:px-8 py-4 border-b border-zinc-900 sticky top-[72px] bg-black/95 z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex overflow-x-auto no-scrollbar gap-2 items-center w-full md:w-auto">
                        <span className="text-zinc-500 font-bold text-xs tracking-widest mr-2 whitespace-nowrap">CATEGORÍAS:</span>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`brutalist-btn-outline px-4 py-1 text-xs whitespace-nowrap ${activeCategory === cat ? 'active' : ''}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="BUSCAR PRENDA..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white px-4 py-2 text-xs outline-none focus:border-kuraRed transition-colors pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">⌕</span>
                        </div>
                    </div>
                </div>
            )}

            {/* GRILLA DE PRODUCTOS */}
            <main className="p-4 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-20 text-center flex flex-col items-center">
                        <span className="text-4xl mb-4">🛸</span>
                        <h3 className="font-bebas text-3xl text-zinc-600">NO SE ENCONTRÓ NADA</h3>
                        <p className="text-zinc-500 text-xs mt-2">Intenta buscar con otra palabra clave.</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="brutalist-card flex flex-col cursor-pointer" onClick={() => openProduct(product)}>
                            <div className="relative w-full aspect-[4/5] bg-zinc-950 border-b border-zinc-800">
                                <SmoothImage src={product.images?.[0]} width={600} className="absolute inset-0 w-full h-full object-cover" alt={`${product.title} – KURA STUDIO`} />
                                <div className="absolute top-2 left-2 bg-white text-black font-bebas px-2 py-0.5 text-sm z-10">{product.category}</div>
                                {product.discountPrice && product.discountPrice > 0 && (
                                    <div className="absolute top-2 right-2 bg-kuraRed text-black font-bebas px-2 py-0.5 text-sm z-10 animate-pulse">OFERTA</div>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <h2 className="text-xl md:text-2xl font-bebas tracking-wide leading-tight mb-1">{product.title}</h2>
                                {product.discountPrice && product.discountPrice > 0 ? (
                                    <div className="flex flex-col mt-auto pt-2">
                                        <p className="text-zinc-500 line-through text-xs font-mono">NIO {product.price}</p>
                                        <p className="text-kuraRed font-bold font-mono text-sm">NIO {product.discountPrice}</p>
                                    </div>
                                ) : (
                                    <p className="text-kuraRed font-bold font-mono text-sm mt-auto pt-2">NIO {product.price}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};
