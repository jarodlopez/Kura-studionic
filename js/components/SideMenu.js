// Menú lateral: navegación rápida a categorías, /como-comprar y /privacidad.
// Se abre desde el ícono de hamburguesa en el header.

window.SideMenu = ({ isMenuOpen, setIsMenuOpen, categories, activeCategory, setActiveCategory }) => {
    if (!isMenuOpen) return null;

    const handleCategory = (cat) => {
        setActiveCategory(cat);
        setIsMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cats = (categories || []).filter(c => c && c !== 'ALL');

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-start" onClick={() => setIsMenuOpen(false)}>
            <div
                onClick={e => e.stopPropagation()}
                className="bg-[#050505] w-[85%] max-w-[340px] h-full border-r border-zinc-800 shadow-2xl flex flex-col animate-slideUp md:rounded-r-2xl overflow-hidden"
            >
                <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-black shrink-0">
                    <h2 className="font-bebas text-3xl tracking-widest flex items-center gap-3">
                        <span className="w-2.5 h-2.5 bg-kuraRed inline-block rounded-full"></span>
                        MENÚ
                    </h2>
                    <button onClick={() => setIsMenuOpen(false)} className="text-zinc-500 hover:text-kuraRed text-xl leading-none p-1" aria-label="Cerrar menú">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* Categorías */}
                    {cats.length > 0 && (
                        <section>
                            <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">CATEGORÍAS</p>
                            <div className="space-y-1">
                                <button
                                    onClick={() => handleCategory('ALL')}
                                    className={`w-full text-left px-3 py-2.5 font-bebas text-lg tracking-wider transition-colors rounded-lg ${activeCategory === 'ALL' ? 'bg-kuraRed text-black' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}
                                >
                                    TODO
                                </button>
                                {cats.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategory(cat)}
                                        className={`w-full text-left px-3 py-2.5 font-bebas text-lg tracking-wider transition-colors rounded-lg ${activeCategory === cat ? 'bg-kuraRed text-black' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Info */}
                    <section>
                        <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">INFORMACIÓN</p>
                        <div className="space-y-1">
                            <a href="/como-comprar" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold tracking-wide text-zinc-300 hover:bg-zinc-900 hover:text-kuraRed transition-colors rounded-lg">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                ¿CÓMO COMPRAR?
                            </a>
                            <a href="/privacidad" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold tracking-wide text-zinc-300 hover:bg-zinc-900 hover:text-kuraRed transition-colors rounded-lg">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                PRIVACIDAD
                            </a>
                        </div>
                    </section>

                </div>

                <div className="p-4 border-t border-zinc-800 text-center shrink-0">
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, letterSpacing: '0.08em' }} className="text-[10px] text-zinc-700">
                        powered by <a href="https://www.instagram.com/kodialabs?igsh=MW02OGxieWp2Z2NrdQ==" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-kuraRed transition-colors">Kodialabs</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
