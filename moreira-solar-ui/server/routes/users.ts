import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../lib/env';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

type Perfil = 'admin' | 'gestor' | 'vendedor';

export function registerUserRoutes(app: FastifyInstance) {
  app.post('/api/usuarios', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const body = req.body as {
        nome: string;
        email: string;
        perfil: Perfil;
        gestorId?: string | null;
        ativo?: boolean;
      };
      if (!body?.nome || !body?.email || !body?.perfil) {
        return res.code(400).send({ error: 'invalid_payload' });
      }

      // Only admin can create any. Gestor can create vendedor under themselves.
      const { data: actor, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!actor) {
        return res.code(403).send({ error: 'actor_not_found' });
      }

      const isAdmin = actor.perfil === 'admin';
      const isGestor = actor.perfil === 'gestor';
      if (!isAdmin && !(isGestor && body.perfil === 'vendedor')) {
        return res.code(403).send({ error: 'forbidden' });
      }

      // prevent duplicate emails
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', body.email)
        .maybeSingle();
      if (existing?.id) {
        return res.code(409).send({ error: 'email_in_use', id: existing.id });
      }

      const now = new Date().toISOString();
      // 1) Determina id do usuário
      let targetId: string;
      if (!env.USE_KEYCLOAK) {
        targetId = randomUUID();
      } else {
        // SSO path (não utilizado quando USE_KEYCLOAK=false). Fallback seguro.
        targetId = randomUUID();
      }

      // 2) Cria o profile com o id do usuário
      const insert: any = {
        id: targetId,
        nome: body.nome,
        email: body.email,
        perfil: body.perfil,
        gestor_id: isGestor ? actor.id : body.gestorId || null,
        ativo: body.ativo ?? true,
        created_at: now,
        updated_at: now,
      };
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert(insert)
        .select('id, nome, email, perfil, gestor_id, ativo, created_at, updated_at')
        .single();
      if (error) {
        const msg = String(error?.message || '').toLowerCase();
        if (msg.includes('duplicate')) return res.code(409).send({ error: 'email_in_use' });
        throw error;
      }

      // 3) Se local auth: cria/atualiza hash em auth_local_users
      if (!env.USE_KEYCLOAK) {
        let provided = (req.body as any).password as string | undefined;
        let tempGenerated: string | undefined = undefined;
        if (!provided || provided.length < 6) {
          // gera senha temporária forte (12 chars)
          const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*';
          tempGenerated = Array.from({ length: 12 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
          provided = tempGenerated;
        }
        const hash = await bcrypt.hash(provided!, 10);
        const { error: aErr } = await supabaseAdmin
          .from('auth_local_users')
          .upsert({ id: data.id, email: body.email.toLowerCase(), password_hash: hash, updated_at: now, created_at: now } as any)
          .select('id')
          .maybeSingle();
        if (aErr) req.log.error({ err: aErr }, 'auth_local_upsert_failed');

        // inclui tempPassword na resposta apenas se foi gerada automaticamente
        const response: any = {
          id: data.id,
          nome: data.nome,
          email: data.email,
          perfil: data.perfil as Perfil,
          gestorId: data.gestor_id,
          ativo: data.ativo ?? true,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        if (tempGenerated) response.tempPassword = tempGenerated;
        return res.code(201).send(response);
      }

      return res.code(201).send({
        id: data.id,
        nome: data.nome,
        email: data.email,
        perfil: data.perfil as Perfil,
        gestorId: data.gestor_id,
        ativo: data.ativo ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    } catch (e: any) {
      req.log.error({ err: e }, 'usuarios_create_failed');
      return res.code(500).send({ error: 'usuarios_create_failed' });
    }
  });
  app.get('/api/usuarios', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const { data: me, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!me) return res.code(404).send({ error: 'me_not_found' });

      const selectCols = 'id, nome, email, avatar, perfil, gestor_id, ativo, created_at, updated_at, data_cadastro, ultimo_acesso';
      let rows: any[] = [];

      if (me.perfil === 'admin') {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select(selectCols)
          .order('created_at', { ascending: false });
        if (error) throw error;
        rows = data || [];
      } else if (me.perfil === 'gestor') {
        const { data: subs, error: subsErr } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('gestor_id', me.id);
        if (subsErr) throw subsErr;
        const ids = [me.id, ...((subs || []).map((r: any) => r.id as string))];
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select(selectCols)
          .in('id', ids)
          .order('created_at', { ascending: false });
        if (error) throw error;
        rows = data || [];
      } else {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select(selectCols)
          .eq('id', me.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        rows = data ? (Array.isArray(data) ? data : [data]) : [];
      }

      const mapped = rows.map((u: any) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        avatar: u.avatar,
        perfil: u.perfil as Perfil,
        gestorId: u.gestor_id,
        ativo: u.ativo ?? true,
        dataCadastro: u.data_cadastro,
        ultimoAcesso: u.ultimo_acesso,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      }));
      return res.send(mapped);
    } catch (e: any) {
      req.log.error({ err: e, email: sess.email }, 'usuarios_query_failed');
      return res.code(500).send({ error: 'usuarios_query_failed', detail: process.env.NODE_ENV !== 'production' ? String(e?.message || e) : undefined });
    }
  });

  app.patch('/api/usuarios/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const body = req.body as any;
    try {
      const { data: actor, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .single();
      if (meErr) throw meErr;

      const { data: target, error: tErr } = await supabaseAdmin
        .from('profiles')
        .select('id, gestor_id')
        .eq('id', id)
        .single();
      if (tErr) return res.code(404).send({ error: 'not_found' });

      const canAdmin = actor.perfil === 'admin';
      const canGestorOver = actor.perfil === 'gestor' && (id === actor.id || target.gestor_id === actor.id);
      if (!(canAdmin || canGestorOver)) return res.code(403).send({ error: 'forbidden' });

      const updates: any = {};
      if (body.nome !== undefined) updates.nome = body.nome;
      if (body.email !== undefined) updates.email = body.email;
      if (body.avatar !== undefined) updates.avatar = body.avatar;
      if (body.ativo !== undefined) updates.ativo = body.ativo;
      if (body.ultimoAcesso !== undefined) updates.ultimo_acesso = body.ultimoAcesso;
      if (canAdmin) {
        if (body.perfil !== undefined) updates.perfil = body.perfil;
        if (body.gestorId !== undefined) updates.gestor_id = body.gestorId === '' ? null : body.gestorId;
      }

      const { data: updated, error: uErr } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select('id, nome, email, avatar, perfil, gestor_id, ativo, created_at, updated_at, data_cadastro, ultimo_acesso')
        .single();
      if (uErr) throw uErr;

      const mapped = {
        id: updated.id,
        nome: updated.nome,
        email: updated.email,
        avatar: updated.avatar,
        perfil: updated.perfil as Perfil,
        gestorId: updated.gestor_id,
        ativo: updated.ativo ?? true,
        dataCadastro: updated.data_cadastro,
        ultimoAcesso: updated.ultimo_acesso,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
      return res.send(mapped);
    } catch (e: any) {
      req.log.error({ err: e }, 'usuarios_update_failed');
      return res.code(500).send({ error: 'usuarios_update_failed' });
    }
  });

  // Define/atualiza a senha de um usuário (admin; gestor apenas para seus vendedores)
  app.post('/api/usuarios/:id/password', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    if (env.USE_KEYCLOAK) return res.code(400).send({ error: 'oidc_enabled' });

    const id = (req.params as any).id as string;
    const body = req.body as { password?: string };
    const password = String(body?.password || '');
    if (!password || password.length < 6) return res.code(400).send({ error: 'invalid_password' });

    try {
      const { data: actor, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .single();
      if (meErr) throw meErr;

      const { data: target, error: tErr } = await supabaseAdmin
        .from('profiles')
        .select('id, gestor_id, email')
        .eq('id', id)
        .single();
      if (tErr) return res.code(404).send({ error: 'not_found' });

      const canAdmin = actor.perfil === 'admin';
      const canGestorOver = actor.perfil === 'gestor' && (id === actor.id || target.gestor_id === actor.id);
      if (!(canAdmin || canGestorOver)) return res.code(403).send({ error: 'forbidden' });

      const now = new Date().toISOString();
      const hash = await bcrypt.hash(password, 10);
      const { error: upErr } = await supabaseAdmin
        .from('auth_local_users')
        .upsert({ id, email: (target.email || '').toLowerCase(), password_hash: hash, updated_at: now, created_at: now } as any)
        .select('id')
        .maybeSingle();
      if (upErr) throw upErr;
      return res.code(204).send();
    } catch (e: any) {
      req.log.error({ err: e }, 'usuarios_password_set_failed');
      return res.code(500).send({ error: 'usuarios_password_set_failed' });
    }
  });

  // Update minimal fields for the current user (self-service)
  app.patch('/api/me', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const email = sess.email;
      const allowed = ['nome', 'email', 'avatar', 'ultimoAcesso'] as const;
      const body = req.body as any;
      const updates: any = {};
      for (const k of allowed) {
        if (body[k] !== undefined) {
          if (k === 'ultimoAcesso') updates.ultimo_acesso = body[k];
          else updates[k] = body[k];
        }
      }
      if (Object.keys(updates).length === 0) return res.code(400).send({ error: 'no_updates' });
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('email', email)
        .select('id, nome, email, avatar, perfil, gestor_id, ativo, created_at, updated_at, data_cadastro, ultimo_acesso')
        .single();
      if (error) throw error;
      return res.send(data);
    } catch (e) {
      req.log.error({ err: e }, 'me_update_failed');
      return res.code(500).send({ error: 'me_update_failed' });
    }
  });

  // Busca por email (respeita escopo do ator)
  app.get('/api/usuarios/by-email', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const q = req.query as any;
    const email = (q?.email || '').toString().trim().toLowerCase();
    if (!email) return res.code(400).send({ error: 'email_required' });
    try {
      const { data: actor, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!actor) return res.code(403).send({ error: 'actor_not_found' });

      const { data: target, error: tErr } = await supabaseAdmin
        .from('profiles')
        .select('id, nome, email, avatar, perfil, gestor_id, ativo, created_at, updated_at, data_cadastro, ultimo_acesso')
        .eq('email', email)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!target) return res.code(404).send({ error: 'not_found' });

      const isAdmin = actor.perfil === 'admin';
      const isSelf = target.id === actor.id;
      const isGestorOver = actor.perfil === 'gestor' && target.gestor_id === actor.id;
      if (!(isAdmin || isSelf || isGestorOver)) return res.code(403).send({ error: 'forbidden' });

      return res.send({
        id: target.id,
        nome: target.nome,
        email: target.email,
        avatar: target.avatar,
        perfil: target.perfil as Perfil,
        gestorId: target.gestor_id,
        ativo: target.ativo ?? true,
        dataCadastro: target.data_cadastro,
        ultimoAcesso: target.ultimo_acesso,
        createdAt: target.created_at,
        updatedAt: target.updated_at,
      });
    } catch (e: any) {
      req.log.error({ err: e, email }, 'usuarios_by_email_failed');
      return res.code(500).send({ error: 'usuarios_by_email_failed' });
    }
  });
}


