import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';
import { getSession } from '../lib/oidc';

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

export function registerChamadosRoutes(app: FastifyInstance) {
  // Staff (SSO) - lista chamados que o ator pode ver
  app.get('/api/chamados', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const actor = await getActor(sess.email!);
      let q = supabaseAdmin.from('chamados').select('*').order('data', { ascending: false });
      if (actor.perfil === 'gestor') {
        const ids = [actor.id, ...(await listSubordinates(actor.id))];
        q = q.in('user_id', ids);
      } else if (actor.perfil === 'vendedor') {
        q = q.eq('user_id', actor.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return res.send(data || []);
    } catch (e) { req.log.error({ err: e }, 'chamados_query_failed'); return res.code(500).send({ error: 'chamados_query_failed' }); }
  });

  app.post('/api/chamados', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const actor = await getActor(sess.email!);
      const body = req.body as any;
      const insert = { ...body, user_id: actor.id };
      const { data, error } = await supabaseAdmin.from('chamados').insert(insert).select('*').single();
      if (error) throw error;
      return res.code(201).send(data);
    } catch (e) { req.log.error({ err: e }, 'chamados_create_failed'); return res.code(500).send({ error: 'chamados_create_failed' }); }
  });

  app.patch('/api/chamados/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const actor = await getActor(sess.email!);
      const { data: target } = await supabaseAdmin.from('chamados').select('id, user_id').eq('id', id).maybeSingle();
      if (!target) return res.code(404).send({ error: 'not_found' });
      let allowed = actor.perfil === 'admin' || target.user_id === actor.id;
      if (!allowed && actor.perfil === 'gestor') {
        const subs = await listSubordinates(actor.id); allowed = subs.includes(target.user_id);
      }
      if (!allowed) return res.code(403).send({ error: 'forbidden' });
      const { data, error } = await supabaseAdmin.from('chamados').update(req.body as any).eq('id', id).select('*').single();
      if (error) throw error; return res.send(data);
    } catch (e) { req.log.error({ err: e }, 'chamados_update_failed'); return res.code(500).send({ error: 'chamados_update_failed' }); }
  });

  app.delete('/api/chamados/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const actor = await getActor(sess.email!);
      const { data: target } = await supabaseAdmin.from('chamados').select('id, user_id').eq('id', id).maybeSingle();
      if (!target) return res.code(404).send({ error: 'not_found' });
      let allowed = actor.perfil === 'admin' || target.user_id === actor.id;
      if (!allowed && actor.perfil === 'gestor') {
        const subs = await listSubordinates(actor.id); allowed = subs.includes(target.user_id);
      }
      if (!allowed) return res.code(403).send({ error: 'forbidden' });
      const { error } = await supabaseAdmin.from('chamados').delete().eq('id', id);
      if (error) throw error; return res.code(204).send();
    } catch (e) { req.log.error({ err: e }, 'chamados_delete_failed'); return res.code(500).send({ error: 'chamados_delete_failed' }); }
  });

  // Endpoints para app do cliente (sem SSO, usando clienteId no payload)
  app.get('/api/cliente/chamados', async (req, res) => {
    const q = req.query as any;
    const clienteId = q?.clienteId as string | undefined;
    if (!clienteId) return res.code(400).send({ error: 'clienteId_required' });
    try {
      const { data, error } = await supabaseAdmin
        .from('chamados')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      if (error) throw error; return res.send(data || []);
    } catch (e) { req.log.error({ err: e }, 'cliente_chamados_query_failed'); return res.code(500).send({ error: 'cliente_chamados_query_failed' }); }
  });

  app.post('/api/cliente/chamados', async (req, res) => {
    const body = req.body as any;
    const clienteId = body?.cliente_id as string | undefined;
    if (!clienteId) return res.code(400).send({ error: 'cliente_id_required' });
    try {
      const { data: cli } = await supabaseAdmin
        .from('clientes')
        .select('id, nome, user_id')
        .eq('id', clienteId)
        .maybeSingle();
      const now = new Date().toISOString();
      const numero = `CH-${new Date().getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
      const insert = {
        numero,
        cliente: cli?.nome || body.cliente || 'Cliente',
        cliente_id: clienteId,
        tipo: body.tipo,
        prioridade: body.prioridade,
        status: 'Chamado',
        substatus: 'Triagem',
        descricao: body.descricao,
        data: now,
        user_id: cli?.user_id || null,
        fotos: Array.isArray(body.fotos) ? body.fotos : [],
        historico: [ { data: now, acao: 'Chamado criado pelo cliente', usuario: cli?.nome || 'Cliente' } ],
      } as any;
      const { data, error } = await supabaseAdmin.from('chamados').insert(insert).select('*').single();
      if (error) throw error; return res.code(201).send(data);
    } catch (e) { req.log.error({ err: e }, 'cliente_chamados_create_failed'); return res.code(500).send({ error: 'cliente_chamados_create_failed' }); }
  });
}

