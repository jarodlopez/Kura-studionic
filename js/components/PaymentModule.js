// Módulo de pago en la web — se muestra en el checkout después de crear la orden.
// El cliente transfiere, elige banco, copia los datos, ingresa la referencia
// (opcional) y adjunta el comprobante (obligatorio). También puede optar por
// continuar por WhatsApp para que un agente le ayude a finalizar y validar.
//
// Globals: React, uploadToImgBB, optimizeImg (de js/utils.js)
// Props: order, bankAccounts, waNumber, onPaid(), onCancel()

window.PaymentModule = ({ order, bankAccounts = [], waNumber = '50587091008', onPaid, onCancel }) => {
    const { useState } = React;

    const banks = bankAccounts.filter(b => b && b.accountNumber);
    const [selectedId, setSelectedId] = useState(banks[0]?.id ?? 0);
    const [copiedKey, setCopiedKey] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [reference, setReference] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    // Si el registro automático falla, guardamos el comprobante ya subido para
    // que el cliente lo envíe por WhatsApp con un toque (no se pierde la venta).
    const [fallbackReceipt, setFallbackReceipt] = useState(null);

    const selectedBank = banks.find((b, i) => (b.id ?? i) === selectedId) || banks[0] || null;

    const copyValue = (key, value) => {
        const done = () => { setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000); };
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(String(value)).then(done).catch(() => fallbackCopy(String(value), done));
        } else {
            fallbackCopy(String(value), done);
        }
    };
    const fallbackCopy = (value, done) => {
        const el = document.createElement('textarea');
        el.value = value;
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(el);
        done();
    };

    const handleSubmit = async () => {
        if (!receiptFile || !acceptTerms || isUploading) return;
        setIsUploading(true);
        setFallbackReceipt(null);
        const ref = reference.trim() || null;

        // Paso 1: subir la imagen del comprobante.
        let receiptUrl;
        try {
            receiptUrl = await uploadToImgBB(receiptFile);
        } catch (e) {
            console.error('Error subiendo el comprobante a ImgBB:', e);
            setIsUploading(false);
            alert('No pudimos subir la imagen del comprobante. Asegúrate de que sea una imagen (JPG o PNG) y no muy pesada, luego intenta de nuevo.');
            return;
        }

        // Paso 2: registrar el pago. Intenta el endpoint seguro y, si falla,
        // escribe directo a Firestore desde el cliente.
        let ok = false;
        try {
            const res = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'pay', orderNumber: order.orderNumber, token: order.paymentToken, receiptUrl, reference: ref }),
            });
            ok = res.ok;
            if (!ok) console.error('api/payment respondió', res.status, await res.text().catch(() => ''));
        } catch (e) { console.error('api/payment no disponible:', e); }

        if (!ok && typeof db !== 'undefined' && db) {
            try {
                await db.collection('orders').doc(order.orderNumber).update({
                    status: 'paid_pending_verification',
                    receiptUrl,
                    paymentReference: ref,
                    seenByAdmin: false,
                    paidAt: new Date().toISOString(),
                });
                ok = true;
            } catch (e) { console.error('Escritura directa a Firestore falló:', e); }
        }

        setIsUploading(false);
        if (ok) {
            onPaid && onPaid();
        } else {
            // No perder la venta: el comprobante ya está subido; que lo envíe por WhatsApp.
            setFallbackReceipt(receiptUrl);
        }
    };

    // Resumen para el mensaje de WhatsApp (opcionalmente con el comprobante ya subido).
    const buildWaUrl = (receiptUrl) => {
        let m = `🛍️ Hola KURA STUDIO, quiero coordinar el pago de mi orden *${order.orderNumber}*.\n`;
        m += `Total: NIO ${order.total}\n`;
        if (Array.isArray(order.items) && order.items.length) {
            m += `\nArtículos:\n`;
            order.items.forEach(i => { m += `▪️ ${i.title}${i.selectedSize ? ` (${i.selectedSize})` : ''}\n`; });
        }
        if (reference.trim()) m += `\nReferencia: ${reference.trim()}`;
        if (receiptUrl) m += `\nComprobante: ${receiptUrl}`;
        m += `\n\n¿Me ayudan a finalizar la compra?`;
        return `https://wa.me/${waNumber}?text=${encodeURIComponent(m)}`;
    };
    const waUrl = buildWaUrl(null);

    const CopyBtn = ({ k, value }) => (
        <button type="button" onClick={() => copyValue(k, value)}
            className="text-kuraRed hover:text-white text-[11px] font-bold tracking-wide shrink-0 transition-colors">
            {copiedKey === k ? '✓ COPIADO' : 'COPIAR'}
        </button>
    );

    return (
        <div className="w-full max-w-md mx-auto space-y-4">

            {/* Orden creada */}
            <div className="border border-kuraRed bg-black rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(255,0,60,0.35)]">
                <div className="bg-kuraRed px-6 py-4 flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    <h2 className="font-bebas text-3xl text-black tracking-widest">ORDEN CREADA</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-center">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Tu número de orden</p>
                        <p className="font-bebas text-4xl text-kuraRed tracking-widest leading-none">{order.orderNumber}</p>
                    </div>
                    <div className="border border-zinc-800 bg-zinc-950 p-4 rounded-xl">
                        <p className="text-white font-bold text-sm mb-2">PASOS DE PAGO</p>
                        <ol className="text-zinc-400 text-xs leading-relaxed space-y-1 list-decimal list-inside">
                            <li>Elige el banco destino para tu transferencia.</li>
                            <li>Transfiere el <strong className="text-white">monto exacto</strong>.</li>
                            <li>Adjunta tu comprobante aquí mismo.</li>
                        </ol>
                        <div className="mt-3 border border-kuraRed/40 bg-kuraRed/10 rounded-lg px-3 py-2 text-center">
                            <span className="font-bebas text-2xl text-white tracking-wide">MONTO A TRANSFERIR: </span>
                            <span className="font-bebas text-2xl text-kuraRed tracking-wide">NIO {order.total}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selección de banco */}
            {banks.length > 0 ? (
                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3">
                    <p className="font-bold text-white text-sm">¿A QUÉ BANCO DESEAS TRANSFERIR?</p>
                    <div className="space-y-2">
                        {banks.map((b, i) => {
                            const id = b.id ?? i;
                            const active = id === selectedId;
                            return (
                                <button key={id} type="button" onClick={() => setSelectedId(id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${active ? 'border-kuraRed bg-kuraRed/10' : 'border-zinc-800 bg-black hover:border-zinc-600'}`}>
                                    {b.logoUrl ? (
                                        <img src={optimizeImg(b.logoUrl, 96)} onError={(e) => { if (e.target.src !== b.logoUrl) e.target.src = b.logoUrl; }} className="w-11 h-11 object-contain rounded-lg bg-white/5 shrink-0" alt={b.name} decoding="async" draggable={false} />
                                    ) : (
                                        <span className="w-11 h-11 rounded-lg bg-zinc-800 text-zinc-400 font-bebas text-lg flex items-center justify-center shrink-0">{(b.name || '?').slice(0, 3).toUpperCase()}</span>
                                    )}
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-white text-sm leading-none">{b.name}</p>
                                        <p className="text-zinc-500 text-xs font-mono mt-1 truncate">Cuenta: {b.accountNumber} · {b.currency || 'C$'}</p>
                                    </div>
                                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${active ? 'border-kuraRed bg-kuraRed' : 'border-zinc-600'}`}></span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Detalles de la cuenta seleccionada */}
                    {selectedBank && (
                        <div className="border border-zinc-800 bg-black rounded-xl p-4 mt-2">
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3">Detalles de la cuenta seleccionada</p>
                            <div className="space-y-2.5 text-xs font-mono">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-zinc-500">Banco</span>
                                    <span className="flex items-center gap-3"><span className="text-white">{selectedBank.name}</span><CopyBtn k="bank" value={selectedBank.name} /></span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-zinc-500">N° de cuenta</span>
                                    <span className="flex items-center gap-3"><span className="text-white">{selectedBank.accountNumber}</span><CopyBtn k="acct" value={selectedBank.accountNumber} /></span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-zinc-500 shrink-0">Titular</span>
                                    <span className="flex items-start gap-3 text-right"><span className="text-white">{selectedBank.holder}</span><CopyBtn k="holder" value={selectedBank.holder} /></span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-zinc-500">Moneda</span>
                                    <span className="flex items-center gap-3"><span className="text-white">{selectedBank.currency || 'C$'}</span><CopyBtn k="cur" value={selectedBank.currency || 'C$'} /></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="border border-yellow-800/40 bg-yellow-950/20 p-4 rounded-2xl text-center">
                    <p className="text-zinc-300 text-xs leading-relaxed">Aún no hay cuentas bancarias configuradas. Coordina tu pago por WhatsApp y te pasamos los datos.</p>
                </div>
            )}

            {/* Adjuntar comprobante */}
            <div className="border border-green-800/40 bg-green-950/10 p-5 rounded-2xl space-y-4">
                <div>
                    <p className="font-bold text-white text-sm">SIGUIENTE PASO: ADJUNTAR COMPROBANTE</p>
                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed">Adjunta el comprobante de tu transferencia. Puedes agregar el número de referencia (opcional).</p>
                </div>

                <div>
                    <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">Número de referencia (opcional)</p>
                    <input type="text" inputMode="numeric" placeholder="Ejemplo: 987654321" value={reference}
                        onChange={e => setReference(e.target.value)}
                        className="w-full bg-black border border-zinc-800 p-3 text-white text-sm outline-none focus:border-kuraRed transition-colors font-mono rounded-lg" />
                </div>

                <div>
                    <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">Comprobante (imagen) *</p>
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-zinc-700 border-dashed hover:border-kuraRed hover:bg-zinc-900 transition-colors cursor-pointer rounded-xl">
                        {receiptFile ? (
                            <div className="text-center p-2">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-kuraRed mx-auto mb-2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                                <span className="text-kuraRed font-bold text-xs block truncate max-w-[220px]">{receiptFile.name}</span>
                                <span className="text-zinc-500 text-[10px] mt-1 block">(Toca para cambiar)</span>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                                <span className="text-xs">Toca para subir la captura</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} className="hidden" />
                    </label>
                </div>

                <label className="flex items-start gap-3 cursor-pointer text-xs text-zinc-400">
                    <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-kuraRed w-4 h-4 shrink-0" />
                    <span className="leading-tight">Confirmo que realicé el pago de <strong className="text-kuraRed">NIO {order.total}</strong> y el comprobante adjunto es correcto.</span>
                </label>

                <button onClick={handleSubmit} disabled={!receiptFile || !acceptTerms || isUploading}
                    className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-2">
                    {isUploading ? <span className="animate-pulse">ENVIANDO COMPROBANTE...</span> : 'ENVIAR COMPROBANTE →'}
                </button>
                {(!receiptFile || !acceptTerms) && !isUploading && !fallbackReceipt && (
                    <p className="text-zinc-500 text-[11px] text-center">Adjunta tu comprobante y marca la casilla para enviar.</p>
                )}

                {fallbackReceipt && (
                    <div className="border border-yellow-700/50 bg-yellow-950/20 rounded-xl p-4 space-y-3">
                        <p className="text-yellow-300 text-xs leading-relaxed">
                            Tu comprobante se subió, pero no pudimos registrarlo automáticamente. Envíanoslo por WhatsApp con un toque para completar tu compra:
                        </p>
                        <a href={buildWaUrl(fallbackReceipt)} target="_blank" rel="noopener noreferrer"
                            className="flex justify-center items-center gap-2 w-full py-3 text-sm font-bold tracking-widest text-black bg-[#25D366] hover:opacity-90 transition-opacity rounded-xl">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            ENVIAR COMPROBANTE POR WHATSAPP
                        </a>
                    </div>
                )}
            </div>

            {/* Alternativa: WhatsApp (secundaria) */}
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex justify-center items-center gap-2 w-full py-3 text-xs font-bold tracking-widest text-[#25D366] border border-[#25D366]/50 hover:bg-[#25D366]/10 transition-colors rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                ¿PREFIERES AYUDA? CONTINÚA POR WHATSAPP
            </a>

            {/* Cancelar */}
            {onCancel && (
                <button type="button" onClick={onCancel}
                    className="block w-full py-3 text-[11px] font-bold tracking-widest text-zinc-600 hover:text-red-500 transition-colors">
                    CANCELAR ORDEN
                </button>
            )}
        </div>
    );
};
