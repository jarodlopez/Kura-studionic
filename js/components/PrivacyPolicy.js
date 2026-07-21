// Página /privacidad — Política de Privacidad de KURA STUDIO.
// Contenido informativo basado en los datos que la tienda realmente maneja.
// Expone: window.PrivacyPolicy

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
                    En KURA STUDIO cuidamos tu información. Acá te explicamos qué datos pedimos, para qué los usamos y cómo los protegemos.
                </p>
                <p className="text-zinc-600 text-xs font-mono">Última actualización: {PRIV_UPDATED}</p>
            </section>

            <PrivSection n="1" title="QUÉ DATOS RECOPILAMOS">
                <p><strong className="text-white">Datos que nos das al comprar:</strong> tu nombre, teléfono y dirección de entrega, y el comprobante de pago (imagen) junto con el número de referencia de tu transferencia. Estos datos son necesarios para procesar y entregar tu pedido.</p>
                <p><strong className="text-white">Datos del chat de asistencia:</strong> los mensajes que escribís al asistente virtual para poder responderte.</p>
                <p><strong className="text-white">Datos técnicos y de uso (anónimos):</strong> un identificador de dispositivo, una versión <em>anónima y cifrada</em> de tu dirección IP (no guardamos tu IP real), y eventos de navegación (páginas y productos vistos, artículos agregados al carrito). Nos sirven para medir el tráfico y mejorar la tienda.</p>
                <p className="text-zinc-500">No solicitamos datos sensibles ni números de tarjeta: el pago es por transferencia bancaria y solo vos manejás tus datos bancarios en tu banco.</p>
            </PrivSection>

            <PrivSection n="2" title="CÓMO USAMOS TUS DATOS">
                <ul className="list-disc list-inside space-y-1.5">
                    <li>Procesar, verificar y entregar tus pedidos.</li>
                    <li>Contactarte por WhatsApp para coordinar el pago y la entrega.</li>
                    <li>Responder tus consultas en el asistente virtual.</li>
                    <li>Mejorar nuestros productos y la experiencia de la tienda mediante estadísticas anónimas.</li>
                </ul>
                <p className="text-white font-semibold">Nunca vendemos ni alquilamos tu información a terceros.</p>
            </PrivSection>

            <PrivSection n="3" title="CON QUIÉN LOS COMPARTIMOS">
                <p>Solo compartimos lo necesario con proveedores tecnológicos que nos permiten operar, y únicamente para prestarte el servicio:</p>
                <ul className="list-disc list-inside space-y-1.5">
                    <li><strong className="text-white">Google (Firebase):</strong> base de datos donde se guardan tus pedidos.</li>
                    <li><strong className="text-white">Vercel:</strong> alojamiento del sitio web.</li>
                    <li><strong className="text-white">ImgBB:</strong> almacenamiento de la imagen del comprobante de pago.</li>
                    <li><strong className="text-white">OpenAI:</strong> procesa los mensajes del asistente virtual para generar las respuestas.</li>
                    <li><strong className="text-white">WhatsApp (Meta):</strong> canal para coordinar tu compra.</li>
                    <li><strong className="text-white">CRM y notificaciones internas:</strong> para gestionar tus pedidos dentro de nuestro equipo.</li>
                </ul>
            </PrivSection>

            <PrivSection n="4" title="COOKIES Y ALMACENAMIENTO LOCAL">
                <p>Usamos el almacenamiento de tu navegador (cookies y <em>localStorage</em>) para recordar tu carrito, tu orden pendiente, el historial del chat y un identificador anónimo para las estadísticas. Podés borrarlos en cualquier momento desde la configuración de tu navegador; el sitio seguirá funcionando.</p>
            </PrivSection>

            <PrivSection n="5" title="CUÁNTO TIEMPO LOS CONSERVAMOS">
                <p>Conservamos los datos de tus pedidos el tiempo necesario para gestionarlos y cumplir obligaciones administrativas. Las estadísticas se guardan de forma anónima. El historial del chat se guarda solo en tu dispositivo y caduca automáticamente a las 6 horas.</p>
            </PrivSection>

            <PrivSection n="6" title="TUS DERECHOS">
                <p>Podés solicitar en cualquier momento <strong className="text-white">acceder</strong> a tus datos, <strong className="text-white">corregirlos</strong>, <strong className="text-white">eliminarlos</strong> u <strong className="text-white">oponerte</strong> a su uso. Escribinos por WhatsApp y atenderemos tu solicitud.</p>
                <a href={PRIV_WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-kuraRed hover:text-white transition-colors text-xs font-bold tracking-widest pt-1">
                    EJERCER MIS DERECHOS POR WHATSAPP →
                </a>
            </PrivSection>

            <PrivSection n="7" title="CÓMO PROTEGEMOS TUS DATOS">
                <ul className="list-disc list-inside space-y-1.5">
                    <li>Todo el sitio funciona sobre conexión segura (HTTPS).</li>
                    <li>El acceso a los pedidos está restringido y protegido con autenticación.</li>
                    <li>Tu dirección IP se guarda cifrada (hash), nunca en su forma original.</li>
                    <li>Las claves y credenciales del sistema se mantienen protegidas del lado del servidor.</li>
                </ul>
            </PrivSection>

            <PrivSection n="8" title="MARCO LEGAL (NICARAGUA)">
                <p>Tratamos tus datos personales conforme a la <strong className="text-white">Ley No. 787, Ley de Protección de Datos Personales de la República de Nicaragua</strong>, y su reglamento. Esto significa que recopilamos solo los datos necesarios, con una finalidad clara, y respetando tu derecho a controlarlos.</p>
                <p className="text-zinc-500 text-xs">Este documento es informativo y describe nuestras prácticas; no sustituye asesoría legal.</p>
            </PrivSection>

            <PrivSection n="9" title="CONTACTO">
                <p>¿Dudas sobre tu privacidad o tus datos? Escribinos y te ayudamos:</p>
                <a href={PRIV_WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-kuraRed hover:text-white transition-colors font-bold">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    WhatsApp KURA STUDIO
                </a>
            </PrivSection>

            <a href="/" className="brutalist-btn w-full py-4 text-xl flex justify-center items-center gap-3 mt-2">
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
