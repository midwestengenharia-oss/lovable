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

export function registerCobrancasRoutes(app: FastifyInstance) {
  app.get('/api/cobrancas', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const roles = Array.isArray((sess as any).roles) ? (sess as any).roles : [];
      if (roles.includes('cliente')) {
        const { status, de, ate } = req.query as any;
        let q = supabaseAdmin.from('cobrancas').select('*').eq('cliente_id', sess.sub).order('vencimento', { ascending: true });
        if (status) q = q.eq('status', status);
        if (de) q = q.gte('vencimento', de);
        if (ate) q = q.lte('vencimento', ate);
        const { data, error } = await q;
        if (error) throw error;
        return res.send(data || []);
      }
      const actor = await getActor(sess.email!);
      const { status, de, ate } = req.query as any;
      let q = supabaseAdmin.from('cobrancas').select('*').order('vencimento', { ascending: true });
      if (status) q = q.eq('status', status);
      if (de) q = q.gte('vencimento', de);
      if (ate) q = q.lte('vencimento', ate);
      if (actor.perfil === 'gestor') {
        const ids = [actor.id, ...(await listSubordinates(actor.id))];
        q = q.in('user_id', ids);
      } else if (actor.perfil === 'vendedor') {
        q = q.eq('user_id', actor.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return res.send(data || []);
    } catch (e) { req.log.error({ err: e }, 'cobrancas_query_failed'); return res.code(500).send({ error: 'cobrancas_query_failed' }); }
  });

  app.patch('/api/cobrancas/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const roles = Array.isArray((sess as any).roles) ? (sess as any).roles : [];
      if (roles.includes('cliente')) {
        const { status, de, ate } = req.query as any;
        let q = supabaseAdmin.from('cobrancas').select('*').eq('cliente_id', sess.sub).order('vencimento', { ascending: true });
        if (status) q = q.eq('status', status);
        if (de) q = q.gte('vencimento', de);
        if (ate) q = q.lte('vencimento', ate);
        const { data, error } = await q;
        if (error) throw error;
        return res.send(data || []);
      }
      const actor = await getActor(sess.email!);
      const { data: target } = await supabaseAdmin.from('cobrancas').select('id, user_id').eq('id', id).maybeSingle();
      if (!target) return res.code(404).send({ error: 'not_found' });
      let allowed = actor.perfil === 'admin' || target.user_id === actor.id;
      if (!allowed && actor.perfil === 'gestor') {
        const subs = await listSubordinates(actor.id); allowed = subs.includes(target.user_id);
      }
      if (!allowed) return res.code(403).send({ error: 'forbidden' });
      const { data, error } = await supabaseAdmin.from('cobrancas').update(req.body as any).eq('id', id).select('*').single();
      if (error) throw error; return res.send(data);
    } catch (e) { req.log.error({ err: e }, 'cobrancas_update_failed'); return res.code(500).send({ error: 'cobrancas_update_failed' }); }
  });
}


