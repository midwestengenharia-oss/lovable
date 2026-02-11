#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

function randSecret(len = 48) {
  // Avoid '$' to prevent compose interpolation warnings on some setups
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_%@#&*';
  return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function ensureEnvProd(domainArg) {
  const envPath = path.resolve(process.cwd(), '.env.prod');
  const examplePath = path.resolve(process.cwd(), '.env.example');
  let kv = new Map();
  if (existsSync(examplePath)) {
    const content = readFileSync(examplePath, 'utf8');
    kv = new Map(content.split(/\r?\n/).filter(Boolean).map(l => {
      const idx = l.indexOf('=');
      if (idx === -1) return [l.trim(), ''];
      return [l.slice(0, idx).trim(), l.slice(idx + 1)];
    }));
  }

  const domain = (domainArg && domainArg.trim()) || process.env.APP_DOMAIN || 'app.moreirasolar.com';
  kv.set('APP_DOMAIN', domain);
  kv.set('APP_BASE_URL', `https://${domain}`);
  kv.set('SESSION_SECRET', randSecret());
  if (!kv.get('BOOTSTRAP_SECRET') || !kv.get('BOOTSTRAP_SECRET')?.trim()) kv.set('BOOTSTRAP_SECRET', randSecret(40));
  if (!kv.get('USE_KEYCLOAK')) kv.set('USE_KEYCLOAK', 'false');
  if (!kv.get('OIDC_REDIRECT_PATH')) kv.set('OIDC_REDIRECT_PATH', '/api/auth/callback');
  if (!kv.get('PORT')) kv.set('PORT', '4000');
  if (!kv.get('LOGOUT_REDIRECT_PATH')) kv.set('LOGOUT_REDIRECT_PATH', '/auth');
  if (!kv.get('SUPABASE_URL')) kv.set('SUPABASE_URL', 'https://YOUR-PROJECT.supabase.co');
  if (!kv.get('SUPABASE_SERVICE_ROLE_KEY')) kv.set('SUPABASE_SERVICE_ROLE_KEY', 'YOUR_SERVICE_ROLE_KEY');
  if (!kv.get('ACME_EMAIL')) kv.set('ACME_EMAIL', 'dev@example.com');

  const out = Array.from(kv.entries()).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  writeFileSync(envPath, out, 'utf8');
  console.log(`.env.prod gerado para domínio ${domain}`);
  return domain;
}

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options });
    child.on('exit', (code) => {
      if (code === 0) resolve(0); else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function waitForHealth(url, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
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
  const domainArg = process.argv[2];
  const domain = ensureEnvProd(domainArg);
  const files = ['-f', 'docker-compose.yml', '-f', 'docker-compose.prod.yml'];
  const upArgs = [...files, 'up', '-d', '--build', 'web'];
  try {
    await run('docker', ['compose', ...upArgs]);
  } catch (e) {
    await run('docker-compose', upArgs);
  }

  console.log('Aguardando HTTPS e health check (pode levar ~1-2 min na 1ª vez)...');
  const ok = await waitForHealth(`https://${domain}/api/health`, 240000);
  if (!ok) console.log(`Siga em https://${domain} (verifique DNS/porta 80/443)`);
  else console.log(`Produção no ar: https://${domain}`);

  const envTxt = readFileSync('.env.prod', 'utf8');
  const hasPlaceholder = envTxt.includes('YOUR-PROJECT.supabase.co') || envTxt.includes('YOUR_SERVICE_ROLE_KEY');
  if (hasPlaceholder) {
    console.warn('\nAtenção: SUPABASE_URL/SERVICE_ROLE_KEY estão placeholders. Configure e reinicie a API.');
  }

  openBrowser(`https://${domain}`);
}

up();
