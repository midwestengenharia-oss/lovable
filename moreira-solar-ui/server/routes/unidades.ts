import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

export function registerUnidadesRoutes(app: FastifyInstance) {
  app.get('/api/unidades-consumidoras', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('unidades_consumidoras').select('*').order('created_at', { ascending: false });
    if (error) return res.code(500).send({ error: 'unidades_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/unidades-consumidoras', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    const insert = {
      numero_instalacao: body.numeroUC,
      titular_id: body.titularId,
      cliente_id: body.clienteId,
      projeto_id: body.projetoId,
      cidade: body.cidade,
      uf: body.uf,
      distribuidora: body.distribuidora,
      grupo: body.grupo,
      classe: body.classe,
      modalidade: body.modalidade,
      ativo: body.ativo ?? true,
      user_id: sess.sub,
    };
    const { data, error } = await supabaseAdmin.from('unidades_consumidoras').insert(insert).select('*').single();
    if (error) return res.code(500).send({ error: 'unidade_create_failed' });
    return res.code(201).send(data);
  });

  app.patch('/api/unidades-consumidoras/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const b = req.body as any;
    const upd: any = {};
    if (b.numeroUC !== undefined) upd.numero_instalacao = b.numeroUC;
    if (b.titularId !== undefined) upd.titular_id = b.titularId;
    if (b.clienteId !== undefined) upd.cliente_id = b.clienteId;
    if (b.projetoId !== undefined) upd.projeto_id = b.projetoId;
    if (b.cidade !== undefined) upd.cidade = b.cidade;
    if (b.uf !== undefined) upd.uf = b.uf;
    if (b.distribuidora !== undefined) upd.distribuidora = b.distribuidora;
    if (b.grupo !== undefined) upd.grupo = b.grupo;
    if (b.classe !== undefined) upd.classe = b.classe;
    if (b.modalidade !== undefined) upd.modalidade = b.modalidade;
    if (b.ativo !== undefined) upd.ativo = b.ativo;
    const { data, error } = await supabaseAdmin.from('unidades_consumidoras').update(upd).eq('id', id).select('*').single();
    if (error) return res.code(500).send({ error: 'unidade_update_failed' });
    return res.send(data);
  });

  app.delete('/api/unidades-consumidoras/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from('unidades_consumidoras').delete().eq('id', id);
    if (error) return res.code(500).send({ error: 'unidade_delete_failed' });
    return res.code(204).send();
  });
}

