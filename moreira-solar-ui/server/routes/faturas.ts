import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

async function getActor(email: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, perfil')
    .eq('email', email)
    .single();
  if (error) throw error;
  return data as { id: string; perfil: 'admin' | 'gestor' | 'vendedor' };
}

async function listSubordinates(gestorId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('gestor_id', gestorId);
  if (error) throw error;
  return (data || []).map((r: any) => r.id as string);
}

export function registerFaturasRoutes(app: FastifyInstance) {
  app.get('/api/faturas', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const actor = await getActor(sess.email!);
      const { status, de, ate, page = '1', pageSize = '50' } = req.query as any;
      const p = Math.max(parseInt(page), 1), ps = Math.max(parseInt(pageSize), 1);
      let q = supabaseAdmin.from('faturas').select('*', { count: 'exact' }).order('mes_referencia', { ascending: false });
      if (status) q = q.eq('status', status);
      if (de) q = q.gte('mes_referencia', de);
      if (ate) q = q.lte('mes_referencia', ate);
      if (actor.perfil === 'gestor') {
        const ids = [actor.id, ...(await listSubordinates(actor.id))];
        q = q.in('user_id', ids);
      } else if (actor.perfil === 'vendedor') {
        q = q.eq('user_id', actor.id);
      }
      const { data, error } = await q.range((p - 1) * ps, p * ps - 1);
      if (error) throw error;
      return res.send(data || []);
    } catch (e) { req.log.error({ err: e }, 'faturas_query_failed'); return res.code(500).send({ error: 'faturas_query_failed' }); }
  });
}

