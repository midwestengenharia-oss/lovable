import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '4000',
  SESSION_SECRET: required('SESSION_SECRET'),
  APP_BASE_URL: required('APP_BASE_URL'), // e.g. http://localhost:8080
  OIDC_ISSUER_URL: required('OIDC_ISSUER_URL'), // e.g. http://keycloak:8080/realms/myrealm
  OIDC_CLIENT_ID: required('OIDC_CLIENT_ID'),
  OIDC_CLIENT_SECRET: required('OIDC_CLIENT_SECRET'),
  OIDC_REDIRECT_PATH: process.env.OIDC_REDIRECT_PATH || '/api/auth/callback',
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  LOGOUT_REDIRECT_PATH: process.env.LOGOUT_REDIRECT_PATH || '/auth',
  USE_KEYCLOAK: (process.env.USE_KEYCLOAK || 'true').toLowerCase() !== 'false',
  // Keycloak Admin API (criação de usuários via API)
  KEYCLOAK_BASE_URL: process.env.KEYCLOAK_BASE_URL || process.env.OIDC_ISSUER_URL?.replace(/\/realms\/.+$/, '') || '',
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || process.env.OIDC_ISSUER_URL?.split('/realms/')[1] || '',
  KEYCLOAK_TOKEN_REALM: process.env.KEYCLOAK_TOKEN_REALM || '', // opcional: onde está o client admin (ex.: master). Vazio usa KEYCLOAK_REALM
  KEYCLOAK_ADMIN_CLIENT_ID: process.env.KEYCLOAK_ADMIN_CLIENT_ID || '',
  KEYCLOAK_ADMIN_CLIENT_SECRET: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '',
  BOOTSTRAP_SECRET: process.env.BOOTSTRAP_SECRET || '',
};
