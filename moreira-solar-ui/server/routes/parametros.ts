import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

export function registerParametrosRoutes(app: FastifyInstance) {
  app.get('/api/parametros', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('parametros').select('*');
    if (error) return res.code(500).send({ error: 'parametros_query_failed' });
    return res.send(data || []);
  });

  // upsert em lote: [{ chave, valor }]
  app.patch('/api/parametros', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const arr = Array.isArray(req.body) ? req.body : [];
    try {
      for (const item of arr) {
        const { error } = await supabaseAdmin
          .from('parametros')
          .upsert({ chave: item.chave, valor: item.valor }, { onConflict: 'chave' });
        if (error) throw error;
      }
      return res.code(204).send();
    } catch (e) {
      req.log.error({ err: e }, 'parametros_update_failed');
      return res.code(500).send({ error: 'parametros_update_failed' });
    }
  });
}

