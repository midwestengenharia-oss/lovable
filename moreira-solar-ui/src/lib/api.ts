export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: any; status: number };

async function handle<T>(res: Response): Promise<ApiResult<T>> {
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (res.ok) return { ok: true, data: (isJson ? body : ({} as any)) as T };
  return { ok: false, error: body, status: res.status };
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const res = await fetch(path, { credentials: 'include' });
  return handle<T>(res);
}

export async function apiPost<T>(path: string, payload?: any): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  return handle<T>(res);
}

