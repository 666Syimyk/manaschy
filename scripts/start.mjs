import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { startReaderServer } from './reader/server.mjs';

const require = createRequire(import.meta.url);
let reader;
try {
  reader = await startReaderServer();
} catch (error) {
  if (error.code !== 'EADDRINUSE') throw error;
  const response = await fetch('http://127.0.0.1:8091/health', { signal: AbortSignal.timeout(2000) });
  const health = response.ok ? await response.json() : {};
  if (health.service !== 'manaschy-local-reader') {
    throw new Error('Port 8091 is occupied by another application. Stop it or run Expo separately.');
  }
  if (health.version !== 2 || !['reader', 'chat'].every(capability => health.capabilities?.includes(capability))) {
    throw new Error('An older Manaschy reader is running on port 8091. Restart that reader to enable chat.');
  }
  console.log('Using the running Manaschy text reader on port 8091.');
}

const expo = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});
const stop = () => { reader?.close(); expo.kill(); };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
expo.once('error', (error) => { console.error(error.message); reader?.close(); process.exitCode = 1; });
expo.once('exit', (code) => { reader?.close(); process.exitCode = code ?? 0; });
