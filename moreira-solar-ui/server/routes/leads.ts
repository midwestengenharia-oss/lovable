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

export function registerLeadsRoutes(app: FastifyInstance) {
  app.get('/api/leads', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const actor = await getActor(sess.email!);
      if (actor.perfil === 'admin') {
        const { data, error } = await supabaseAdmin
          .from('leads')
          .select('*')
          .order('data', { ascending: false });
        if (error) throw error;
        return res.send(data || []);
      }
      const ids = [actor.id];
      if (actor.perfil === 'gestor') ids.push(...(await listSubordinates(actor.id)));
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .in('user_id', ids)
        .order('data', { ascending: false });
      if (error) throw error;
      return res.send(data || []);
    } catch (e: any) {
      req.log.error({ err: e }, 'leads_query_failed');
      return res.code(500).send({ error: 'leads_query_failed' });
    }
  });

  app.post('/api/leads', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const actor = await getActor(sess.email!);
      const body = req.body as any;
      const { data, error } = await supabaseAdmin
        .from('leads')
        .insert([{ ...body, user_id: actor.id }])
        .select('*')
        .single();
      if (error) throw error;
      return res.code(201).send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'leads_create_failed');
      return res.code(500).send({ error: 'leads_create_failed' });
    }
  });

  app.patch('/api/leads/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const actor = await getActor(sess.email!);
      const { data: target, error: tErr } = await supabaseAdmin
        .from('leads')
        .select('id, user_id')
        .eq('id', id)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!target) return res.code(404).send({ error: 'not_found' });

      let allowed = actor.perfil === 'admin' || target.user_id === actor.id;
      if (!allowed && actor.perfil === 'gestor') {
        const subs = await listSubordinates(actor.id);
        allowed = subs.includes(target.user_id);
      }
      if (!allowed) return res.code(403).send({ error: 'forbidden' });

      const { data, error } = await supabaseAdmin
        .from('leads')
        .update(req.body as any)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return res.send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'leads_update_failed');
      return res.code(500).send({ error: 'leads_update_failed' });
    }
  });

  app.delete('/api/leads/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const actor = await getActor(sess.email!);
      const { data: target, error: tErr } = await supabaseAdmin
        .from('leads')
        .select('id, user_id')
        .eq('id', id)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!target) return res.code(404).send({ error: 'not_found' });

      let allowed = actor.perfil === 'admin' || target.user_id === actor.id;
      if (!allowed && actor.perfil === 'gestor') {
        const subs = await listSubordinates(actor.id);
        allowed = subs.includes(target.user_id);
      }
      if (!allowed) return res.code(403).send({ error: 'forbidden' });

      const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);
      if (error) throw error;
      return res.code(204).send();
    } catch (e: any) {
      req.log.error({ err: e }, 'leads_delete_failed');
      return res.code(500).send({ error: 'leads_delete_failed' });
    }
  });
}

