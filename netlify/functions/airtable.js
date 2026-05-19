exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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

  const { action, apiKey, baseId, tableId, record, recordId, records } = payload;

  if (!apiKey || !baseId || !tableId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan apiKey, baseId o tableId' }) };
  }

  const base = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const authHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  try {
    let response, data;

    if (action === 'list') {
      // Listar todos los registros (paginado)
      let allRecords = [];
      let offset = null;
      do {
        const url = offset ? `${base}?pageSize=100&offset=${offset}` : `${base}?pageSize=100`;
        response = await fetch(url, { headers: authHeaders });
        data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Error listando registros');
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset || null;
      } while (offset);
      return { statusCode: 200, headers, body: JSON.stringify({ records: allRecords }) };

    } else if (action === 'create') {
      response = await fetch(base, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ fields: record })
      });
      data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error creando registro');
      return { statusCode: 200, headers, body: JSON.stringify(data) };

    } else if (action === 'update') {
      response = await fetch(`${base}/${recordId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ fields: record })
      });
      data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error actualizando registro');
      return { statusCode: 200, headers, body: JSON.stringify(data) };

    } else if (action === 'delete') {
      response = await fetch(`${base}/${recordId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error eliminando registro');
      return { statusCode: 200, headers, body: JSON.stringify(data) };

    } else if (action === 'bulkCreate') {
      // Crear múltiples registros (max 10 por request en Airtable)
      let created = [];
      for (let i = 0; i < records.length; i += 10) {
        const batch = records.slice(i, i + 10).map(r => ({ fields: r }));
        response = await fetch(base, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ records: batch })
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Error en bulk create');
        created = created.concat(data.records || []);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ records: created }) };

    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acción no reconocida: ' + action }) };
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
