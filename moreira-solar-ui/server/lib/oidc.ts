import type { FastifyInstance } from 'fastify';
import { Issuer, generators, Client, TokenSet } from 'openid-client';
import { env } from './env';

let clientPromise: Promise<Client> | null = null;

export async function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const issuer = await Issuer.discover(env.OIDC_ISSUER_URL);
        return new issuer.Client({
          client_id: env.OIDC_CLIENT_ID,
          client_secret: env.OIDC_CLIENT_SECRET,
          redirect_uris: [new URL(env.OIDC_REDIRECT_PATH, env.APP_BASE_URL).toString()],
          response_types: ['code'],
          // Keycloak aceita basic e post; post evita problemas com proxies removendo headers
          token_endpoint_auth_method: 'client_secret_post',
        });
      } catch (e: any) {
        const msg = `OIDC discovery failed for ${env.OIDC_ISSUER_URL}: ${e?.message || e}`;
        throw new Error(msg);
      }
    })();
  }
  return clientPromise;
}

export type SessionData = {
  sub: string;
  name?: string;
  email?: string;
  roles?: string[];
  id_token?: string;
};

const cookieName = 'sid';

function isSecureCookie() {
  try {
    const u = new URL(env.APP_BASE_URL);
    return u.protocol === 'https:';
  } catch {
    return true;
  }
}

// naive in-memory session store (replace with Redis in prod)
const store = new Map<string, { data: SessionData; exp: number }>();

function newSid() {
  return generators.random(32);
}

export async function startLogin(app: FastifyInstance) {
  const client = await getClient();
  const state = generators.state();
  const nonce = generators.nonce();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  const authUrl = client.authorizationUrl({
    // Include 'roles' to hint Keycloak to add roles; actual presence depends on mappers
    scope: 'openid profile email roles',
    state,
    nonce,
    code_challenge,
    code_challenge_method: 'S256',
  });

  app.log.debug({ authUrl }, 'Redirecting to IdP');
  return { authUrl, state, nonce, code_verifier };
}

export async function completeLogin(
  params: Record<string, string>,
  checks: { code_verifier: string; state: string; nonce: string }
): Promise<SessionData> {
  const client = await getClient();
  const tokenSet: TokenSet = await client.callback(
    new URL(env.OIDC_REDIRECT_PATH, env.APP_BASE_URL).toString(),
    params,
    { code_verifier: checks.code_verifier, state: checks.state, nonce: checks.nonce }
  );
  const claims = tokenSet.claims();

  // Try to extract roles from access_token (realm_access/resource_access) and from ID token claims
  let roles: string[] = [];
  try {
    const at = tokenSet.access_token as string | undefined;
    if (at) {
      const payloadJson = Buffer.from(at.split('.')[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson);
      const realmRoles: string[] = (payload.realm_access && payload.realm_access.roles) || [];
      const clientRoles: string[] = (payload.resource_access && payload.resource_access[env.OIDC_CLIENT_ID]?.roles) || [];
      roles = Array.from(new Set([...(roles || []), ...realmRoles, ...clientRoles]));
    }
  } catch {
    // ignore parsing errors; fall back to ID token claims
  }
  const idTokenRoles: string[] = (claims['roles'] as string[]) || ((claims['realm_access'] as any)?.roles as string[]) || [];
  roles = Array.from(new Set([...(roles || []), ...idTokenRoles]));

  return {
    sub: String(claims.sub),
    name: claims.name as string | undefined,
    email: claims.email as string | undefined,
    roles,
    id_token: tokenSet.id_token,
  };
}

export function createSession(res: any, data: SessionData) {
  const sid = newSid();
  const ttl = 60 * 60; // 1h
  const exp = Date.now() + ttl * 1000;
  store.set(sid, { data, exp });
  res.setCookie(cookieName, sid, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: ttl,
  });
}

export function getSession(req: any): SessionData | null {
  const sid = req.cookies?.[cookieName];
  if (!sid) return null;
  const entry = store.get(sid);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    store.delete(sid);
    return null;
  }
  return entry.data;
}

export function clearSession(res: any) {
  const sid = res.request?.cookies?.[cookieName];
  if (sid) store.delete(sid);
  res.clearCookie(cookieName, { path: '/' });
}

export async function buildEndSessionUrl(postLogoutRedirectUri: string, idTokenHint?: string): Promise<string | null> {
  const client = await getClient();
  const end = client.issuer.metadata.end_session_endpoint as string | undefined;
  if (!end) return null;
  const u = new URL(end);
  u.searchParams.set('client_id', env.OIDC_CLIENT_ID);
  u.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  if (idTokenHint) u.searchParams.set('id_token_hint', idTokenHint);
  return u.toString();
}
