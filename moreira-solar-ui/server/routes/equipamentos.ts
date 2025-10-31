import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

export function registerEquipamentosRoutes(app: FastifyInstance) {
  app.get('/api/equipamentos', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('equipamentos').select('*').order('tipo', { ascending: true });
    if (error) return res.code(500).send({ error: 'equipamentos_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/equipamentos', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    const insert = {
      tipo: body.tipo,
      nome: body.nome,
      potencia_w: body.potenciaW ?? body.potencia_w ?? null,
      valor: body.valor,
      ativo: body.ativo ?? true,
    };
    const { data, error } = await supabaseAdmin.from('equipamentos').insert(insert).select('*').single();
    if (error) return res.code(500).send({ error: 'equipamento_create_failed' });
    return res.code(201).send(data);
  });

  app.patch('/api/equipamentos/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const body = req.body as any;
    const update: any = {};
    if (body.tipo !== undefined) update.tipo = body.tipo;
    if (body.nome !== undefined) update.nome = body.nome;
    if (body.potenciaW !== undefined) update.potencia_w = body.potenciaW;
    if (body.valor !== undefined) update.valor = body.valor;
    if (body.ativo !== undefined) update.ativo = body.ativo;
    const { data, error } = await supabaseAdmin.from('equipamentos').update(update).eq('id', id).select('*').single();
    if (error) return res.code(500).send({ error: 'equipamento_update_failed' });
    return res.send(data);
  });

  app.delete('/api/equipamentos/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from('equipamentos').delete().eq('id', id);
    if (error) return res.code(500).send({ error: 'equipamento_delete_failed' });
    return res.code(204).send();
  });
}

