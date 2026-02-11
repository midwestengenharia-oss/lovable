#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

function randSecret(len = 48) {
  // Avoid '$' to prevent compose interpolation warnings on some setups
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_%@#&*';
  return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function ensureEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const examplePath = path.resolve(process.cwd(), '.env.example');
  if (existsSync(envPath)) return;
  let content = '';
  if (existsSync(examplePath)) {
    content = readFileSync(examplePath, 'utf8');
  } else {
    content = '';
  }
  const lines = content.split(/\r?\n/);
  const kv = new Map(lines.filter(Boolean).map(l => {
    const idx = l.indexOf('=');
    if (idx === -1) return [l.trim(), ''];
    return [l.slice(0, idx).trim(), l.slice(idx + 1)];
  }));
  // Defaults for local docker
  kv.set('APP_BASE_URL', 'http://localhost:8080');
  kv.set('SESSION_SECRET', randSecret());
  kv.set('USE_KEYCLOAK', 'false');
  kv.set('OIDC_REDIRECT_PATH', '/api/auth/callback');
  if (!kv.get('BOOTSTRAP_SECRET') || !kv.get('BOOTSTRAP_SECRET')?.trim()) {
    kv.set('BOOTSTRAP_SECRET', randSecret(40));
  }
  // Keep placeholders for Supabase if not present
  if (!kv.get('SUPABASE_URL')) kv.set('SUPABASE_URL', 'https://YOUR-PROJECT.supabase.co');
  if (!kv.get('SUPABASE_SERVICE_ROLE_KEY')) kv.set('SUPABASE_SERVICE_ROLE_KEY', 'YOUR_SERVICE_ROLE_KEY');
  if (!kv.get('OIDC_ISSUER_URL')) kv.set('OIDC_ISSUER_URL', 'http://placeholder/issuer');
  if (!kv.get('OIDC_CLIENT_ID')) kv.set('OIDC_CLIENT_ID', 'placeholder');
  if (!kv.get('OIDC_CLIENT_SECRET')) kv.set('OIDC_CLIENT_SECRET', 'placeholder');
  if (!kv.get('PORT')) kv.set('PORT', '4000');
  if (!kv.get('LOGOUT_REDIRECT_PATH')) kv.set('LOGOUT_REDIRECT_PATH', '/auth');
  const out = Array.from(kv.entries()).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  writeFileSync(envPath, out, 'utf8');
  console.log('Created .env from defaults');
}

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options });
    child.on('exit', (code) => {
      if (code === 0) resolve(0); else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function waitForHealth(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function openBrowser(url) {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const opener = isWin ? ['cmd', ['/c', 'start', url]] : (isMac ? ['open', [url]] : ['xdg-open', [url]]);
  try { await run(opener[0], opener[1]); } catch {}
}

async function up() {
  ensureEnv();
  const composeArgs = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml', 'up', '-d', '--build', 'web'];
  try {
    await run('docker', composeArgs);
  } catch (e) {
    // fallback to docker-compose (legacy)
    await run('docker-compose', ['-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml', 'up', '-d', '--build', 'web']);
  }

  const ok = await waitForHealth('http://localhost:8080/api/health', 90000);
  if (!ok) {
    console.log('Aguardando serviços... não respondeu a tempo. Acesse http://localhost:8080');
  } else {
    console.log('Serviços no ar: http://localhost:8080');
  }

  // Avisos úteis
  const envTxt = readFileSync('.env', 'utf8');
  const hasPlaceholder = envTxt.includes('YOUR-PROJECT.supabase.co') || envTxt.includes('YOUR_SERVICE_ROLE_KEY');
  if (hasPlaceholder) {
    console.warn('\nAtenção: SUPABASE_URL/SERVICE_ROLE_KEY estão como placeholder. Login e dados não funcionarão até configurar.');
  }

  // Abre o navegador (best-effort)
  openBrowser('http://localhost:8080');
}

up();
