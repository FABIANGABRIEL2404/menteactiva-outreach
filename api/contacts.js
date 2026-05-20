// api/contacts.js — Vercel Serverless Function con MongoDB
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Patrón correcto para serverless — nueva conexión por invocación
async function getDB() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });
  await client.connect();
  return { client, db: client.db('menteactiva') };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { action, contacts, contact, id } = req.body;

  let client;
  try {
    const conn = await getDB();
    client = conn.client;
    const col = conn.db.collection('contacts');

    if (action === 'load') {
      const data = await col.find({}, { projection: { _id: 0 } }).toArray();
      return res.status(200).json({ contacts: data });

    } else if (action === 'save') {
      await col.deleteMany({});
      if (contacts && contacts.length > 0) {
        const clean = contacts.map(c => { const { _id, ...rest } = c; return rest; });
        await col.insertMany(clean);
      }
      return res.status(200).json({ ok: true, saved: (contacts||[]).length });

    } else if (action === 'add') {
      const { _id, ...clean } = contact;
      await col.insertOne(clean);
      return res.status(200).json({ ok: true });

    } else {
      return res.status(400).json({ error: 'Acción no reconocida' });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    if (client) await client.close();
  }
}
