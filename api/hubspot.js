export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { name, phone, address, total, orderNumber } = req.body;
    
    // Vercel saca el token que guardaste en el Paso 1
    const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

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
                    lifecyclestage: "customer"
                }
            })
        });

        if (!response.ok) {
            throw new Error('Error guardando en HubSpot');
        }

        return res.status(200).json({ success: true, message: 'Lead guardado!' });
        
    } catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
}
