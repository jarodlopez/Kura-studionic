window.InventoryView = ({ products, formData, setFormData, editingId, setEditingId,
    handleProductSubmit, handleProductImage, isSaving, uniqueCategories,
    filteredInventory, inventoryFilter, setInventoryFilter, fetchProducts, db }) => {

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <form onSubmit={handleProductSubmit} className="w-full lg:w-1/3 space-y-4 bg-zinc-950 p-6 border border-zinc-800 h-max sticky top-0">
                <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                    <h2 className="font-bebas text-3xl text-kuraRed">{editingId ? 'EDITAR PRENDA' : 'NUEVA PRENDA'}</h2>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', sku: '', price: '', discountPrice: '', category: '', description: '', details: '', sizes: [], stock: '', images: [] }); }} className="text-xs text-zinc-500 underline">Cancelar Edición</button>}
                </div>

                <input required placeholder="TÍTULO (Ej: OVERSIZED TEE BLACK)" className="brutalist-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value.toUpperCase() })} />

                <div className="flex gap-2">
                    <input placeholder="SKU (Opcional)" className="brutalist-input" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} />
                    <select required className="brutalist-input text-xs" value={formData.category} onChange={e => {
                        if (e.target.value === 'NEW_CAT') {
                            const newCat = window.prompt("ESCRIBE EL NOMBRE DE LA NUEVA CATEGORÍA:");
                            if (newCat) setFormData({ ...formData, category: newCat.toUpperCase() });
                        } else {
                            setFormData({ ...formData, category: e.target.value });
                        }
                    }}>
                        <option value="" disabled>SELECCIONAR CATEGORÍA...</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="NEW_CAT" className="text-kuraRed font-bold">+ AÑADIR NUEVA CATEGORÍA</option>
                    </select>
                </div>

                <div className="flex gap-2 bg-black p-2 border border-zinc-800">
                    <div className="w-1/2">
                        <label className="text-[10px] text-zinc-500 font-bold block mb-1">PRECIO BASE (NIO)</label>
                        <input required type="number" className="brutalist-input mt-0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div className="w-1/2">
                        <label className="text-[10px] text-kuraRed font-bold block mb-1">PRECIO DESCUENTO (Opcional)</label>
                        <input type="number" placeholder="Ej: 500" className="brutalist-input mt-0" value={formData.discountPrice} onChange={e => setFormData({ ...formData, discountPrice: e.target.value })} />
                    </div>
                </div>

                <textarea required placeholder="DESCRIPCIÓN DEL PRODUCTO" className="brutalist-input h-20 resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                <textarea placeholder="DETALLES TÉCNICOS (UNO POR LÍNEA)" className="brutalist-input h-20 resize-none" value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />

                <div className="border-t border-zinc-800 pt-4">
                    <p className="text-xs text-zinc-500 mb-2 font-bold tracking-widest">TALLAS DISPONIBLES</p>
                    <div className="flex flex-wrap gap-2">
                        {['S', 'M', 'L', 'XL', 'XXL', 'ÚNICA'].map(s => (
                            <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, sizes: p.sizes.includes(s) ? p.sizes.filter(x => x !== s) : [...p.sizes, s] }))}
                                className={`px-4 py-2 font-bebas text-lg transition-colors border ${formData.sizes.includes(s) ? 'bg-kuraRed border-kuraRed text-black' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>{s}</button>
                        ))}
                    </div>
                </div>

                <div className="border border-zinc-700 bg-black p-4">
                    <p className="text-xs text-zinc-500 mb-2 font-bold">FOTOGRAFÍAS</p>
                    <input type="file" multiple accept="image/*" onChange={handleProductImage} className="text-xs w-full mb-3 text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                    <div className="flex flex-wrap gap-2">
                        {formData.images.map((img, i) => <img key={i} src={img} className="w-16 h-20 object-cover border border-zinc-600" />)}
                        {formData.images.length > 0 && <button type="button" onClick={() => setFormData({ ...formData, images: [] })} className="text-kuraRed font-bold text-xs underline mt-2 w-full text-left">Eliminar fotos y subir otras</button>}
                    </div>
                </div>

                <button type="submit" disabled={isSaving} className="brutalist-btn w-full mt-4 flex items-center justify-center gap-2">
                    {isSaving && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>}
                    {editingId ? 'ACTUALIZAR PRENDA' : 'AÑADIR AL CATÁLOGO'}
                </button>
            </form>

            <div className="w-full lg:w-2/3 flex flex-col h-max">
                <div className="bg-black border border-zinc-800 p-4 mb-4 flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-zinc-500 font-bold mr-2">FILTRAR POR:</span>
                    <button onClick={() => setInventoryFilter('TODAS')} className={`brutalist-btn-outline px-3 py-1 ${inventoryFilter === 'TODAS' ? 'active' : ''}`}>TODAS</button>
                    {uniqueCategories.map(cat => (
                        <button key={cat} onClick={() => setInventoryFilter(cat)} className={`brutalist-btn-outline px-3 py-1 ${inventoryFilter === cat ? 'active' : ''}`}>{cat}</button>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredInventory.map(p => (
                        <div key={p.id} className="border border-zinc-800 flex flex-col bg-zinc-950 relative group">
                            <div className="relative aspect-[4/5] bg-black border-b border-zinc-800 overflow-hidden">
                                <img src={p.images?.[0]} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                {p.discountPrice && p.discountPrice > 0 && (
                                    <span className="absolute top-2 right-2 bg-kuraRed text-black text-[10px] font-bold px-2 py-1">OFERTA</span>
                                )}
                                <span className="absolute top-2 left-2 bg-white text-black text-[10px] font-bold px-2 py-1">{p.category}</span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                                <p className="font-bebas text-xl truncate leading-none mb-1">{p.title}</p>
                                {p.sku && <p className="text-[10px] text-zinc-500 mb-1">SKU: {p.sku}</p>}
                                <div className="mt-auto">
                                    {p.discountPrice && p.discountPrice > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-kuraRed font-mono text-xs font-bold">NIO {p.discountPrice}</span>
                                            <span className="text-zinc-600 font-mono text-[10px] line-through">NIO {p.price}</span>
                                        </div>
                                    ) : (
                                        <p className="text-white font-mono text-xs font-bold">NIO {p.price}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex border-t border-zinc-800">
                                <button onClick={() => {
                                    setEditingId(p.id);
                                    setFormData({ title: p.title || '', sku: p.sku || '', price: p.price || '', discountPrice: p.discountPrice || '', category: p.category || '', description: p.description || '', details: (p.details || []).join('\n'), sizes: p.sizes || [], stock: p.stock || '', images: p.images || [] });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} className="flex-1 text-xs text-zinc-400 py-2 hover:bg-zinc-800 transition-colors border-r border-zinc-800">EDITAR</button>
                                <button onClick={async () => {
                                    if (window.confirm('¿Seguro que quieres borrar esta prenda?')) {
                                        await db.collection('products').doc(p.id).delete(); fetchProducts();
                                    }
                                }} className="flex-1 text-xs text-red-500 font-bold py-2 hover:bg-red-900 transition-colors">ELIMINAR</button>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredInventory.length === 0 && (
                    <p className="text-center text-zinc-600 py-10 font-bebas text-2xl tracking-widest">NO HAY PRENDAS EN ESTA CATEGORÍA</p>
                )}
            </div>
        </div>
    );
};
