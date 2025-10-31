import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

type Permissao = { modulo: string; visualizar: boolean; criar: boolean; editar: boolean; excluir: boolean };

async function getActor(email: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, perfil')
    .eq('email', email)
    .single();
  if (error) throw error;
  return data as { id: string; perfil: 'admin' | 'gestor' | 'vendedor' };
}

async function isSubordinate(userId: string, gestorId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('gestor_id', gestorId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export function registerPermissoesRoutes(app: FastifyInstance) {
  app.get('/api/permissoes', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const targetUserId = (req.query as any)?.userId as string | undefined;
    try {
      const actor = await getActor(sess.email!);
      const userId = targetUserId || actor.id;
      if (userId !== actor.id) {
        const canAdmin = actor.perfil === 'admin';
        const canGestor = actor.perfil === 'gestor' && (await isSubordinate(userId, actor.id));
        if (!(canAdmin || canGestor)) return res.code(403).send({ error: 'forbidden' });
      }
      const { data, error } = await supabaseAdmin
        .from('permissoes')
        .select('modulo, visualizar, criar, editar, excluir')
        .eq('user_id', userId);
      if (error) throw error;
      return res.send(data || []);
    } catch (e: any) {
      req.log.error({ err: e }, 'permissoes_query_failed');
      return res.code(500).send({ error: 'permissoes_query_failed' });
    }
  });

  app.put('/api/permissoes/:userId', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const userId = (req.params as any).userId as string;
    const body = req.body as { permissoes: Permissao[] };
    try {
      const actor = await getActor(sess.email!);
      const canAdmin = actor.perfil === 'admin';
      const canGestor = actor.perfil === 'gestor' && (await isSubordinate(userId, actor.id));
      const canSelf = userId === actor.id;
      if (!(canAdmin || canGestor || canSelf)) return res.code(403).send({ error: 'forbidden' });

      const rows = (body.permissoes || []).map(p => ({
        user_id: userId,
        modulo: p.modulo,
        visualizar: !!p.visualizar,
        criar: !!p.criar,
        editar: !!p.editar,
        excluir: !!p.excluir,
        updated_at: new Date().toISOString(),
      }));
      // Remove todas as permissões atuais do usuário e insere as novas,
      // evitando dependência de UNIQUE(user_id, modulo)
      const { error: delErr } = await supabaseAdmin.from('permissoes').delete().eq('user_id', userId);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error: insErr } = await supabaseAdmin.from('permissoes').insert(rows);
        if (insErr) throw insErr;
      }
      return res.code(204).send();
    } catch (e: any) {
      req.log.error({ err: e }, 'permissoes_upsert_failed');
      return res.code(500).send({ error: 'permissoes_upsert_failed' });
    }
  });
}
