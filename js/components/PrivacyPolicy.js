// Página /privacidad — Política de Privacidad de KURA STUDIO (versión breve:
// formularios y cookies). Expone: window.PrivacyPolicy

const PRIV_WA = 'https://wa.me/50587091008';
const PRIV_UPDATED = 'Julio de 2026';

function PrivSection({ n, title, children }) {
    return (
        <section className="space-y-3">
            <h3 className="font-bebas text-2xl text-white tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-kuraRed text-black text-sm font-bebas flex items-center justify-center shrink-0">{n}</span>
                {title}
            </h3>
            <div className="text-zinc-400 text-sm leading-relaxed space-y-2">{children}</div>
        </section>
    );
}

window.PrivacyPolicy = () => (
    <div className="min-h-screen bg-black text-white">
        <header className="px-4 md:px-8 py-4 flex justify-between items-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
            <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold tracking-widest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                TIENDA
            </a>
            <h1 className="font-bebas text-2xl tracking-widest">PRIVACIDAD</h1>
            <div className="w-20"></div>
        </header>

        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-9">

            {/* Intro */}
            <section className="text-center space-y-3 pt-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 mb-1">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-kuraRed"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h2 className="font-bebas text-4xl md:text-5xl tracking-wider">POLÍTICA DE <span className="text-kuraRed">PRIVACIDAD</span></h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                    En KURA STUDIO cuidamos tu información. Acá te explicamos, de forma breve, los datos que se recopilan a través de los formularios y las cookies.
                </p>
                <p className="text-zinc-600 text-xs font-mono">Última actualización: {PRIV_UPDATED}</p>
            </section>

            <PrivSection n="1" title="FORMULARIOS">
                <p>Cuando hacés un pedido, en el formulario de compra te pedimos tu <strong className="text-white">nombre, teléfono y dirección de entrega</strong>, y luego el <strong className="text-white">comprobante de pago</strong> (imagen) con su número de referencia.</p>
                <p>Usamos esos datos <strong className="text-white">únicamente</strong> para procesar tu pedido, verificar el pago y coordinar la entrega por WhatsApp. No los vendemos ni los compartimos con fines de publicidad.</p>
            </PrivSection>

            <PrivSection n="2" title="COOKIES Y ALMACENAMIENTO LOCAL">
                <p>Usamos el almacenamiento de tu navegador (cookies y <em>localStorage</em>) para que la tienda funcione bien: recordar tu <strong className="text-white">carrito</strong>, tu <strong className="text-white">orden pendiente</strong>, el <strong className="text-white">historial del chat</strong> y un identificador anónimo para medir el tráfico.</p>
                <p>Podés borrarlos cuando quieras desde la configuración de tu navegador; la tienda seguirá funcionando.</p>
            </PrivSection>

            <p className="text-zinc-500 text-xs leading-relaxed text-center pt-2">
                ¿Dudas sobre tus datos? Escribinos por WhatsApp:{' '}
                <a href={PRIV_WA} target="_blank" rel="noopener noreferrer" className="text-kuraRed hover:text-white transition-colors font-bold">KURA STUDIO</a>.
            </p>

            <a href="/" className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-3">
                ← VOLVER A LA TIENDA
            </a>
        </div>

        <footer className="py-6 text-center border-t border-zinc-900/50">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, letterSpacing: '0.08em' }} className="text-[10px] text-zinc-700">
                powered by <span className="text-zinc-500">Kodialabs</span>
            </p>
        </footer>
    </div>
);
