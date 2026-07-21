// Widget de chat de KURA STUDIO. Habla con /api/chat (que consulta a
// gpt-4o-mini con el catálogo). Responde dudas de productos e info de compra;
// para pedidos/reclamos deriva a WhatsApp. La API key vive solo en el servidor.

const CHAT_WA = 'https://wa.me/50587091008';
const CHAT_STORE_KEY = 'kura_chat';
const CHAT_TTL = 6 * 60 * 60 * 1000; // 6 horas: después se descarta el historial

const DEFAULT_GREETING = { role: 'assistant', content: '¡Hola! 👋 Bienvenido a KURA STUDIO. Contame qué andás buscando y te ayudo a encontrar tu próximo drop 🔥 ¿Buscás algo en particular o querés ver lo último?' };

// Restaura la conversación guardada (si no venció).
function loadStoredChat() {
    try {
        const raw = localStorage.getItem(CHAT_STORE_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (!d || !Array.isArray(d.messages) || !d.messages.length) return null;
        if (Date.now() - (d.ts || 0) > CHAT_TTL) { localStorage.removeItem(CHAT_STORE_KEY); return null; }
        return d;
    } catch { return null; }
}

// Opciones rápidas generales (siempre presentes).
const GENERAL_PROMPTS = [
    { label: '🛍️ ¿Cómo compro?', text: '¿Cómo es el proceso de compra?' },
    { label: '💳 Métodos de pago', text: '¿Cómo puedo pagar mi pedido?' },
    { label: '🚚 Envíos y tiempos', text: '¿Cuánto cuesta el envío y cuánto tarda en llegar?' },
];

// Lee las categorías reales del catálogo desde la caché de la tienda para
// armar chips de colecciones dinámicos.
function buildQuickPrompts() {
    try {
        const raw = localStorage.getItem('kura_store_cache');
        if (raw) {
            const { products = [], config = {} } = JSON.parse(raw);
            let cats = (config.categories && config.categories.length)
                ? config.categories
                : [...new Set(products.map(p => p.category).filter(Boolean))];
            const collChips = cats.slice(0, 3).map(c => ({ label: `👕 ${c}`, text: `¿Qué tienen en la colección ${c}?` }));
            if (collChips.length) return [...collChips, ...GENERAL_PROMPTS];
        }
    } catch {}
    return [{ label: '👕 Ver colecciones', text: '¿Qué colecciones tienen disponibles?' }, ...GENERAL_PROMPTS];
}

// Convierte URLs y saltos de línea en nodos React (links clicables).
function renderRich(text) {
    const nodes = [];
    const lines = String(text).split('\n');
    lines.forEach((line, li) => {
        const tokens = line.split(/(https?:\/\/[^\s]+)/g);
        tokens.forEach((tok, ti) => {
            if (/^https?:\/\//.test(tok)) {
                nodes.push(<a key={`${li}-${ti}`} href={tok} target="_blank" rel="noopener noreferrer" className="text-kuraRed underline break-all">{tok}</a>);
            } else if (tok) {
                nodes.push(<span key={`${li}-${ti}`}>{tok}</span>);
            }
        });
        if (li < lines.length - 1) nodes.push(<br key={`br${li}`} />);
    });
    return nodes;
}

window.ChatBot = () => {
    const { useState, useRef, useEffect } = React;
    const [open, setOpen] = useState(() => !!loadStoredChat()?.open);
    const [teaser, setTeaser] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [vp, setVp] = useState(null); // viewport visible (para el teclado en móvil)
    const [quickPrompts, setQuickPrompts] = useState(GENERAL_PROMPTS);
    const [messages, setMessages] = useState(() => loadStoredChat()?.messages || [DEFAULT_GREETING]);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Arma los chips (colecciones reales + generales) al montar.
    useEffect(() => { setQuickPrompts(buildQuickPrompts()); }, []);

    // Persiste la conversación (sobrevive recargas y navegación).
    useEffect(() => {
        try { localStorage.setItem(CHAT_STORE_KEY, JSON.stringify({ ts: Date.now(), open, messages: messages.slice(-50) })); } catch {}
    }, [messages, open]);

    // Burbuja de saludo antes de abrir (una vez por sesión; no si ya hay charla).
    useEffect(() => {
        let shown = false;
        try { shown = !!sessionStorage.getItem('kura_chat_teaser'); } catch {}
        if (shown || open || messages.length > 1) return;
        const t = setTimeout(() => setTeaser(true), 2500);
        return () => clearTimeout(t);
    }, []);

    // Autoscroll al último mensaje.
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading, open]);

    // Bloquea el scroll de la página detrás mientras el chat está abierto.
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    // En móvil, ajusta el panel al viewport visible cuando aparece el teclado.
    // Se escuchan varias señales porque en navegadores embebidos (Instagram/
    // Facebook) el evento de visualViewport a veces no dispara.
    useEffect(() => {
        if (!open) { setVp(null); return; }
        const isMobile = window.matchMedia('(max-width: 639px)').matches;
        if (!isMobile) return;
        const vv = window.visualViewport;
        const update = () => {
            if (vv) setVp({ height: vv.height, top: vv.offsetTop });
            else setVp({ height: window.innerHeight, top: 0 });
        };
        update();
        if (vv) { vv.addEventListener('resize', update); vv.addEventListener('scroll', update); }
        window.addEventListener('resize', update);
        return () => {
            if (vv) { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); }
            window.removeEventListener('resize', update);
        };
    }, [open]);

    // Al enfocar el input, forzamos una relectura del viewport y llevamos el
    // campo a la vista (respaldo para WebViews que no emiten el evento).
    const onFocusInput = () => {
        setTimeout(() => {
            const vv = window.visualViewport;
            if (vv) setVp({ height: vv.height, top: vv.offsetTop });
            if (inputRef.current) inputRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
    };

    const openChat = () => {
        setOpen(true);
        setTeaser(false);
        try { sessionStorage.setItem('kura_chat_teaser', '1'); } catch {}
    };
    const dismissTeaser = (e) => {
        if (e) e.stopPropagation();
        setTeaser(false);
        try { sessionStorage.setItem('kura_chat_teaser', '1'); } catch {}
    };

    const sendText = async (text) => {
        const clean = (text || '').trim();
        if (!clean || loading) return;
        const next = [...messages, { role: 'user', content: clean }];
        setMessages(next);
        setInput('');
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
            });
            if (!res.ok) throw new Error('chat_failed');
            const data = await res.json();
            setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
        } catch {
            setMessages(m => [...m, { role: 'assistant', content: 'Uy, no pude responder en este momento. Escribinos por WhatsApp y te ayudamos enseguida: ' + CHAT_WA }]);
        }
        setLoading(false);
    };

    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(input); } };

    const resetChat = () => {
        if (loading) return;
        setMessages([DEFAULT_GREETING]);
        setInput('');
        try { localStorage.removeItem(CHAT_STORE_KEY); } catch {}
    };

    const showQuick = messages.length === 1 && !loading;
    // En móvil, cuando el teclado abre, fijamos el panel al viewport visible.
    // OJO: hay que forzar bottom:auto porque la clase inset-0 pone bottom:0 y,
    // si top+bottom+height coexisten, la altura se ignora y el panel queda tapado.
    const panelStyle = vp ? { top: `${vp.top}px`, bottom: 'auto', height: `${vp.height}px` } : undefined;

    return (
        <>
            {/* Burbuja de saludo */}
            {!open && teaser && (
                <div onClick={openChat}
                    className="fixed bottom-[5.25rem] left-4 z-[100] max-w-[240px] bg-[#050505] border border-zinc-800 rounded-2xl rounded-bl-sm shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-3 pr-8 cursor-pointer animate-slideUp">
                    <button onClick={dismissTeaser} aria-label="Cerrar" className="absolute top-1.5 right-2 text-zinc-600 hover:text-white text-sm leading-none">✕</button>
                    <p className="text-zinc-200 text-xs leading-relaxed">👋 ¡Hola! Soy el asistente de KURA STUDIO. ¿Necesitás ayuda?</p>
                </div>
            )}

            {/* Botón flotante (único) */}
            {!open && (
                <button onClick={openChat} aria-label="Abrir chat"
                    className="fixed bottom-6 left-4 z-[100] w-[52px] h-[52px] rounded-full bg-kuraRed text-black flex items-center justify-center shadow-[0_4px_20px_rgba(255,0,60,0.5)] hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </button>
            )}

            {/* Panel */}
            {open && (
                <div style={panelStyle}
                    className="fixed z-[130] inset-0 h-[100dvh] sm:inset-auto sm:bottom-4 sm:left-4 sm:right-auto sm:w-[380px] sm:h-[70vh] sm:max-h-[560px] flex flex-col bg-[#050505] sm:border sm:border-zinc-800 sm:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-black shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-kuraRed rounded-full animate-pulse"></span>
                            <h2 className="font-bebas text-xl tracking-widest">ASISTENTE KURA</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 1 && (
                                <button onClick={resetChat} aria-label="Nueva conversación" title="Nueva conversación" className="text-zinc-500 hover:text-white p-1">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 019-9 9 9 0 016.7 3H21"/><path d="M21 3v6h-6"/><path d="M21 12a9 9 0 01-9 9 9 9 0 01-6.7-3H3"/><path d="M3 21v-6h6"/></svg>
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-zinc-500 hover:text-white text-xl leading-none p-1">✕</button>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-kuraRed text-black rounded-br-sm' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm'}`}>
                                    {renderRich(m.content)}
                                </div>
                            </div>
                        ))}

                        {/* Opciones rápidas (al inicio) */}
                        {showQuick && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {quickPrompts.map((q, i) => (
                                    <button key={i} onClick={() => sendText(q.text)}
                                        className="px-3 py-2 text-xs font-bold text-kuraRed border border-kuraRed/40 hover:bg-kuraRed hover:text-black transition-colors rounded-full">
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2 rounded-2xl rounded-bl-sm text-sm">
                                    <span className="animate-pulse">escribiendo…</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* WhatsApp */}
                    <a href={CHAT_WA} target="_blank" rel="noopener noreferrer"
                        className="mx-4 mb-2 flex justify-center items-center gap-2 py-2 text-[11px] font-bold tracking-widest text-[#25D366] border border-[#25D366]/40 hover:bg-[#25D366]/10 transition-colors rounded-xl shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        HABLAR POR WHATSAPP
                    </a>

                    {/* Input */}
                    <div className="p-3 border-t border-zinc-800 flex items-end gap-2 bg-black shrink-0">
                        <textarea
                            ref={inputRef}
                            value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} onFocus={onFocusInput}
                            rows={1} placeholder="Escribe tu pregunta…" maxLength={500}
                            className="flex-1 resize-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-kuraRed transition-colors max-h-24" />
                        <button onClick={() => sendText(input)} disabled={!input.trim() || loading} aria-label="Enviar"
                            className="brutalist-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0 p-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
