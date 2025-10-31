import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

export function registerVendedoresRoutes(app: FastifyInstance) {
  app.get('/api/vendedores', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('profiles').select('id, nome');
    if (error) return res.code(500).send({ error: 'vendedores_query_failed' });
    return res.send(data || []);
  });
}

