export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { name, phone, address, total, orderNumber, orderDetails } = req.body;
    
    const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

    if (!HUBSPOT_TOKEN) {
        return res.status(500).json({ error: 'Falta el token de configuración en Vercel' });
    }

    try {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
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

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Fallo enviando a HubSpot:", data);
            throw new Error(data.message || 'Error guardando en HubSpot');
        }

        return res.status(200).json({ success: true, message: 'Lead guardado con todos sus datos!' });
        
    } catch (error) {
        console.error("Error en API:", error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
