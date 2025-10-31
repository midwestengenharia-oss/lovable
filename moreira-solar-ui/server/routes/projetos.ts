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

export function registerProjetosRoutes(app: FastifyInstance) {
  app.get('/api/projetos', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const roles = Array.isArray((sess as any).roles) ? (sess as any).roles : [];
      if (roles.includes('cliente')) {
        const { status } = req.query as any;
        let q = supabaseAdmin.from('projetos').select('*').eq('cliente_id', sess.sub).order('created_at', { ascending: false });
        if (status) q = q.eq('status', status);
        const { data, error } = await q;
        if (error) throw error;
        return res.send(data || []);
      }
      const actor = await getActor(sess.email!);
      if (actor.perfil === 'admin') {
        const { data, error } = await supabaseAdmin
          .from('projetos')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return res.send(data || []);
      }
      const ids = [actor.id];
      if (actor.perfil === 'gestor') ids.push(...(await listSubordinates(actor.id)));
      const { data, error } = await supabaseAdmin
        .from('projetos')
        .select('*')
        .in('user_id', ids)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.send(data || []);
    } catch (e: any) {
      req.log.error({ err: e }, 'projetos_query_failed');
      return res.code(500).send({ error: 'projetos_query_failed' });
    }
  });

  app.post('/api/projetos', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const actor = await getActor(sess.email!);
      const body = req.body as any;
      const { data, error } = await supabaseAdmin
        .from('projetos')
        .insert([{ ...body, user_id: actor.id }])
        .select('*')
        .single();
      if (error) throw error;
      return res.code(201).send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'projetos_create_failed');
      return res.code(500).send({ error: 'projetos_create_failed' });
    }
  });

  app.patch('/api/projetos/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const actor = await getActor(sess.email!);
      const { data: target, error: tErr } = await supabaseAdmin
        .from('projetos')
        .select('id, user_id, kanban_column_id')
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
        .from('projetos')
        .update(req.body as any)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      // registra evento de movimentação quando mudar de coluna
      if ((req.body as any)?.kanban_column_id && (req.body as any).kanban_column_id !== target.kanban_column_id) {
        try {
          await supabaseAdmin.from('projeto_event').insert({
            projeto_id: id,
            type: 'move',
            from_column_id: target.kanban_column_id,
            to_column_id: (req.body as any).kanban_column_id,
            created_at: new Date().toISOString(),
            user_id: actor.id,
          });
        } catch {}
      }
      return res.send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'projetos_update_failed');
      return res.code(500).send({ error: 'projetos_update_failed' });
    }
  });

  app.delete('/api/projetos/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const actor = await getActor(sess.email!);
      const { data: target, error: tErr } = await supabaseAdmin
        .from('projetos')
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

      const { error } = await supabaseAdmin.from('projetos').delete().eq('id', id);
      if (error) throw error;
      return res.code(204).send();
    } catch (e: any) {
      req.log.error({ err: e }, 'projetos_delete_failed');
      return res.code(500).send({ error: 'projetos_delete_failed' });
    }
  });

  // Histórico de eventos do projeto (movimentos/atualizações/arquivos)
  app.get('/api/projetos/:id/historico', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const { data, error } = await supabaseAdmin
        .from('projeto_event')
        .select('*, from:from_column_id(title), to:to_column_id(title)')
        .eq('projeto_id', id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return res.send(data || []);
    } catch (e: any) {
      req.log.error({ err: e }, 'projeto_historico_failed');
      return res.code(500).send({ error: 'projeto_historico_failed' });
    }
  });
}
