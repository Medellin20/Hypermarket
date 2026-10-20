import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const services = ['backend', 'frontend'];
const children = [];
let stopping = false;

function stop(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;

  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill(signal);
  }
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

for (const service of services) {
  const child = spawn(npmCommand, ['run', 'dev'], {
    cwd: join(root, service),
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  children.push(child);
  child.on('error', (error) => {
    console.error(`Impossible de démarrer ${service} :`, error.message);
    stop('SIGTERM', 1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      const exitCode = code ?? (signal ? 1 : 0);
      console.error(`${service} s'est arrêté${signal ? ` (${signal})` : ''}.`);
      stop('SIGTERM', exitCode);
    }
  });
}
