// api/contacts.js — Vercel Serverless Function con MongoDB
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;

async function getDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db('menteactiva');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { action, contacts, contact, id } = req.body;

  try {
    const db = await getDB();
    const col = db.collection('contacts');

    if (action === 'load') {
      const data = await col.find({}).toArray();
      return res.status(200).json({ contacts: data });

    } else if (action === 'save') {
      // Guardar lista completa (reemplazar todo)
      await col.deleteMany({});
      if (contacts && contacts.length > 0) {
        await col.insertMany(contacts);
      }
      return res.status(200).json({ ok: true, saved: (contacts||[]).length });

    } else if (action === 'add') {
      const result = await col.insertOne(contact);
      return res.status(200).json({ ok: true, id: result.insertedId });

    } else if (action === 'delete') {
      const { ObjectId } = await import('mongodb');
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });

    } else {
      return res.status(400).json({ error: 'Acción no reconocida' });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
