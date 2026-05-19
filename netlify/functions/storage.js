const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON invalido' }) };
  }

  const { action, contacts } = payload;

  try {
    const store = getStore('outreach-data');

    if (action === 'save') {
      await store.setJSON('contacts', contacts || []);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, saved: (contacts||[]).length }) };

    } else if (action === 'load') {
      const data = await store.get('contacts', { type: 'json' });
      return { statusCode: 200, headers, body: JSON.stringify({ contacts: data || [] }) };

    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acción no reconocida' }) };
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
