// Aviso de cookies (informativo). Se muestra una vez hasta que el usuario lo
// acepta; guarda el consentimiento en localStorage. La tienda usa un
// identificador de dispositivo (localStorage) para analítica anónima.
window.CookieBanner = () => {
    const { useState, useEffect } = React;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try { if (!localStorage.getItem('kura_cookie_consent')) setVisible(true); } catch {}
    }, []);

    const accept = () => {
        try { localStorage.setItem('kura_cookie_consent', '1'); } catch {}
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[120] p-3 md:p-4 pointer-events-none">
            <div className="pointer-events-auto max-w-3xl mx-auto bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-xl leading-none shrink-0">🍪</span>
                <p className="text-zinc-400 text-xs leading-relaxed flex-1">
                    Usamos cookies y almacenamiento local para recordar tu carrito y medir el tráfico de forma <strong className="text-white">anónima</strong>. Al seguir navegando, aceptas su uso.
                </p>
                <button onClick={accept}
                    className="brutalist-btn px-6 py-2.5 text-sm shrink-0 w-full sm:w-auto">
                    ENTENDIDO
                </button>
            </div>
        </div>
    );
};
