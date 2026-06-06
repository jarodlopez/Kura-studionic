window.CartModal = ({
    isCartOpen, setIsCartOpen,
    cart, setCart,
    pendingOrder, setPendingOrder,
    shippingZone, setShippingZone,
    formData, setFormData,
    discountInput, setDiscountInput,
    appliedDiscount, applyDiscount, removeDiscount,
    discountError,
    discountAmount, cartSubtotal, cartTotal, currentShippingCost,
    handleProceedToPayment,
    receiptFile, setReceiptFile,
    isUploading,
    acceptTerms, setAcceptTerms,
    handleFinalizeOrder
}) => {
    if (!isCartOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-end">
            <div className="bg-[#050505] w-full md:w-[450px] h-full border-l border-zinc-800 shadow-2xl flex flex-col animate-slideUp">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black shrink-0">
                    <h2 className="font-bebas text-3xl tracking-widest flex items-center gap-3">
                        <span className="w-3 h-3 bg-kuraRed inline-block"></span>
                        {pendingOrder ? 'PAGO Y CONFIRMACIÓN' : 'TU ARSENAL'}
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-kuraRed text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {!pendingOrder ? (
                        cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4">
                                <span className="text-4xl">🛒</span>
                                <p className="font-bebas text-2xl tracking-widest">CARRITO VACÍO</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-8 pb-4">
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.cartId} className="flex gap-4 border border-zinc-800 p-3 bg-black relative shadow-sm">
                                            <img src={optimizeImg(item.images?.[0], 160)} onError={(e) => { if (item.images?.[0] && e.target.src !== item.images[0]) e.target.src = item.images[0]; }} className="w-20 h-24 object-cover border border-zinc-900 shrink-0" decoding="async" draggable={false} alt={item.title} />
                                            <div className="flex-1 pt-1 overflow-hidden">
                                                <p className="font-bebas text-lg pr-6 leading-none text-zinc-100 line-clamp-2">{item.title}</p>
                                                <p className="text-xs text-zinc-500 mt-2 font-bold tracking-wider">TALLA: {item.selectedSize}</p>
                                                {item.discountPrice && item.discountPrice > 0 ? (
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-kuraRed text-sm font-bold">NIO {item.discountPrice}</span>
                                                        <span className="text-zinc-600 text-[10px] line-through">NIO {item.price}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-kuraRed text-sm mt-1 font-bold">NIO {item.price}</p>
                                                )}
                                            </div>
                                            <button onClick={() => setCart(cart.filter(i => i.cartId !== item.cartId))} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 p-2 leading-none">✕</button>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-zinc-800 pt-8">
                                    <h3 className="font-bebas text-2xl mb-4 text-white flex items-center gap-2">
                                        <span className="w-2 h-2 bg-kuraRed inline-block"></span> RESUMEN Y ENVÍO
                                    </h3>

                                    <div className="bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm mb-6">
                                        <div className="flex justify-between mb-2 text-zinc-400"><span>SUBTOTAL</span> <span>NIO {cartSubtotal}</span></div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between mb-2 text-green-400 font-bold">
                                                <span>DESCUENTO ({appliedDiscount.code})</span>
                                                <span>- NIO {discountAmount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between mb-2 text-zinc-400"><span>ENVÍO</span> <span>NIO {currentShippingCost}</span></div>
                                        <div className="flex justify-between pt-3 border-t border-zinc-800 font-bebas text-2xl text-white mt-3 items-end">
                                            <span className="text-lg">TOTAL ESTIMADO</span>
                                            <span className="text-kuraRed text-3xl leading-none">NIO {cartTotal}</span>
                                        </div>
                                    </div>

                                    <div className="border border-zinc-800 p-4 bg-zinc-950 mb-6">
                                        <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">CÓDIGO DE DESCUENTO</p>
                                        {appliedDiscount ? (
                                            <div className="flex items-center justify-between bg-kuraRed/10 border border-kuraRed p-3">
                                                <div>
                                                    <span className="text-kuraRed font-bebas text-xl">{appliedDiscount.code}</span>
                                                    <span className="text-green-400 text-xs font-mono ml-3">
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
                                                    onChange={e => { setDiscountInput(e.target.value.toUpperCase()); }}
                                                    className="flex-1 bg-black border border-zinc-800 p-3 text-white text-sm outline-none focus:border-kuraRed transition-colors font-mono tracking-widest"
                                                />
                                                <button type="button" onClick={applyDiscount} className="px-4 bg-zinc-800 hover:bg-kuraRed hover:text-black text-white text-xs font-bold transition-colors border border-zinc-700 whitespace-nowrap">APLICAR</button>
                                            </div>
                                        )}
                                        {discountError && <p className="text-red-500 text-xs mt-2 font-mono">{discountError}</p>}
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">SELECCIONA ZONA DE ENVÍO</p>
                                        <div className="flex flex-row gap-2">
                                            <button type="button" onClick={() => setShippingZone('managua')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold transition-all ${shippingZone === 'managua' ? 'bg-kuraRed text-black border-2 border-kuraRed' : 'bg-transparent text-zinc-500 border-2 border-zinc-800'}`}>MANAGUA (NIO 100)</button>
                                            <button type="button" onClick={() => setShippingZone('departamentos')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold transition-all ${shippingZone === 'departamentos' ? 'bg-kuraRed text-black border-2 border-kuraRed' : 'bg-transparent text-zinc-500 border-2 border-zinc-800'}`}>DEPARTAMENTOS (NIO 165)</button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleProceedToPayment} className="space-y-4">
                                        <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest border-t border-zinc-800 pt-6">DATOS DE ENTREGA</p>
                                        <input required type="text" placeholder="NOMBRE COMPLETO" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed transition-colors" />
                                        <input required type="tel" placeholder="TELÉFONO (Ej: 8888 8888)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed transition-colors" />
                                        <textarea required placeholder="DIRECCIÓN EXACTA" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})} className="w-full bg-black border border-zinc-800 p-3 text-white outline-none focus:border-kuraRed h-24 resize-none transition-colors"></textarea>
                                        <button type="submit" className="brutalist-btn w-full py-4 text-xl mt-4">IR A PAGAR</button>
                                    </form>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col pb-10 animate-slideUp">
                            <div className="bg-[#111] border border-kuraRed p-4 mb-6">
                                <h4 className="text-kuraRed font-bebas text-xl mb-1 flex items-center gap-2">
                                    <span className="text-lg">⚠️</span> AVISO DE ENTREGA
                                </h4>
                                <p className="text-zinc-400 text-xs font-mono">
                                    Recuerda que los envíos se realizan de 24 a 72 horas hábiles posteriores a la confirmación de tu pago. Te contactaremos vía WhatsApp para coordinar la entrega de tu paquete.
                                </p>
                            </div>

                            <div className="bg-zinc-950 border border-zinc-800 p-6 mb-6 relative shadow-lg">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-kuraRed opacity-10 rotate-45 pointer-events-none"></div>
                                <p className="text-zinc-500 text-[10px] uppercase mb-1">ORDEN RESERVADA</p>
                                <h3 className="text-white font-bebas text-3xl mb-4 tracking-wider">#{pendingOrder.orderNumber}</h3>

                                <div className="space-y-2 text-xs font-mono mb-6 pb-4 border-b border-zinc-800 text-zinc-400">
                                    <div className="flex justify-between"><span>SUBTOTAL:</span><span>NIO {pendingOrder.subtotal}</span></div>
                                    {pendingOrder.discountAmount > 0 && (
                                        <div className="flex justify-between text-green-400 font-bold"><span>DESCUENTO ({pendingOrder.discountCode}):</span><span>- NIO {pendingOrder.discountAmount}</span></div>
                                    )}
                                    <div className="flex justify-between"><span>ENVÍO ({pendingOrder.shippingZone}):</span><span>NIO {pendingOrder.shippingCost}</span></div>
                                    <div className="flex justify-between text-kuraRed font-bold text-lg mt-2 pt-2 border-t border-zinc-800/50">
                                        <span>TOTAL A PAGAR:</span><span>NIO {pendingOrder.total}</span>
                                    </div>
                                </div>

                                <div className="bg-black border border-zinc-800 p-4 text-xs text-zinc-300 font-mono">
                                    <p className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 inline-block"></span> DATOS DE TRANSFERENCIA
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

                            <div className="mb-6">
                                <p className="text-xs text-white mb-3 font-bold border-l-2 border-kuraRed pl-2">ADJUNTA TU COMPROBANTE:</p>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed hover:border-kuraRed hover:bg-zinc-900 transition-colors cursor-pointer relative">
                                    {receiptFile ? (
                                        <div className="text-center p-2">
                                            <span className="text-3xl mb-2 block">📄</span>
                                            <span className="text-kuraRed font-bold text-xs block truncate max-w-[200px]">{receiptFile.name}</span>
                                            <span className="text-zinc-500 text-[10px] mt-1 block">(Clic para cambiar)</span>
                                        </div>
                                    ) : (
                                        <div className="text-center text-zinc-500">
                                            <span className="text-2xl mb-2 block">↑</span>
                                            <span className="text-xs">Toca para subir la captura</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files[0])} className="hidden" />
                                </label>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer text-xs text-zinc-400 mb-8 p-3 border border-zinc-800 bg-black">
                                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-kuraRed w-4 h-4 shrink-0" />
                                <span className="leading-tight">Acepto la <a href="#" className="text-white underline">política de envios</a> de Kura Studio.</span>
                            </label>

                            <button
                                onClick={handleFinalizeOrder}
                                disabled={!receiptFile || !acceptTerms || isUploading}
                                className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-2"
                            >
                                {isUploading ? (
                                    <span className="animate-pulse">ENVIANDO ORDEN...</span>
                                ) : (
                                    <>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                        </svg>
                                        CONFIRMAR ORDEN
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => { setPendingOrder(null); setReceiptFile(null); setAcceptTerms(false); }}
                                disabled={isUploading}
                                className="w-full mt-6 text-xs font-bold tracking-widest text-zinc-600 hover:text-white transition-colors py-2"
                            >
                                ← VOLVER AL CARRITO
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
