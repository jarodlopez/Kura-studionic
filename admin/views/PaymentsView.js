// Pestaña PAGOS — administra las cuentas bancarias que se muestran en el checkout.
// Cada banco: { id, name, accountNumber, holder, currency, logoUrl }
// Handlers desde admin-panel: handleAddBank, handleRemoveBank, handleBankLogoUpload

window.PaymentsView = ({ storeConfig, handleAddBank, handleRemoveBank, handleBankLogoUpload, handleSeedDefaultBanks, isSaving }) => {
    const empty = { name: '', accountNumber: '', holder: '', currency: 'C$', logoFile: null };
    const [form, setForm] = React.useState(empty);
    const [logoName, setLogoName] = React.useState('');

    const banks = storeConfig.bankAccounts || [];

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.accountNumber.trim() || !form.holder.trim()) return;
        await handleAddBank(form);
        setForm(empty);
        setLogoName('');
    };

    return (
        <div className="view-animate flex flex-col gap-6">

            {/* Formulario para añadir banco */}
            <div className="border border-zinc-800 p-5 bg-zinc-950 rounded-2xl">
                <h2 className="font-bebas text-3xl text-kuraRed mb-1">AÑADIR CUENTA BANCARIA</h2>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                    Estas cuentas aparecen en el checkout para que el cliente transfiera y suba su comprobante.
                </p>
                <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input placeholder="BANCO (Ej: BAC)" className="brutalist-input" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input placeholder="MONEDA (Ej: C$)" className="brutalist-input" value={form.currency}
                        onChange={e => setForm({ ...form, currency: e.target.value })} />
                    <input placeholder="NÚMERO DE CUENTA" className="brutalist-input" value={form.accountNumber}
                        onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
                    <input placeholder="TITULAR DE LA CUENTA" className="brutalist-input" value={form.holder}
                        onChange={e => setForm({ ...form, holder: e.target.value })} />
                    <div className="sm:col-span-2 border border-zinc-800 p-4 bg-black rounded-lg">
                        <p className="text-xs text-zinc-500 mb-2 font-bold">LOGO DEL BANCO (opcional)</p>
                        <input type="file" accept="image/*"
                            onChange={e => { setForm({ ...form, logoFile: e.target.files[0] || null }); setLogoName(e.target.files[0]?.name || ''); }}
                            className="text-xs w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                        {logoName && <p className="text-[10px] text-kuraRed mt-2 truncate">{logoName}</p>}
                    </div>
                    <button type="submit" disabled={isSaving}
                        className="brutalist-btn sm:col-span-2 py-3 text-base flex items-center justify-center gap-2">
                        {isSaving && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>}
                        {isSaving ? 'GUARDANDO...' : '+ AGREGAR BANCO'}
                    </button>
                </form>
            </div>

            {/* Lista de bancos */}
            <div className="border border-zinc-800 p-5 bg-zinc-950 rounded-2xl overflow-hidden">
                <h3 className="font-bebas text-2xl border-b border-zinc-800 pb-2 mb-4">CUENTAS ACTIVAS ({banks.length})</h3>
                {banks.length === 0 ? (
                    <div className="py-6 text-center space-y-4">
                        <p className="text-zinc-600 text-sm font-mono italic">No hay cuentas bancarias. Añade una arriba.</p>
                        {handleSeedDefaultBanks && (
                            <button onClick={handleSeedDefaultBanks} disabled={isSaving}
                                className="brutalist-btn-outline px-5 py-2.5 text-xs font-bold tracking-widest">
                                ⇩ CARGAR CUENTAS ANTERIORES (BAC · LAFISE)
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {banks.map(b => (
                            <div key={b.id} className="flex gap-4 border border-zinc-800 p-3 items-center bg-black rounded-xl">
                                {/* Logo — click para cambiar */}
                                <label className="cursor-pointer shrink-0 group relative">
                                    {b.logoUrl ? (
                                        <img src={b.logoUrl} className="w-14 h-14 object-contain rounded-lg bg-white/5 border border-zinc-700 group-hover:opacity-70 transition-opacity" />
                                    ) : (
                                        <div className="w-14 h-14 bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center rounded-lg group-hover:border-kuraRed transition-colors">
                                            <span className="text-zinc-600 text-[8px] font-mono group-hover:text-kuraRed">LOGO</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden"
                                        onChange={e => e.target.files[0] && handleBankLogoUpload(b.id, e.target.files[0])} />
                                </label>

                                <div className="flex-1 overflow-hidden min-w-0">
                                    <p className="font-bebas text-xl leading-none truncate">{b.name} <span className="text-zinc-600 text-sm">· {b.currency || 'C$'}</span></p>
                                    <p className="text-xs text-zinc-400 mt-1 font-mono truncate">Cuenta: {b.accountNumber}</p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{b.holder}</p>
                                </div>

                                <button onClick={() => handleRemoveBank(b.id)}
                                    className="text-red-500 font-bold px-3 py-2 hover:bg-red-900 border border-transparent hover:border-red-500 transition-colors shrink-0 rounded-lg">✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
