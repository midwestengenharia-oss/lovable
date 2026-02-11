#!/usr/bin/env node
import { spawn } from 'child_process';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve(0) : reject(code)));
  });
}

async function down() {
  const files = ['-f', 'docker-compose.yml', '-f', 'docker-compose.prod.yml'];
  try {
    await run('docker', ['compose', ...files, 'down']);
  } catch (e) {
    await run('docker-compose', [...files, 'down']);
  }
}

down();

