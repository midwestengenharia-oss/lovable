import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

export function registerIntegracoesRoutes(app: FastifyInstance) {
  app.get('/api/integracoes/logs', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('logs_integracoes').select('*').order('data', { ascending: false });
    if (error) return res.code(500).send({ error: 'logs_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/integracoes/logs', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    const insert = { ...body, user_id: sess.sub };
    const { data, error } = await supabaseAdmin.from('logs_integracoes').insert(insert).select('*').single();
    if (error) return res.code(500).send({ error: 'log_create_failed' });
    return res.code(201).send(data);
  });

  app.delete('/api/integracoes/logs/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from('logs_integracoes').delete().eq('id', id);
    if (error) return res.code(500).send({ error: 'log_delete_failed' });
    return res.code(204).send();
  });
}

