exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Leer keys desde variables de entorno de Netlify
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = `${process.env.RESEND_FROM_NAME || 'MenteActiva'} <${process.env.RESEND_FROM_EMAIL}>`;

  if (!apiKey || !process.env.RESEND_FROM_EMAIL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Variables de entorno no configuradas en Netlify' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON invalido: ' + e.message }) };
  }

  const { to, subject, text, html } = payload;

  if (!to)      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta to' }) };
  if (!subject) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta subject' }) };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        from: defaultFrom,
        to,
        subject,
        text: text || '',
        html: html || text || ''
      })
    });

    const responseText = await response.text();
    let data;
    try { data = JSON.parse(responseText); } catch(e) { data = { raw: responseText }; }

    return { statusCode: response.status, headers, body: JSON.stringify(data) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno: ' + error.message }) };
  }
};
