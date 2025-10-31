import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

export function registerTitularesRoutes(app: FastifyInstance) {
  app.get('/api/titulares-energia', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('titulares_energia').select('*').order('created_at', { ascending: false });
    if (error) return res.code(500).send({ error: 'titulares_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/titulares-energia', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    const insert = {
      nome: body.nome,
      cpf_cnpj: body.cpfCnpj ?? body.cpf_cnpj,
      email: body.email,
      telefone: body.telefone,
      observacoes: body.observacoes ?? null,
      user_id: sess.sub,
    };
    const { data, error } = await supabaseAdmin.from('titulares_energia').insert(insert).select('*').single();
    if (error) return res.code(500).send({ error: 'titular_create_failed' });
    return res.code(201).send(data);
  });

  app.patch('/api/titulares-energia/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const body = req.body as any;
    const update: any = {};
    if (body.nome !== undefined) update.nome = body.nome;
    if (body.cpfCnpj !== undefined) update.cpf_cnpj = body.cpfCnpj;
    if (body.email !== undefined) update.email = body.email;
    if (body.telefone !== undefined) update.telefone = body.telefone;
    if (body.observacoes !== undefined) update.observacoes = body.observacoes;
    const { data, error } = await supabaseAdmin.from('titulares_energia').update(update).eq('id', id).select('*').single();
    if (error) return res.code(500).send({ error: 'titular_update_failed' });
    return res.send(data);
  });

  app.delete('/api/titulares-energia/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from('titulares_energia').delete().eq('id', id);
    if (error) return res.code(500).send({ error: 'titular_delete_failed' });
    return res.code(204).send();
  });
}

