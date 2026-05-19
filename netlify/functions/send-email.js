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

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON invalido: ' + e.message }) };
  }

  const { apiKey, from, to, subject, text, html } = payload;

  if (!apiKey) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta apiKey' }) };
  if (!from)   return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta from' }) };
  if (!to)     return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta to' }) };
  if (!subject)return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta subject' }) };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({ from, to, subject, text: text || '', html: html || text || '' })
    });

    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch(e) {
      data = { raw: responseText };
    }

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno: ' + error.message })
    };
  }
};
