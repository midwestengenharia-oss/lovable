import type { FastifyInstance } from 'fastify';
import { getSession } from '../lib/oidc';
import { supabaseAdmin } from '../lib/supabase';

function decodeBase64(input: string): Buffer {
  // Accept plain base64 or data URLs (data:...;base64,....)
  const comma = input.indexOf(',');
  const b64 = input.startsWith('data:') && comma !== -1 ? input.slice(comma + 1) : input;
  return Buffer.from(b64, 'base64');
}

export function registerUploadRoutes(app: FastifyInstance) {
  // Upload a single file via base64 payload
  app.post('/api/upload', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    const bucket = String(body?.bucket || '').trim();
    const filename = String(body?.filename || '').trim();
    const path = String(body?.path || filename).trim();
    const upsert = !!body?.upsert;
    const contentType = typeof body?.contentType === 'string' ? body.contentType : undefined;
    const dataBase64 = String(body?.dataBase64 || '').trim();
    if (!bucket || !filename || !dataBase64) return res.code(400).send({ error: 'invalid_payload' });
    try {
      const buffer = decodeBase64(dataBase64);
      const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, { contentType, upsert });
      if (error) throw error;
      const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
      return res.send({ path, url: pub?.publicUrl || null });
    } catch (e) {
      req.log.error({ err: e }, 'upload_failed');
      return res.code(500).send({ error: 'upload_failed' });
    }
  });

  // Remove one or more objects
  app.post('/api/upload/remove', async (req, res) => {
    const sess = getSession(req);
    if (!sess) return res.code(401).send({ error: 'unauthenticated' });
    const body = req.body as any;
    const bucket = String(body?.bucket || '').trim();
    const paths = Array.isArray(body?.paths) ? body.paths.filter((p: any) => typeof p === 'string' && p.length > 0) : [];
    if (!bucket || paths.length === 0) return res.code(400).send({ error: 'invalid_payload' });
    try {
      const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);
      if (error) throw error;
      return res.code(204).send();
    } catch (e) {
      req.log.error({ err: e }, 'upload_remove_failed');
      return res.code(500).send({ error: 'upload_remove_failed' });
    }
  });
}

