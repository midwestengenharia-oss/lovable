import type { FastifyInstance } from 'fastify';
import { env } from '../lib/env';
import { getSession, createSession, clearSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export function registerAuthLocalRoutes(app: FastifyInstance) {
  // Login local: email + senha
  app.post('/api/auth/login', async (req, res) => {
    try {
      if (env.USE_KEYCLOAK) return res.code(400).send({ error: 'oidc_enabled' });
      const body = req.body as { email?: string; password?: string };
      const email = (body?.email || '').toLowerCase().trim();
      const password = String(body?.password || '');
      if (!email || !password) return res.code(400).send({ error: 'invalid_payload' });

      // Busca hash em auth_local_users
      const { data: authRow, error: aErr } = await supabaseAdmin
        .from('auth_local_users')
        .select('id, email, password_hash')
        .ilike('email', email)
        .maybeSingle();
      if (aErr) throw aErr;
      if (!authRow?.password_hash) return res.code(401).send({ error: 'invalid_credentials' });
      const ok = await bcrypt.compare(password, authRow.password_hash as string);
      if (!ok) return res.code(401).send({ error: 'invalid_credentials' });

      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id, nome, email, perfil')
        .eq('id', authRow.id)
        .maybeSingle();
      if (!prof) return res.code(404).send({ error: 'profile_not_found' });

      createSession(res as any, { sub: prof.id, email: prof.email, name: prof.nome, roles: [prof.perfil] });
      return res.send({ ok: true });
    } catch (e: any) {
      req.log.error({ err: e }, 'local_login_failed');
      return res.code(500).send({ error: 'local_login_failed' });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      clearSession(res as any);
      return res.send({ ok: true });
    } catch {
      return res.send({ ok: true });
    }
  });

  // Alteração de senha (self-service): precisa estar logado e informar senha atual
  app.post('/api/auth/password', async (req, res) => {
    try {
      if (env.USE_KEYCLOAK) return res.code(400).send({ error: 'oidc_enabled' });
      const sess = getSession(req);
      if (!sess?.sub) return res.code(401).send({ error: 'unauthenticated' });
      const body = req.body as { currentPassword?: string; newPassword?: string };
      const currentPassword = String(body?.currentPassword || '');
      const newPassword = String(body?.newPassword || '');
      if (!currentPassword || !newPassword || newPassword.length < 6) return res.code(400).send({ error: 'invalid_payload' });

      const { data: row, error } = await supabaseAdmin
        .from('auth_local_users')
        .select('password_hash')
        .eq('id', sess.sub)
        .maybeSingle();
      if (error) throw error;
      if (!row?.password_hash) return res.code(400).send({ error: 'no_local_password' });
      const ok = await bcrypt.compare(currentPassword, row.password_hash as string);
      if (!ok) return res.code(401).send({ error: 'invalid_current_password' });

      const hash = await bcrypt.hash(newPassword, 10);
      const { error: upErr } = await supabaseAdmin
        .from('auth_local_users')
        .update({ password_hash: hash, updated_at: new Date().toISOString() } as any)
        .eq('id', sess.sub);
      if (upErr) throw upErr;
      return res.send({ ok: true });
    } catch (e: any) {
      req.log.error({ err: e }, 'auth_password_change_failed');
      return res.code(500).send({ error: 'auth_password_change_failed' });
    }
  });

  // Mantém compatibilidade: /api/auth/session já existe em routes/auth.ts
}
