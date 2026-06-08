window.DesignView = ({ storeConfig, slideForm, setSlideForm, uniqueCategories,
    handleSizeGuideUpload, handleCategoryCoversUpload,
    handleAddCategory, handleRemoveCategory, handleMoveCategoryUp, handleMoveCategoryDown,
    handleSlideAdd, removeSlide, isSaving }) => {

    const [formOpen, setFormOpen] = React.useState(false);
    const [newCatInput, setNewCatInput] = React.useState('');
    const closeForm = () => setFormOpen(false);

    const renderSlideForm = () => (
        <div className="bg-zinc-950 h-max">
            {/* Mobile sheet header */}
            <div className="form-sheet-header flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
                <h3 className="font-bebas text-2xl text-kuraRed">AÑADIR PORTADA</h3>
                <button type="button" onClick={closeForm} className="text-zinc-400 text-xl font-bold p-1 leading-none">✕</button>
            </div>

            <div className="p-4 space-y-4">
                {/* Desktop header */}
                <div className="hidden-in-sheet">
                    <h2 className="font-bebas text-3xl text-kuraRed mb-4">AÑADIR PORTADA (HERO SLIDER)</h2>
                </div>

                <input placeholder="SUBTÍTULO (Ej: NUEVA COLECCIÓN)" className="brutalist-input" value={slideForm.subtitle} onChange={e => setSlideForm({ ...slideForm, subtitle: e.target.value })} />
                <input placeholder="TÍTULO PRINCIPAL" className="brutalist-input" value={slideForm.title} onChange={e => setSlideForm({ ...slideForm, title: e.target.value })} />

                <div className="flex flex-col gap-2">
                    <input placeholder="TEXTO DEL BOTÓN (Ej: VER T-SHIRTS)" className="brutalist-input" value={slideForm.cta} onChange={e => setSlideForm({ ...slideForm, cta: e.target.value })} />
                    <select className="brutalist-input text-xs" value={slideForm.categoryTarget} onChange={e => setSlideForm({ ...slideForm, categoryTarget: e.target.value })}>
                        <option value="">ENLAZAR A CATEGORÍA (Opcional)</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="border border-zinc-800 p-4 bg-black">
                    <p className="text-xs text-zinc-500 mb-2 font-bold">SELECCIONA LA IMAGEN DE PORTADA</p>
                    <input type="file" accept="image/*" onChange={(e) => { handleSlideAdd(e); closeForm(); }} className="text-xs w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                    <p className="text-[10px] text-zinc-600 mt-2">Al seleccionar la imagen se guardará automáticamente.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="view-animate">
            {/* Mobile form sheet */}
            <div className={`form-sheet ${formOpen ? 'is-open' : ''}`}>
                {renderSlideForm()}
            </div>

            <div className="flex flex-col gap-6">
                {/* Hero Slider section */}
                <div className="flex gap-6">
                    {/* Desktop form sidebar */}
                    <div className="desk-form border border-zinc-800 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
                        {renderSlideForm()}
                    </div>

                    {/* Portadas activas list */}
                    <div className="flex-1 min-w-0 border border-zinc-800 p-5 bg-zinc-950 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bebas text-2xl border-b border-zinc-800 pb-2 flex-1">PORTADAS ACTIVAS ({storeConfig.heroSlides?.length || 0})</h3>
                        </div>
                        <div className="space-y-3">
                            {storeConfig.heroSlides?.map(slide => (
                                <div key={slide.id} className="flex gap-4 border border-zinc-800 p-3 items-center bg-black">
                                    <img src={slide.image} className="w-20 h-14 object-cover border border-zinc-700 shrink-0" />
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <p className="font-bebas text-xl leading-none truncate">{slide.title}</p>
                                        <p className="text-[10px] text-zinc-500 mt-1 truncate">{slide.subtitle} | Botón: {slide.cta}</p>
                                        {slide.categoryTarget && <p className="text-[10px] text-kuraRed mt-1">⮑ {slide.categoryTarget}</p>}
                                    </div>
                                    <button onClick={() => removeSlide(slide.id)} className="text-red-500 font-bold px-3 py-2 hover:bg-red-900 border border-transparent hover:border-red-500 transition-colors shrink-0">✕</button>
                                </div>
                            ))}
                            {(!storeConfig.heroSlides || storeConfig.heroSlides.length === 0) && (
                                <p className="text-zinc-600 text-sm font-mono italic py-6 text-center">No hay portadas configuradas.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Size Guide section — always full width below */}
                <div className="border border-zinc-800 p-5 bg-zinc-950 rounded-2xl overflow-hidden">
                    <h2 className="font-bebas text-3xl text-kuraRed mb-3">GUÍA DE TALLAS GLOBAL</h2>
                    <p className="text-xs text-zinc-400 mb-5 leading-relaxed">Sube una imagen con la tabla de medidas. Aparecerá cuando el cliente toque "Guía de Medidas" al ver una prenda.</p>
                    <div className="border border-zinc-800 p-4 bg-black mb-5">
                        <p className="text-xs text-zinc-500 mb-2 font-bold">SUBIR O REEMPLAZAR IMAGEN</p>
                        <input type="file" accept="image/*" onChange={handleSizeGuideUpload} className="text-xs w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                    </div>
                    {storeConfig.sizeGuide ? (
                        <div className="border border-zinc-800 p-4 bg-black">
                            <p className="text-xs text-kuraRed mb-3 font-bold border-b border-zinc-800 pb-2">GUÍA ACTUAL:</p>
                            <img src={storeConfig.sizeGuide} className="w-full h-auto border border-zinc-900 max-w-lg" />
                        </div>
                    ) : (
                        <p className="text-red-500 text-xs bg-red-950/30 p-3 border border-red-900">NO HAY GUÍA DE TALLAS CONFIGURADA.</p>
                    )}
                </div>
            </div>

                {/* Collections management — name + order + cover in one place */}
                <div className="border border-zinc-800 p-5 bg-zinc-950 rounded-2xl overflow-hidden">
                    <h2 className="font-bebas text-3xl text-kuraRed mb-1">COLECCIONES</h2>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        Crea y ordena las colecciones. La portada aparece al compartir el link en redes sociales.
                        Tocá la imagen (o el cuadro gris) para cambiarla.
                    </p>

                    {/* Add new collection */}
                    <div className="flex gap-2 mb-5">
                        <input
                            type="text" placeholder="NOMBRE DE NUEVA COLECCIÓN..."
                            className="brutalist-input flex-1 mt-0 text-sm"
                            value={newCatInput}
                            onChange={e => setNewCatInput(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === 'Enter' && newCatInput.trim()) { handleAddCategory(newCatInput); setNewCatInput(''); } }}
                        />
                        <button
                            onClick={() => { if (newCatInput.trim()) { handleAddCategory(newCatInput); setNewCatInput(''); } }}
                            className="brutalist-btn px-5 py-2 text-sm whitespace-nowrap">+ AÑADIR</button>
                    </div>

                    {uniqueCategories.length === 0 ? (
                        <p className="text-zinc-600 text-sm font-mono italic py-6 text-center">No hay colecciones. Añade una arriba.</p>
                    ) : (
                        <div className="space-y-2">
                            {uniqueCategories.map((cat, idx) => {
                                const coverUrl = storeConfig.categoryCovers?.[cat];
                                return (
                                    <div key={cat} className="flex gap-3 border border-zinc-800 p-3 items-center bg-black">
                                        {/* Reorder */}
                                        <div className="flex flex-col shrink-0">
                                            <button onClick={() => handleMoveCategoryUp(idx)} disabled={idx === 0} className="text-zinc-600 hover:text-white disabled:opacity-20 leading-none px-1 py-0.5 text-xs">▲</button>
                                            <button onClick={() => handleMoveCategoryDown(idx)} disabled={idx === uniqueCategories.length - 1} className="text-zinc-600 hover:text-white disabled:opacity-20 leading-none px-1 py-0.5 text-xs">▼</button>
                                        </div>

                                        {/* Cover — click to upload */}
                                        <label className="cursor-pointer shrink-0 group relative">
                                            {coverUrl ? (
                                                <img src={coverUrl} className="w-16 h-11 object-cover border border-zinc-700 group-hover:opacity-70 transition-opacity" />
                                            ) : (
                                                <div className="w-16 h-11 bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center group-hover:border-kuraRed transition-colors">
                                                    <span className="text-zinc-600 text-[8px] font-mono text-center leading-tight group-hover:text-kuraRed">PORTADA</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" className="hidden"
                                                onChange={e => e.target.files[0] && handleCategoryCoversUpload(cat, e.target.files[0])} />
                                        </label>

                                        {/* Name */}
                                        <p className="font-bebas text-xl flex-1 leading-none">{cat}</p>

                                        {/* Remove cover */}
                                        {coverUrl && (
                                            <button onClick={() => handleCategoryCoversUpload(cat, null)}
                                                className="text-zinc-600 hover:text-white text-xs font-mono px-2 py-1 border border-zinc-800 hover:border-zinc-600 transition-colors shrink-0">
                                                SIN PORTADA
                                            </button>
                                        )}

                                        {/* Delete collection */}
                                        <button onClick={() => handleRemoveCategory(cat)}
                                            className="text-red-500 font-bold px-3 py-2 hover:bg-red-900 border border-transparent hover:border-red-500 transition-colors shrink-0">✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            {/* FAB — mobile only — opens the slide form sheet */}
            <button className="fab" onClick={() => setFormOpen(true)}>+</button>
        </div>
    );
};
