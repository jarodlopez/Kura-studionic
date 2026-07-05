// Guía educativa del proceso de compra / pago de KURA STUDIO.
// Reutilizable en dos contextos:
//   - variant="inline"  → sección colapsable dentro del checkout.
//   - variant="page"    → contenido principal de la página /como-comprar.
// Expone: window.PAYMENT_STEPS, window.PAYMENT_FAQ, window.PaymentGuide
//
// El contenido refleja EXACTAMENTE el flujo real del sitio:
// carrito → checkout → WhatsApp → link seguro → transferencia + comprobante → verificación.

const KURA_WA = 'https://wa.me/50587091008';

window.PAYMENT_STEPS = [
    {
        title: 'ARMA TU CARRITO',
        desc: 'Elige tus prendas y tallas y agrégalas al carrito. Antes de continuar selecciona tu zona de envío (Managua NIO 100 · Departamentos NIO 165) y aplica tu código de descuento si tienes uno.',
    },
    {
        title: 'CONFIRMA TUS DATOS',
        desc: 'En el checkout ingresa tu nombre, teléfono y dirección exacta. Al confirmar generamos tu número de orden (KURA-XXXXXX). Tranquilo: en este paso todavía no pagas nada.',
    },
    {
        title: 'ELIGE CÓMO PAGAR',
        desc: 'Al confirmar tu pedido puedes pagar aquí mismo por transferencia, o continuar por WhatsApp para que un agente te acompañe a finalizar la compra. Tú decides.',
    },
    {
        title: 'REALIZA TU TRANSFERENCIA',
        desc: 'Elige el banco (BAC o LAFISE, en córdobas, a nombre de Kathy Valeska Membreño Medina), copia los datos con un toque y transfiere el total exacto desde tu banco o billetera.',
    },
    {
        title: 'SUBE TU COMPROBANTE',
        desc: 'En la misma pantalla adjunta la captura o foto del comprobante (puedes agregar el número de referencia), confirma y envíalo. Listo, nosotros nos encargamos del resto.',
    },
    {
        title: 'VERIFICACIÓN Y ENTREGA',
        desc: 'Verificamos tu pago (normalmente en menos de 24 horas) y te contactamos por WhatsApp para coordinar la entrega. Recibes tu pedido en 24 a 72 horas. 🖤',
    },
];

window.PAYMENT_FAQ = [
    {
        q: '¿Por qué no pago con tarjeta directamente en la web?',
        a: 'Por seguridad trabajamos con transferencia bancaria. Al confirmar tu pedido ves los datos de las cuentas y subes tu comprobante en la misma página, o coordinas por WhatsApp. Así protegemos tu información y confirmamos cada orden de forma personal.',
    },
    {
        q: '¿A qué cuentas puedo transferir?',
        a: 'Las cuentas activas (por ejemplo BAC y LAFISE, en córdobas) aparecen al confirmar tu pedido, con botón para copiar cada dato. Transfiere el monto exacto de tu orden.',
    },
    {
        q: '¿Cuánto cuesta el envío?',
        a: 'Managua NIO 100 y Departamentos NIO 165. El costo del envío se suma a tu total antes de pagar y lo ves reflejado en el resumen.',
    },
    {
        q: '¿Qué comprobante debo subir?',
        a: 'La captura de pantalla o foto donde se vea claramente el monto transferido, la fecha y el número de referencia de la operación.',
    },
    {
        q: '¿Cuánto tardan en verificar mi pago?',
        a: 'Normalmente en menos de 24 horas. En cuanto confirmamos la transferencia te escribimos por WhatsApp para coordinar la entrega.',
    },
    {
        q: '¿En cuánto tiempo recibo mi pedido?',
        a: 'Entre 24 y 72 horas una vez verificado el pago, según tu zona de envío.',
    },
    {
        q: '¿Qué pasa si cierro la página antes de pagar?',
        a: 'Tu orden queda guardada en tu navegador. Al volver al checkout puedes retomar el pago justo donde lo dejaste, o cancelarla si cambiaste de opinión.',
    },
    {
        q: '¿Y si prefiero que me ayuden?',
        a: 'En la pantalla de pago tienes un botón para continuar por WhatsApp: un agente de atención te acompaña a finalizar la compra y validar tu pago.',
    },
];

// --- Lista de pasos (timeline con badges numerados) ---
function PaymentStepsList({ compact }) {
    return (
        <ol className="space-y-3">
            {window.PAYMENT_STEPS.map((step, i) => (
                <li key={i} className="flex gap-4 border border-zinc-800 bg-zinc-950 p-4 rounded-xl">
                    <span className="shrink-0 w-9 h-9 rounded-full bg-kuraRed text-black font-bebas text-xl flex items-center justify-center leading-none">
                        {i + 1}
                    </span>
                    <div className="flex-1">
                        <p className="font-bebas text-lg tracking-widest text-white leading-none mb-1.5">{step.title}</p>
                        <p className={`text-zinc-400 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>{step.desc}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

// --- Acordeón de dudas frecuentes ---
function PaymentFAQList() {
    const { useState } = React;
    const [openIdx, setOpenIdx] = useState(null);
    return (
        <div className="space-y-2">
            {window.PAYMENT_FAQ.map((item, i) => {
                const isOpen = openIdx === i;
                return (
                    <div key={i} className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setOpenIdx(isOpen ? null : i)}
                            className="w-full flex items-center justify-between gap-3 text-left p-4 hover:bg-zinc-900 transition-colors"
                        >
                            <span className="text-sm font-bold text-white">{item.q}</span>
                            <span className={`text-kuraRed text-xl leading-none shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                        </button>
                        {isOpen && (
                            <p className="px-4 pb-4 text-zinc-400 text-xs leading-relaxed border-t border-zinc-900 pt-3">{item.a}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

window.PaymentGuide = ({ variant = 'page' }) => {
    const { useState } = React;

    // --- Variante colapsable para el checkout ---
    if (variant === 'inline') {
        const [open, setOpen] = useState(false);
        return (
            <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between gap-3 p-4 hover:bg-zinc-900 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kuraRed shrink-0"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        ¿CÓMO FUNCIONA EL PAGO?
                    </span>
                    <span className={`text-kuraRed text-xl leading-none shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
                </button>
                {open && (
                    <div className="p-4 pt-0 space-y-4 border-t border-zinc-900">
                        <p className="text-zinc-400 text-xs leading-relaxed pt-4">
                            En KURA STUDIO el pago es por <strong className="text-white">transferencia bancaria</strong>: pagas
                            <strong className="text-white"> aquí mismo</strong> subiendo tu comprobante, o por WhatsApp. Así funciona:
                        </p>
                        <PaymentStepsList compact />
                        <a href="/como-comprar" target="_blank" rel="noopener noreferrer"
                            className="block text-center text-xs font-bold tracking-widest text-kuraRed hover:text-white transition-colors py-2">
                            VER GUÍA COMPLETA Y DUDAS FRECUENTES →
                        </a>
                    </div>
                )}
            </div>
        );
    }

    // --- Variante página completa (/como-comprar) ---
    return (
        <div className="min-h-screen bg-black text-white">
            <header className="px-4 md:px-8 py-4 flex justify-between items-center border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-40">
                <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold tracking-widest">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    TIENDA
                </a>
                <h1 className="font-bebas text-2xl tracking-widest">CÓMO COMPRAR</h1>
                <div className="w-20"></div>
            </header>

            <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-10">

                {/* Intro */}
                <section className="text-center space-y-3 pt-4">
                    <h2 className="font-bebas text-4xl md:text-5xl tracking-wider">
                        TU COMPRA, <span className="text-kuraRed">PASO A PASO</span>
                    </h2>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                        Comprar en KURA STUDIO es simple y seguro. El pago se realiza por
                        <strong className="text-white"> transferencia bancaria</strong>: al confirmar tu pedido pagas
                        <strong className="text-white"> aquí mismo</strong> subiendo tu comprobante, o coordinas por WhatsApp.
                        Aquí te explicamos todo antes de empezar.
                    </p>
                </section>

                {/* Pasos */}
                <section className="space-y-4">
                    <h3 className="font-bebas text-2xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">EL PROCESO</h3>
                    <PaymentStepsList />
                </section>

                {/* Datos bancarios */}
                <section className="space-y-4">
                    <h3 className="font-bebas text-2xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">DATOS PARA TRANSFERIR</h3>
                    <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl flex items-start gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kuraRed shrink-0 mt-0.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            Las cuentas bancarias (por ejemplo <strong className="text-white">BAC</strong> y <strong className="text-white">LAFISE</strong>, en córdobas) aparecen
                            al confirmar tu pedido, con un botón para <strong className="text-white">copiar cada dato</strong>. Transfiere el monto exacto de tu orden y sube tu comprobante en la misma pantalla.
                        </p>
                    </div>
                </section>

                {/* FAQ */}
                <section className="space-y-4">
                    <h3 className="font-bebas text-2xl text-zinc-500 tracking-widest border-b border-zinc-800 pb-3">DUDAS FRECUENTES</h3>
                    <PaymentFAQList />
                </section>

                {/* CTA */}
                <section className="space-y-3 pb-4">
                    <a href="/" className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                        EMPEZAR A COMPRAR
                    </a>
                    <a href={KURA_WA} target="_blank" rel="noopener noreferrer"
                        className="flex justify-center items-center gap-2 w-full py-3 text-xs font-bold tracking-widest text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-xl">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        ¿MÁS DUDAS? ESCRÍBENOS POR WHATSAPP
                    </a>
                </section>
            </div>

            <footer className="py-6 text-center border-t border-zinc-900/50">
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, letterSpacing: '0.08em' }} className="text-[10px] text-zinc-700">
                    powered by <span className="text-zinc-500">Kodialabs</span>
                </p>
            </footer>
        </div>
    );
};
