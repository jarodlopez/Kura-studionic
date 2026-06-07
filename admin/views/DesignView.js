window.DesignView = ({ storeConfig, slideForm, setSlideForm, uniqueCategories,
    handleSizeGuideUpload, handleSlideAdd, removeSlide, isSaving }) => {

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2 border border-zinc-800 p-6 bg-zinc-950">
                <h2 className="font-bebas text-3xl text-kuraRed mb-4">AÑADIR PORTADA (HERO SLIDER)</h2>
                <div className="space-y-4 mb-8">
                    <input placeholder="SUBTÍTULO (Ej: NUEVA COLECCIÓN)" className="brutalist-input" value={slideForm.subtitle} onChange={e => setSlideForm({ ...slideForm, subtitle: e.target.value })} />
                    <input placeholder="TÍTULO PRINCIPAL" className="brutalist-input" value={slideForm.title} onChange={e => setSlideForm({ ...slideForm, title: e.target.value })} />
                    <div className="flex gap-2">
                        <input placeholder="TEXTO DEL BOTÓN (Ej: VER T-SHIRTS)" className="brutalist-input w-1/2" value={slideForm.cta} onChange={e => setSlideForm({ ...slideForm, cta: e.target.value })} />
                        <select className="brutalist-input w-1/2 text-xs" value={slideForm.categoryTarget} onChange={e => setSlideForm({ ...slideForm, categoryTarget: e.target.value })}>
                            <option value="">ENLAZAR A CATEGORÍA (Opcional)</option>
                            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="border border-zinc-800 p-4 bg-black">
                        <p className="text-xs text-zinc-500 mb-2 font-bold">SELECCIONA LA IMAGEN DE PORTADA</p>
                        <input type="file" accept="image/*" onChange={handleSlideAdd} className="text-xs w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                    </div>
                </div>

                <h3 className="font-bebas text-2xl mb-4 border-t border-zinc-800 pt-6">PORTADAS ACTIVAS</h3>
                <div className="space-y-3">
                    {storeConfig.heroSlides?.map(slide => (
                        <div key={slide.id} className="flex gap-4 border border-zinc-800 p-3 items-center bg-black">
                            <img src={slide.image} className="w-24 h-16 object-cover border border-zinc-700" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bebas text-xl leading-none truncate">{slide.title}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">{slide.subtitle} | Botón: {slide.cta}</p>
                                {slide.categoryTarget && <p className="text-[10px] text-kuraRed mt-1">⮑ Enlaza a: {slide.categoryTarget}</p>}
                            </div>
                            <button onClick={() => removeSlide(slide.id)} className="text-red-500 font-bold px-4 py-2 hover:bg-red-900 border border-transparent hover:border-red-500 transition-colors">✕</button>
                        </div>
                    ))}
                    {(!storeConfig.heroSlides || storeConfig.heroSlides.length === 0) && (
                        <p className="text-zinc-600 text-sm font-mono italic">No hay portadas configuradas. Agrega una arriba.</p>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-1/2 border border-zinc-800 p-6 bg-zinc-950 h-max">
                <h2 className="font-bebas text-3xl text-kuraRed mb-4">GUÍA DE TALLAS GLOBAL</h2>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Sube una imagen con la tabla de medidas. Aparecerá cuando el cliente toque "Guía de Medidas" al ver una prenda.</p>
                <div className="border border-zinc-800 p-4 bg-black mb-6">
                    <p className="text-xs text-zinc-500 mb-2 font-bold">SUBIR O REEMPLAZAR IMAGEN</p>
                    <input type="file" accept="image/*" onChange={handleSizeGuideUpload} className="text-xs w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                </div>
                {storeConfig.sizeGuide ? (
                    <div className="border border-zinc-800 p-4 bg-black">
                        <p className="text-xs text-kuraRed mb-3 font-bold border-b border-zinc-800 pb-2">GUÍA ACTUAL:</p>
                        <img src={storeConfig.sizeGuide} className="w-full h-auto border border-zinc-900" />
                    </div>
                ) : (
                    <p className="text-red-500 text-xs bg-red-950/30 p-3 border border-red-900">NO HAY GUÍA DE TALLAS CONFIGURADA.</p>
                )}
            </div>
        </div>
    );
};
