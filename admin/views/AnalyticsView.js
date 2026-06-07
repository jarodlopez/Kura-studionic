window.AnalyticsView = ({ analyticsEvents, analyticsRange, setAnalyticsRange,
    analyticsLoading, orders, fetchAnalytics, fetchOrders }) => {

    const now = new Date();
    const days = parseInt(analyticsRange);
    const rangeStart = new Date(now.getTime() - days * 86400000);

    const evts = analyticsEvents.filter(e => new Date(e.timestamp) >= rangeStart);
    const filteredOrders = orders.filter(o => new Date(o.date) >= rangeStart);

    const totalRevenue = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const avgTicket = filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length) : 0;
    const pageViews = evts.filter(e => e.type === 'page_view').length;
    const productViews = evts.filter(e => e.type === 'product_view').length;
    const cartAdds = evts.filter(e => e.type === 'add_to_cart').length;
    const checkoutsStarted = evts.filter(e => e.type === 'checkout_started').length;
    const ordersCompleted = filteredOrders.length;

    const funnelSteps = [
        { label: 'VISITAS', value: pageViews },
        { label: 'VIO PRODUCTO', value: productViews },
        { label: 'AL CARRITO', value: cartAdds },
        { label: 'INICIÓ PAGO', value: checkoutsStarted },
        { label: 'COMPLETÓ ORDEN', value: ordersCompleted },
    ];
    const funnelMax = funnelSteps[0].value || 1;

    const salesByDay = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit' });
        salesByDay[key] = { label, orders: 0, revenue: 0 };
    }
    filteredOrders.forEach(o => {
        const day = (o.date || '').split('T')[0];
        if (salesByDay[day]) { salesByDay[day].orders++; salesByDay[day].revenue += Number(o.total) || 0; }
    });
    const chartDays = Object.values(salesByDay);
    const maxRevenue = Math.max(...chartDays.map(d => d.revenue), 1);

    const productSales = {};
    filteredOrders.forEach(o => {
        (o.items || []).forEach(item => {
            const k = item.title || 'Desconocido';
            if (!productSales[k]) productSales[k] = { title: k, count: 0, revenue: 0 };
            productSales[k].count++;
            productSales[k].revenue += Number(item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price) || 0;
        });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.count - a.count).slice(0, 5);
    const maxCount = topProducts[0]?.count || 1;

    const catViews = {};
    evts.filter(e => e.type === 'product_view' && e.category).forEach(e => {
        catViews[e.category] = (catViews[e.category] || 0) + 1;
    });
    const topCats = Object.entries(catViews).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const managua = filteredOrders.filter(o => o.shippingZone === 'Managua').length;
    const deptos = filteredOrders.filter(o => o.shippingZone !== 'Managua').length;
    const zoneTotal = managua + deptos || 1;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h2 className="font-bebas text-4xl text-white">PANEL DE ANALYTICS</h2>
                    <p className="text-zinc-500 text-xs mt-1">Tráfico, ventas y conversiones en tiempo real</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-bold">PERÍODO:</span>
                    {[['1', 'HOY'], ['7', '7 DÍAS'], ['30', '30 DÍAS']].map(([v, l]) => (
                        <button key={v} onClick={() => setAnalyticsRange(v)} className={`font-bebas text-lg px-4 py-1 border transition-colors ${analyticsRange === v ? 'bg-kuraRed text-black border-kuraRed' : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-white hover:text-white'}`}>{l}</button>
                    ))}
                    <button onClick={() => { fetchAnalytics(); fetchOrders(); }} className="ml-2 text-zinc-500 hover:text-white text-xl" title="Actualizar">↻</button>
                </div>
            </div>

            {analyticsLoading ? (
                <div className="text-center py-20 font-bebas text-3xl text-kuraRed animate-pulse">CARGANDO DATOS...</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'INGRESOS TOTALES', value: `NIO ${totalRevenue.toLocaleString()}`, sub: `${ordersCompleted} órdenes`, color: 'text-kuraRed' },
                            { label: 'TICKET PROMEDIO', value: `NIO ${avgTicket.toLocaleString()}`, sub: 'por orden', color: 'text-white' },
                            { label: 'VISITAS (SESIONES)', value: pageViews.toLocaleString(), sub: `en ${days} día${days > 1 ? 's' : ''}`, color: 'text-white' },
                            { label: 'TASA DE COMPRA', value: pageViews > 0 ? `${((ordersCompleted / pageViews) * 100).toFixed(1)}%` : '—', sub: 'visita → orden', color: 'text-white' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-zinc-950 border border-zinc-800 p-5">
                                <p className="text-[10px] text-zinc-500 font-bold tracking-widest mb-3 uppercase">{kpi.label}</p>
                                <p className={`font-bebas text-4xl ${kpi.color} leading-none mb-1`}>{kpi.value}</p>
                                <p className="text-zinc-600 text-xs">{kpi.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-6">
                        <h3 className="font-bebas text-2xl text-white mb-6 flex items-center gap-3"><span className="w-6 h-[2px] bg-kuraRed"></span> EMBUDO DE CONVERSIÓN</h3>
                        <div className="space-y-3">
                            {funnelSteps.map((step, i) => {
                                const pct = Math.round((step.value / funnelMax) * 100);
                                const dropPct = i > 0 && funnelSteps[i - 1].value > 0
                                    ? ((1 - step.value / funnelSteps[i - 1].value) * 100).toFixed(0)
                                    : null;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-zinc-600 font-mono text-xs w-4">{i + 1}</span>
                                                <span className="font-bebas text-lg text-white">{step.label}</span>
                                                {dropPct !== null && Number(dropPct) > 0 && (
                                                    <span className="text-[10px] text-red-400 font-mono bg-red-900/20 px-2 py-0.5 border border-red-900">↓ {dropPct}% DROP</span>
                                                )}
                                            </div>
                                            <span className="font-bebas text-xl text-kuraRed">{step.value.toLocaleString()}</span>
                                        </div>
                                        <div className="h-6 bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                                            <div className="h-full bg-kuraRed transition-all duration-700" style={{ width: `${pct}%`, opacity: 1 - i * 0.1 }}></div>
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono">{pct}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-6">
                        <h3 className="font-bebas text-2xl text-white mb-6 flex items-center gap-3"><span className="w-6 h-[2px] bg-kuraRed"></span> VENTAS DIARIAS (NIO)</h3>
                        {chartDays.every(d => d.revenue === 0) ? (
                            <p className="text-zinc-600 text-center py-10 font-bebas text-xl">SIN DATOS DE VENTAS EN ESTE PERÍODO</p>
                        ) : (
                            <div className="flex items-end gap-1 h-40 overflow-x-auto">
                                {chartDays.map((d, i) => {
                                    const barH = Math.max(Math.round((d.revenue / maxRevenue) * 100), d.revenue > 0 ? 4 : 0);
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[28px] group cursor-default" title={`${d.label}: NIO ${d.revenue} (${d.orders} órdenes)`}>
                                            {d.revenue > 0 && <span className="text-[9px] text-zinc-600 group-hover:text-kuraRed font-mono hidden md:block">{d.orders}</span>}
                                            <div className="w-full bg-kuraRed group-hover:bg-white transition-colors" style={{ height: `${barH}%` }}></div>
                                            <span className="text-[9px] text-zinc-600 group-hover:text-white font-mono">{d.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 p-6">
                            <h3 className="font-bebas text-2xl text-white mb-5 flex items-center gap-3"><span className="w-6 h-[2px] bg-kuraRed"></span> TOP PRODUCTOS VENDIDOS</h3>
                            {topProducts.length === 0 ? (
                                <p className="text-zinc-600 font-bebas text-xl text-center py-10">SIN VENTAS EN ESTE PERÍODO</p>
                            ) : (
                                <div className="space-y-3">
                                    {topProducts.map((p, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-kuraRed font-bebas text-xl w-5 text-center">{i + 1}</span>
                                                    <span className="text-white text-sm font-mono truncate max-w-[200px]">{p.title}</span>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <span className="text-zinc-500 text-xs font-mono">NIO {p.revenue.toLocaleString()}</span>
                                                    <span className="text-kuraRed font-bebas text-lg">{p.count} uds.</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-zinc-900">
                                                <div className="h-full bg-kuraRed" style={{ width: `${Math.round((p.count / maxCount) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-zinc-950 border border-zinc-800 p-6">
                                <h3 className="font-bebas text-2xl text-white mb-4 flex items-center gap-3"><span className="w-6 h-[2px] bg-kuraRed"></span> ZONAS DE ENVÍO</h3>
                                {ordersCompleted === 0 ? (
                                    <p className="text-zinc-600 font-bebas text-lg text-center py-4">SIN DATOS</p>
                                ) : (
                                    <div className="space-y-3">
                                        {[['MANAGUA', managua], ['DEPARTAMENTOS', deptos]].map(([label, count]) => (
                                            <div key={label}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-mono text-zinc-400">{label}</span>
                                                    <span className="font-bebas text-white text-lg leading-none">{count} <span className="text-zinc-500 text-xs">({Math.round((count / zoneTotal) * 100)}%)</span></span>
                                                </div>
                                                <div className="h-3 bg-zinc-900">
                                                    <div className="h-full bg-kuraRed" style={{ width: `${Math.round((count / zoneTotal) * 100)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-zinc-950 border border-zinc-800 p-6">
                                <h3 className="font-bebas text-2xl text-white mb-4 flex items-center gap-3"><span className="w-6 h-[2px] bg-kuraRed"></span> CATEGORÍAS VISTAS</h3>
                                {topCats.length === 0 ? (
                                    <p className="text-zinc-600 font-bebas text-lg text-center py-4">SIN DATOS</p>
                                ) : (
                                    <div className="space-y-2">
                                        {topCats.map(([cat, cnt], i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="font-mono text-zinc-400 truncate">{cat}</span>
                                                <span className="font-bebas text-kuraRed text-lg ml-2 shrink-0">{cnt}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
