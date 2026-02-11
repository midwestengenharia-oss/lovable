#!/usr/bin/env node
import { spawn } from 'child_process';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve(0) : reject(code)));
  });
}

async function down() {
  try {
    await run('docker', ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml', 'down']);
  } catch (e) {
    await run('docker-compose', ['-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml', 'down']);
  }
}

down();
