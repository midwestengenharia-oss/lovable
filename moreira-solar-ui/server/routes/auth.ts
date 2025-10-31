import type { FastifyInstance } from 'fastify';
import { env } from '../lib/env';
import { clearSession, completeLogin, createSession, getSession, startLogin, buildEndSessionUrl } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

// Simple in-memory PKCE store keyed by state (dev-only). Use Redis in prod.
const pkceStore = new Map<string, { code_verifier: string; nonce: string; exp: number }>();
const PKCE_TTL_MS = 10 * 60 * 1000; // 10 min

export function registerAuthRoutes(app: FastifyInstance) {
  app.get('/api/auth/login', async (req, res) => {
    try {
      const { authUrl, state, nonce, code_verifier } = await startLogin(app);
      pkceStore.set(state, { code_verifier, nonce, exp: Date.now() + PKCE_TTL_MS });
      // Lazy cleanup
      for (const [k, v] of pkceStore) if (Date.now() > v.exp) pkceStore.delete(k);
      return res.redirect(authUrl);
    } catch (e: any) {
      app.log.error({ err: e }, 'auth_init_failed');
      return res.code(500).send({ error: 'auth_init_failed', detail: process.env.NODE_ENV !== 'production' ? String(e?.message || e) : undefined });
    }
  });

  app.get('/api/auth/callback', async (req, res) => {
    try {
      const params = req.query as any;
      const state: string | undefined = params?.state;
      if (!params || !params.code || !state) return res.code(400).send({ error: 'invalid_callback' });
      const pkce = pkceStore.get(state);
      if (!pkce) return res.code(400).send({ error: 'invalid_callback' });
      pkceStore.delete(state);
      const session = await completeLogin(params, { code_verifier: pkce.code_verifier, state, nonce: pkce.nonce });
      createSession(res, session);
      return res.redirect(env.APP_BASE_URL);
    } catch (e) {
      app.log.error({ err: e }, 'auth_callback_failed');
      return res.code(500).send({ error: 'auth_callback_failed' });
    }
  });

  app.get('/api/auth/logout', async (req, res) => {
    try {
      const sess = getSession(req);
      const q = req.query as any;
      const desired = typeof q?.redirect === 'string' && q.redirect.startsWith('/') ? q.redirect : env.LOGOUT_REDIRECT_PATH;
      const redirectTo = new URL(desired, env.APP_BASE_URL).toString();
      const endUrl = await buildEndSessionUrl(redirectTo, sess?.id_token);
      clearSession(res);
      if (endUrl) return res.redirect(endUrl);
      return res.redirect(redirectTo);
    } catch (e) {
      clearSession(res);
      const q = req.query as any;
      const desired = typeof q?.redirect === 'string' && q.redirect.startsWith('/') ? q.redirect : env.LOGOUT_REDIRECT_PATH;
      const redirectTo = new URL(desired, env.APP_BASE_URL).toString();
      return res.redirect(redirectTo);
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ authenticated: false });
    return res.send({ authenticated: true, user: { sub: sess.sub, name: sess.name, email: sess.email, roles: sess.roles } });
  });

  // Debug endpoint (dev only): checks env presence
  app.get('/api/auth/debug', async (_req, res) => {
    const have = {
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      APP_BASE_URL: !!process.env.APP_BASE_URL,
      OIDC_ISSUER_URL: !!process.env.OIDC_ISSUER_URL,
      OIDC_CLIENT_ID: !!process.env.OIDC_CLIENT_ID,
      OIDC_CLIENT_SECRET: !!process.env.OIDC_CLIENT_SECRET,
    };
    return res.send({ ok: true, have });
  });

  // Convenience: current profile for front-end
  app.get('/api/me', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const email = sess.email;
    try {
      if (!email) return res.code(404).send({ error: 'email_not_found' });
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, nome, email, perfil, ativo, gestor_id')
        .eq('email', email)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // opcional: auto-provisionar com perfil vendedor
        const now = new Date().toISOString();
        const insert = {
          id: sess.sub,
          nome: sess.name || 'Usuário',
          email,
          perfil: 'vendedor',
          ativo: true,
          gestor_id: null,
          created_at: now,
          updated_at: now,
        } as any;
        const { data: created, error: insErr } = await supabaseAdmin.from('profiles').insert(insert).select('id, nome, email, perfil, ativo, gestor_id').single();
        if (insErr) throw insErr;
        return res.send({ ...created });
      }
      // normaliza campos para o front
      const me = { id: data.id, nome: data.nome, email: data.email, perfil: data.perfil, ativo: data.ativo, gestor_id: data.gestor_id };
      return res.send(me);
    } catch (e: any) {
      req.log.error({ err: e }, 'me_query_failed');
      return res.code(500).send({ error: 'me_query_failed' });
    }
  });
}
