export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // Recibimos los datos y el mensaje formateado para Telegram (telegramMsg)
    const { name, phone, address, total, orderNumber, orderDetails, telegramMsg } = req.body;
    
    const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!HUBSPOT_TOKEN) {
        return res.status(500).json({ error: 'Falta el token de HubSpot en Vercel' });
    }

    try {
        // 1. GUARDAR EN HUBSPOT
        const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    firstname: name,
                    phone: phone,
                    address: address, 
                    lifecyclestage: "customer",
                    numero_de_orden: orderNumber,
                    detalles_del_pedido: orderDetails,
                    total_gastado: total.toString()
                }
            })
        });

        if (!hubspotResponse.ok) {
            console.error("Fallo enviando a HubSpot");
        }

        // 2. ENVIAR NOTIFICACIÓN A TELEGRAM CON FORMATO HTML
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && telegramMsg) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: telegramMsg,
                    parse_mode: 'HTML'
                })
            });
        }

        return res.status(200).json({ success: true, message: '¡Lead guardado y notificado a Telegram!' });
        
    } catch (error) {
        console.error("Error en API:", error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
