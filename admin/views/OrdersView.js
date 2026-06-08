window.OrdersView = ({ orders, filteredOrders, selectedOrder, setSelectedOrder,
    orderSearchQuery, setOrderSearchQuery, deleteOrder, formatDate, getPrice }) => {

    return (
        <div className="view-animate bg-zinc-950 border border-zinc-900 min-h-[50vh] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900">
                <input
                    type="text"
                    placeholder="Buscar por orden, cliente o teléfono..."
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    className="brutalist-input mt-0 text-xs py-2 flex-1"
                />
                <span className="text-[11px] text-zinc-600 font-mono shrink-0">{filteredOrders.length} ord.</span>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-zinc-700 font-bebas text-2xl tracking-widest">
                    {orderSearchQuery ? '— SIN RESULTADOS —' : '— SIN ÓRDENES AÚN —'}
                </div>
            ) : (
                <>
                    {/* Mobile cards */}
                    <div className="order-cards p-3">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="bg-zinc-900 border border-zinc-800 p-4 active:bg-zinc-800 transition-colors rounded-xl" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bebas text-lg text-white leading-none">{order.orderNumber}</span>
                                    <span className="text-kuraRed font-bold text-sm font-mono">NIO {order.total}</span>
                                </div>
                                <p className="text-zinc-300 text-xs font-mono mb-1">{order.customer?.name}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-zinc-600 text-[10px] font-mono">{formatDate(order.date)}</span>
                                    <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 font-mono">{order.shippingZone}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="order-table-wrap">
                        <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                            <thead className="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950 border-b border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3 font-bold">No. Orden</th>
                                    <th className="px-4 py-3 font-bold">Fecha</th>
                                    <th className="px-4 py-3 font-bold">Cliente</th>
                                    <th className="px-4 py-3 font-bold">Zona</th>
                                    <th className="px-4 py-3 font-bold">Total</th>
                                    <th className="px-4 py-3 font-bold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order, i) => (
                                    <tr key={order.id} className={`border-b border-zinc-900 hover:bg-zinc-900/60 transition-colors ${i % 2 === 0 ? 'bg-black' : 'bg-zinc-950/40'}`}>
                                        <td className="px-4 py-3.5 font-bold text-white">{order.orderNumber}</td>
                                        <td className="px-4 py-3.5 text-zinc-500">{formatDate(order.date)}</td>
                                        <td className="px-4 py-3.5 text-zinc-300">{order.customer?.name}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold ${order.shippingZone === 'Managua' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-700 text-white'}`}>{order.shippingZone}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-kuraRed font-bold">NIO {order.total}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex gap-1.5 justify-center">
                                                <button onClick={() => setSelectedOrder(order)} className="px-3 py-1.5 text-[10px] font-bold bg-zinc-800 hover:bg-kuraRed hover:text-black text-zinc-300 transition-colors">VER</button>
                                                <button onClick={() => deleteOrder(order.id)} className="px-2.5 py-1.5 text-[10px] border border-zinc-800 text-zinc-600 hover:bg-red-950 hover:text-red-400 hover:border-red-900 transition-colors" title="Eliminar">✕</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ORDER DETAIL MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[350] bg-black/90 flex items-end justify-center backdrop-blur-sm" onClick={() => setSelectedOrder(null)} style={{ alignItems: 'flex-end' }}>
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[92vh] overflow-y-auto animate-slideUp flex flex-col shadow-2xl" onClick={e => e.stopPropagation()} style={{ borderRadius: '12px 12px 0 0' }}>
                        {/* Modal header — sticky */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
                            <div>
                                <h2 className="font-bebas text-3xl text-kuraRed leading-none">ORDEN {selectedOrder.orderNumber}</h2>
                                <p className="text-zinc-500 text-[10px] mt-0.5">{formatDate(selectedOrder.date)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => deleteOrder(selectedOrder.id)} className="text-xs border border-red-900 text-red-500 px-3 py-1.5 hover:bg-red-900 hover:text-white transition-colors">ELIMINAR</button>
                                <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-white font-bold text-xl w-8 h-8 flex items-center justify-center">✕</button>
                            </div>
                        </div>

                        <div className="flex flex-col" style={{ minHeight: 0 }}>
                            {/* On desktop, show side-by-side; on mobile, stacked (flex-col) */}
                            <div className="flex flex-col" style={{ /* desktop layout handled below */ }}>
                                <div className="p-5 border-b border-zinc-800">
                                    <div className="mb-5 bg-black p-4 border border-zinc-800">
                                        <p className="font-bold text-white mb-2 text-sm border-b border-zinc-800 pb-2">DATOS DEL CLIENTE</p>
                                        <p className="text-sm py-0.5"><span className="text-zinc-500">Nombre: </span>{selectedOrder.customer?.name}</p>
                                        <p className="text-sm py-0.5"><span className="text-zinc-500">Teléfono: </span>{selectedOrder.customer?.phone}</p>
                                        <p className="text-sm py-0.5"><span className="text-zinc-500">Dirección: </span>{selectedOrder.customer?.address}</p>
                                        <p className="text-sm py-0.5"><span className="text-zinc-500">Zona: </span><span className="text-kuraRed font-bold">{selectedOrder.shippingZone}</span></p>
                                    </div>

                                    <div>
                                        <p className="font-bold text-white mb-3 text-sm border-b border-zinc-800 pb-2">PRODUCTOS COMPRADOS</p>
                                        <div className="space-y-3">
                                            {selectedOrder.items?.map((item, idx) => (
                                                <div key={idx} className="flex gap-3 bg-black p-2 border border-zinc-900">
                                                    <img src={item.images?.[0]} className="w-12 h-16 object-cover border border-zinc-800 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bebas text-lg leading-none truncate">{item.title}</p>
                                                        <p className="text-[10px] text-zinc-400 font-bold mt-1">TALLA: {item.selectedSize}{item.sku && ` | SKU: ${item.sku}`}</p>
                                                        <p className="text-kuraRed font-bold text-xs mt-1">NIO {getPrice(item)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-zinc-800 space-y-1 text-sm">
                                        <div className="flex justify-between text-zinc-400"><span>Subtotal:</span><span>NIO {selectedOrder.subtotal}</span></div>
                                        <div className="flex justify-between text-zinc-400"><span>Envío:</span><span>NIO {selectedOrder.shippingCost}</span></div>
                                        <div className="flex justify-between text-white font-bold text-lg pt-2 mt-2 border-t border-zinc-800">
                                            <span>TOTAL PAGADO:</span><span className="text-kuraRed">NIO {selectedOrder.total}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-zinc-900 flex flex-col">
                                    <p className="font-bold text-white mb-3 text-sm border-b border-zinc-800 pb-2">COMPROBANTE DE PAGO</p>
                                    {selectedOrder.receiptUrl ? (
                                        <div className="border border-zinc-700 bg-black flex flex-col">
                                            <a href={selectedOrder.receiptUrl} target="_blank" className="flex items-center justify-center p-2 hover:opacity-80 transition-opacity">
                                                <img src={selectedOrder.receiptUrl} className="max-h-64 w-full object-contain" />
                                            </a>
                                            <a href={selectedOrder.receiptUrl} target="_blank" className="bg-zinc-800 text-center py-2.5 text-xs font-bold hover:bg-kuraRed hover:text-black transition-colors block border-t border-zinc-700">
                                                ABRIR IMAGEN COMPLETA ↗
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center border border-dashed border-zinc-700 text-zinc-500 text-sm p-8">
                                            Sin comprobante adjunto
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
