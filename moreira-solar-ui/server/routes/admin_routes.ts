import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';
import { env } from '../lib/env';
import bcrypt from 'bcryptjs';

export function registerAdminRoutes(app: FastifyInstance) {
  // Soft purge: desativa todos usuários e remove senhas locais, mantendo apenas o keepId ativo
  app.post('/api/admin/users/purge', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as { keepId?: string };
    const keepId = body?.keepId as string | undefined;
    if (!keepId) return res.code(400).send({ error: 'keepId_required' });
    try {
      const { data: actor, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!actor || actor.perfil !== 'admin') return res.code(403).send({ error: 'forbidden' });

      const { error: delAuthErr } = await supabaseAdmin
        .from('auth_local_users')
        .delete()
        .neq('id', keepId);
      if (delAuthErr) throw delAuthErr;

      const { error: updErr } = await supabaseAdmin
        .from('profiles')
        .update({ ativo: false })
        .neq('id', keepId);
      if (updErr) throw updErr;

      await supabaseAdmin.from('profiles').update({ ativo: true }).eq('id', keepId);
      try {
        await supabaseAdmin.from('permissoes').delete().neq('user_id', keepId);
      } catch {}

      return res.send({ ok: true });
    } catch (e: any) {
      req.log.error({ err: e }, 'admin_users_purge_failed');
      return res.code(500).send({ error: 'admin_users_purge_failed' });
    }
  });

  // Bootstrap: define senha local para um usuário sem exigir sessão (protegido por segredo)
  app.post('/api/admin/bootstrap/set-password', async (req, res) => {
    try {
      const body = req.body as { id?: string; email?: string; password?: string; secret?: string };
      if (!env.BOOTSTRAP_SECRET) return res.code(400).send({ error: 'bootstrap_secret_missing' });
      if (!body?.secret || body.secret !== env.BOOTSTRAP_SECRET) return res.code(403).send({ error: 'forbidden' });
      const id = String(body?.id || '').trim();
      const email = String(body?.email || '').trim().toLowerCase();
      const password = String(body?.password || '');
      if (!id || !email || !password || password.length < 6) return res.code(400).send({ error: 'invalid_payload' });
      const hash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      const { error: upErr } = await supabaseAdmin
        .from('auth_local_users')
        .upsert({ id, email, password_hash: hash, updated_at: now, created_at: now } as any)
        .select('id')
        .maybeSingle();
      if (upErr) throw upErr;
      await supabaseAdmin.from('profiles').update({ ativo: true }).eq('id', id);
      return res.send({ ok: true });
    } catch (e: any) {
      req.log.error({ err: e }, 'bootstrap_set_password_failed');
      return res.code(500).send({ error: 'bootstrap_set_password_failed' });
    }
  });
}

