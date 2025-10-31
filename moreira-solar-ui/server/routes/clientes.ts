import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export function registerClientesRoutes(app: FastifyInstance) {
  // Login do cliente (sessão baseada em cookie)
  app.post('/api/clientes/login', async (req, res) => {
    try {
      const body = req.body as { email?: string; password?: string };
      const email = (body?.email || '').toLowerCase().trim();
      const password = String(body?.password || '');
      if (!email || !password) return res.code(400).send({ error: 'invalid_payload' });

      const { data: cliente, error } = await supabaseAdmin
        .from('clientes')
        .select('id, nome, email, senha, convite_aceito')
        .ilike('email', email)
        .maybeSingle();
      if (error) throw error;
      if (!cliente) return res.code(401).send({ error: 'invalid_credentials' });
      if (!cliente.convite_aceito) return res.code(400).send({ error: 'invitation_pending' });
      const ok = await bcrypt.compare(password, cliente.senha as string);
      if (!ok) return res.code(401).send({ error: 'invalid_credentials' });

      // Cria sessão como 'cliente'
      const { createSession } = await import('../lib/oidc');
      createSession(res as any, { sub: cliente.id, email: cliente.email, name: cliente.nome, roles: ['cliente'] });
      return res.send({ ok: true, cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email } });
    } catch (e: any) {
      req.log.error({ err: e }, 'cliente_login_failed');
      return res.code(500).send({ error: 'cliente_login_failed' });
    }
  });

  // Dados do cliente logado
  app.get('/api/clientes/me', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .select('id, nome, email, telefone, convite_aceito, created_at')
        .eq('id', sess.sub)
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.code(404).send({ error: 'not_found' });
      return res.send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'cliente_me_failed');
      return res.code(500).send({ error: 'cliente_me_failed' });
    }
  });
  // Convite: buscar cliente por token (sem sessão)
  app.get('/api/clientes/convite/:token', async (req, res) => {
    const token = decodeURIComponent((req.params as any).token as string);
    try {
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .select('*')
        .eq('convite_token', token)
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.code(404).send({ error: 'not_found' });
      return res.send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'cliente_convite_query_failed');
      return res.code(500).send({ error: 'cliente_convite_query_failed' });
    }
  });

  // Convite: aceitar e definir senha (sem sessão)
  app.post('/api/clientes/convite/:token/aceitar', async (req, res) => {
    const token = decodeURIComponent((req.params as any).token as string);
    const body = req.body as { password: string };
    if (!body?.password || body.password.length < 6) return res.code(400).send({ error: 'invalid_password' });
    try {
      const { data: cli, error: cErr } = await supabaseAdmin
        .from('clientes')
        .select('id, convite_expira_em, convite_aceito')
        .eq('convite_token', token)
        .maybeSingle();
      if (cErr) throw cErr;
      if (!cli) return res.code(404).send({ error: 'not_found' });
      if (cli.convite_aceito) return res.code(400).send({ error: 'already_accepted' });
      if (cli.convite_expira_em && new Date() > new Date(cli.convite_expira_em)) return res.code(400).send({ error: 'expired' });

      const hash = await bcrypt.hash(body.password, 10);
      const updates = {
        senha: hash,
        convite_aceito: true,
        convite_token: null,
        convite_expira_em: null,
      } as any;
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .update(updates)
        .eq('id', cli.id)
        .select('*')
        .single();
      if (error) throw error;
      return res.send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'cliente_convite_accept_failed');
      return res.code(500).send({ error: 'cliente_convite_accept_failed' });
    }
  });
  // Detalhe do cliente por id (nome/user_id e mais)
  app.get('/api/clientes/:id', async (req, res) => {
    const id = (req.params as any).id as string;
    try {
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.code(404).send({ error: 'not_found' });
      return res.send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'cliente_detail_failed');
      return res.code(500).send({ error: 'cliente_detail_failed' });
    }
  });
  // Lista clientes do usuário (admin vê todos; gestor vê os seus e dos vendedores subordinados)
  app.get('/api/clientes', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      // perfil do ator
      const { data: me, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .single();
      if (meErr) throw meErr;

      // Monta lista de user_ids visíveis
      const visibleUserIds: string[] = [me.id];
      if (me.perfil === 'admin') {
        // admin vê todos: sem filtro
        const { data, error } = await supabaseAdmin
          .from('clientes')
          .select('*')
          .order('data_cadastro', { ascending: false });
        if (error) throw error;
        return res.send(data || []);
      }
      if (me.perfil === 'gestor') {
        const { data: subs, error: subsErr } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('gestor_id', me.id);
        if (subsErr) throw subsErr;
        for (const s of subs || []) visibleUserIds.push(s.id);
      }
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .select('*')
        .in('user_id', visibleUserIds)
        .order('data_cadastro', { ascending: false });
      if (error) throw error;
      return res.send(data || []);
    } catch (e: any) {
      req.log.error({ err: e }, 'clientes_query_failed');
      return res.code(500).send({ error: 'clientes_query_failed' });
    }
  });

  app.post('/api/clientes', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const { data: me, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .single();
      if (meErr) throw meErr;

      const body = req.body as any;
      const insert = { ...body, user_id: me.id };
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .insert(insert)
        .select('*')
        .single();
      if (error) throw error;
      return res.code(201).send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'clientes_create_failed');
      return res.code(500).send({ error: 'clientes_create_failed' });
    }
  });

  app.patch('/api/clientes/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const { data: me, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .single();
      if (meErr) throw meErr;

      const { data: target, error: tErr } = await supabaseAdmin
        .from('clientes')
        .select('id, user_id')
        .eq('id', id)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!target) return res.code(404).send({ error: 'not_found' });

      const canAdmin = me.perfil === 'admin';
      let canGestorOver = false;
      if (me.perfil === 'gestor') {
        if (target.user_id === me.id) canGestorOver = true;
        else {
          const { data: tProf, error: tProfErr } = await supabaseAdmin
            .from('profiles')
            .select('gestor_id')
            .eq('id', target.user_id)
            .maybeSingle();
          if (tProfErr) throw tProfErr;
          canGestorOver = tProf?.gestor_id === me.id;
        }
      }
      const canOwner = target.user_id === me.id;
      if (!(canAdmin || canGestorOver || canOwner)) return res.code(403).send({ error: 'forbidden' });

      const updates = req.body as any;
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return res.send(data);
    } catch (e: any) {
      req.log.error({ err: e }, 'clientes_update_failed');
      return res.code(500).send({ error: 'clientes_update_failed' });
    }
  });

  app.delete('/api/clientes/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const { data: me, error: meErr } = await supabaseAdmin
        .from('profiles')
        .select('id, perfil')
        .eq('email', sess.email)
        .single();
      if (meErr) throw meErr;

      const { data: target, error: tErr } = await supabaseAdmin
        .from('clientes')
        .select('id, user_id, gestor_id')
        .eq('id', id)
        .single();
      if (tErr) return res.code(404).send({ error: 'not_found' });

      const canAdmin = me.perfil === 'admin';
      const canGestorOver = me.perfil === 'gestor' && (target.user_id === me.id || target.gestor_id === me.id);
      const canOwner = target.user_id === me.id;
      if (!(canAdmin || canGestorOver || canOwner)) return res.code(403).send({ error: 'forbidden' });

      const { error } = await supabaseAdmin.from('clientes').delete().eq('id', id);
      if (error) throw error;
      return res.code(204).send();
    } catch (e: any) {
      req.log.error({ err: e }, 'clientes_delete_failed');
      return res.code(500).send({ error: 'clientes_delete_failed' });
    }
  });

  // Alterar senha do cliente logado
  app.post('/api/clientes/password', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    try {
      const body = req.body as { current_password?: string; new_password?: string };
      const current = String(body?.current_password || '');
      const next = String(body?.new_password || '');
      if (!current || !next || next.length < 6) return res.code(400).send({ error: 'invalid_payload' });

      const { data: cli, error: cErr } = await supabaseAdmin
        .from('clientes')
        .select('id, senha')
        .eq('id', sess.sub)
        .maybeSingle();
      if (cErr) throw cErr;
      if (!cli) return res.code(404).send({ error: 'not_found' });

      const ok = await bcrypt.compare(current, (cli as any).senha || '');
      if (!ok) return res.code(401).send({ error: 'invalid_credentials' });

      const hash = await bcrypt.hash(next, 10);
      const { error: uErr } = await supabaseAdmin
        .from('clientes')
        .update({ senha: hash })
        .eq('id', sess.sub);
      if (uErr) throw uErr;
      return res.send({ ok: true });
    } catch (e: any) {
      req.log.error({ err: e }, 'cliente_password_change_failed');
      return res.code(500).send({ error: 'cliente_password_change_failed' });
    }
  });
}
