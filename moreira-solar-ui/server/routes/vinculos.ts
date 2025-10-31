import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

export function registerVinculosRoutes(app: FastifyInstance) {
  app.get('/api/vinculos-compensacao', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('vinculos_compensacao').select('*').order('created_at', { ascending: false });
    if (error) return res.code(500).send({ error: 'vinculos_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/vinculos-compensacao', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    const insert = { ...body, user_id: sess.sub };
    const { data, error } = await supabaseAdmin.from('vinculos_compensacao').insert(insert).select('*').single();
    if (error) return res.code(500).send({ error: 'vinculo_create_failed' });
    return res.code(201).send(data);
  });

  app.patch('/api/vinculos-compensacao/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { data, error } = await supabaseAdmin.from('vinculos_compensacao').update(req.body as any).eq('id', id).select('*').single();
    if (error) return res.code(500).send({ error: 'vinculo_update_failed' });
    return res.send(data);
  });

  app.delete('/api/vinculos-compensacao/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from('vinculos_compensacao').delete().eq('id', id);
    if (error) return res.code(500).send({ error: 'vinculo_delete_failed' });
    return res.code(204).send();
  });
}

