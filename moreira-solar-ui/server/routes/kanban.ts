import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

const BUCKET = 'kanban_uploads';

export function registerKanbanRoutes(app: FastifyInstance) {
  app.get('/api/kanban/boards', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const { data, error } = await supabaseAdmin.from('kanban_board').select('*').order('name');
    if (error) return res.code(500).send({ error: 'boards_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/kanban/boards', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    try {
      if (body.id) {
        const { data, error } = await supabaseAdmin.from('kanban_board').upsert(body).select('*').single();
        if (error) throw error; return res.send(data);
      } else {
        const toInsert = { ...body };
        const { data, error } = await supabaseAdmin.from('kanban_board').insert(toInsert).select('*').single();
        if (error) throw error; return res.code(201).send(data);
      }
    } catch (e) { req.log.error({ err: e }, 'board_upsert_failed'); return res.code(500).send({ error: 'board_upsert_failed' }); }
  });

  app.delete('/api/kanban/boards/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from('kanban_board').delete().eq('id', id);
    if (error) return res.code(500).send({ error: 'board_delete_failed' });
    return res.code(204).send();
  });

  app.get('/api/kanban/columns', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const boardId = (req.query as any)?.boardId as string | undefined;
    if (!boardId) return res.code(400).send({ error: 'boardId_required' });
    const { data, error } = await supabaseAdmin
      .from('kanban_column')
      .select('*')
      .eq('board_id', boardId)
      .order('ord');
    if (error) return res.code(500).send({ error: 'columns_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/kanban/columns', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    try {
      if (body.id) {
        const { data, error } = await supabaseAdmin
          .from('kanban_column')
          .update(body)
          .eq('id', body.id)
          .eq('board_id', body.board_id)
          .select('*')
          .single();
        if (error) throw error; return res.send(data);
      } else {
        const { data: last } = await supabaseAdmin
          .from('kanban_column')
          .select('ord')
          .eq('board_id', body.board_id)
          .order('ord', { ascending: false })
          .limit(1)
          .maybeSingle();
        const ord = (last?.ord ?? 0) + 1;
        const toInsert = { ...body, ord };
        const { data, error } = await supabaseAdmin.from('kanban_column').insert(toInsert).select('*').single();
        if (error) throw error; return res.code(201).send(data);
      }
    } catch (e) { req.log.error({ err: e }, 'column_upsert_failed'); return res.code(500).send({ error: 'column_upsert_failed' }); }
  });

  app.delete('/api/kanban/columns/:id', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from('kanban_column').delete().eq('id', id);
    if (error) return res.code(500).send({ error: 'column_delete_failed' });
    return res.code(204).send();
  });

  app.patch('/api/kanban/columns/order', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as { boardId: string; ids: string[] };
    if (!body?.boardId || !Array.isArray(body.ids)) return res.code(400).send({ error: 'invalid_payload' });
    try {
      for (let i = 0; i < body.ids.length; i++) {
        const id = body.ids[i];
        await supabaseAdmin.from('kanban_column').update({ ord: i + 1 }).eq('id', id).eq('board_id', body.boardId);
      }
      return res.code(204).send();
    } catch (e) { req.log.error({ err: e }, 'columns_order_failed'); return res.code(500).send({ error: 'columns_order_failed' }); }
  });

  app.get('/api/kanban/fields', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const columnId = (req.query as any)?.columnId as string | undefined;
    if (!columnId) return res.code(400).send({ error: 'columnId_required' });
    const { data, error } = await supabaseAdmin
      .from('stage_field')
      .select('*')
      .eq('column_id', columnId)
      .order('ord');
    if (error) return res.code(500).send({ error: 'fields_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/kanban/fields', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    try {
      if (body.id) {
        const { data, error } = await supabaseAdmin
          .from('stage_field')
          .update({
            label: body.label,
            type: body.type,
            required: body.required,
            options: body.options,
            helper: body.helper ?? null,
            active: body.active,
            key: body.key,
            update_patch: body.update_patch ?? null,
          })
          .eq('id', body.id)
          .select('*')
          .single();
        if (error) throw error;
        return res.send(data);
      } else {
        const columnId = body.column_id as string;
        if (!columnId || !body.board_id) return res.code(400).send({ error: 'board_and_column_required' });
        const { data: last } = await supabaseAdmin
          .from('stage_field')
          .select('ord')
          .eq('column_id', columnId)
          .order('ord', { ascending: false })
          .limit(1)
          .maybeSingle();
        const ord = (last?.ord ?? 0) + 1;
        const toInsert = { ...body, ord };
        const { data, error } = await supabaseAdmin.from('stage_field').insert(toInsert).select('*').single();
        if (error) throw error;
        return res.code(201).send(data);
      }
    } catch (e) {
      req.log.error({ err: e }, 'field_upsert_failed');
      return res.code(500).send({ error: 'field_upsert_failed' });
    }
  });

  app.patch('/api/kanban/fields/order', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as { columnId: string; ids: string[] };
    if (!body?.columnId || !Array.isArray(body?.ids)) return res.code(400).send({ error: 'invalid_payload' });
    try {
      for (let i = 0; i < body.ids.length; i++) {
        const id = body.ids[i];
        await supabaseAdmin.from('stage_field').update({ ord: i + 1 }).eq('id', id);
      }
      return res.code(204).send();
    } catch (e) {
      req.log.error({ err: e }, 'order_update_failed');
      return res.code(500).send({ error: 'order_update_failed' });
    }
  });

  app.delete('/api/kanban/fields/:id', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const id = (req.params as any).id as string;
    try {
      const { data: field, error: fErr } = await supabaseAdmin.from('stage_field').select('*').eq('id', id).single();
      if (fErr) return res.code(404).send({ error: 'not_found' });

      const { data: values, error: vErr } = await supabaseAdmin
        .from('stage_value')
        .select('project_id,field_id,value')
        .eq('field_id', id);
      if (vErr) throw vErr;

      if (field?.type === 'file' && Array.isArray(values) && values.length > 0) {
        const keys = new Set<string>();
        const extractKeyFromUrl = (url: string): string | null => {
          try {
            const u = new URL(url);
            const p = u.pathname;
            const m1 = `/object/public/${BUCKET}/`;
            const m2 = `/object/sign/${BUCKET}/`;
            if (p.includes(m1)) return p.split(m1)[1] || null;
            if (p.includes(m2)) return (p.split(m2)[1] || '').split('?')[0] || null;
            const m3 = `/${BUCKET}/`;
            if (p.includes(m3)) return p.split(m3)[1] || null;
            return null;
          } catch {
            return null;
          }
        };
        const collect = (v: any) => {
          if (!v) return;
          if (typeof v === 'string') {
            const key = extractKeyFromUrl(v);
            keys.add((key || v).trim());
          } else if (typeof v === 'object') {
            const path = typeof v.path === 'string' ? v.path.trim() : null;
            const url = typeof v.url === 'string' ? v.url.trim() : null;
            if (path) keys.add(path);
            else if (url) {
              const k = extractKeyFromUrl(url);
              if (k) keys.add(k);
            }
          }
        };
        for (const row of values as any[]) {
          if (Array.isArray(row.value)) row.value.forEach(collect);
          else collect(row.value);
        }
        const list = Array.from(keys).filter((k) => typeof k === 'string' && k.length > 0);
        if (list.length > 0) await supabaseAdmin.storage.from(BUCKET).remove(list);
      }

      const { error: dValErr } = await supabaseAdmin.from('stage_value').delete().eq('field_id', id);
      if (dValErr) throw dValErr;
      const { error: dFieldErr } = await supabaseAdmin.from('stage_field').delete().eq('id', id);
      if (dFieldErr) throw dFieldErr;
      return res.code(204).send();
    } catch (e) {
      req.log.error({ err: e }, 'field_delete_failed');
      return res.code(500).send({ error: 'field_delete_failed' });
    }
  });

  app.get('/api/kanban/transitions', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const boardId = (req.query as any)?.boardId as string | undefined;
    if (!boardId) return res.code(400).send({ error: 'boardId_required' });
    const { data, error } = await supabaseAdmin.from('kanban_transition').select('*').eq('board_id', boardId);
    if (error) return res.code(500).send({ error: 'transitions_query_failed' });
    return res.send(data || []);
  });

  app.post('/api/kanban/transitions', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as { board_id: string; from_column_id: string; to_column_id: string };
    const { error } = await supabaseAdmin.from('kanban_transition').insert(body);
    if (error) return res.code(500).send({ error: 'transition_create_failed' });
    return res.code(201).send();
  });

  app.delete('/api/kanban/transitions', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const q = req.query as any;
    const { error } = await supabaseAdmin
      .from('kanban_transition')
      .delete()
      .match({ board_id: q.boardId, from_column_id: q.from, to_column_id: q.to });
    if (error) return res.code(500).send({ error: 'transition_delete_failed' });
    return res.code(204).send();
  });

  // Transições a partir de uma coluna: retorna as colunas de destino
  app.get('/api/kanban/transitions-from', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const q = req.query as any;
    const from = q.from || q.fromColumnId;
    if (!from) return res.code(400).send({ error: 'from_required' });
    try {
      const { data, error } = await supabaseAdmin
        .from('kanban_transition')
        .select('to:to_column_id ( id, title, key )')
        .eq('from_column_id', String(from));
      if (error) throw error;
      const cols = (data || []).map((t: any) => t.to).filter(Boolean);
      return res.send(cols);
    } catch (e) {
      req.log.error({ err: e }, 'transitions_from_failed');
      return res.code(500).send({ error: 'transitions_from_failed' });
    }
  });

  // Stage values (ler/salvar valores do formulário da fase)
  app.get('/api/stage/values', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const q = req.query as any;
    const projectId = q.projectId || q.projetoId;
    const fieldIds = typeof q.fieldIds === 'string' ? String(q.fieldIds).split(',').filter(Boolean) : [];
    if (!projectId || fieldIds.length === 0) return res.code(400).send({ error: 'invalid_query' });
    try {
      const { data, error } = await supabaseAdmin
        .from('stage_value')
        .select('*')
        .eq('project_id', projectId)
        .in('field_id', fieldIds);
      if (error) throw error;
      return res.send(data || []);
    } catch (e) {
      req.log.error({ err: e }, 'stage_values_query_failed');
      return res.code(500).send({ error: 'stage_values_query_failed' });
    }
  });

  app.post('/api/stage/values', async (req, res) => {
    const sess = getSession(req); if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as { projectId: string; items: { field_id: string; value: any }[] };
    if (!body?.projectId || !Array.isArray(body.items)) return res.code(400).send({ error: 'invalid_payload' });
    const projectId = body.projectId;
    const rows = body.items.map((it) => ({ project_id: projectId, field_id: it.field_id, value: it.value }));
    try {
      const { error } = await supabaseAdmin.from('stage_value').upsert(rows);
      if (error) throw error;
      // registra evento de formulário (simples)
      try {
        await supabaseAdmin.from('projeto_event').insert({
          projeto_id: projectId,
          type: 'form',
          message: 'Atualizou campos da fase',
          created_at: new Date().toISOString(),
          user_id: sess.sub,
        });
      } catch {}
      return res.code(204).send();
    } catch (e) {
      req.log.error({ err: e }, 'stage_values_upsert_failed');
      return res.code(500).send({ error: 'stage_values_upsert_failed' });
    }
  });
}
