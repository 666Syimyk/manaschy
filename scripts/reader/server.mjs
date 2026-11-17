import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createChatHttpHandler } from './chat-http.mjs';

const catalog = JSON.parse(readFileSync(new URL('../../src/data/epic/catalog.json', import.meta.url), 'utf8'));
const episodes = new Map(catalog.episodes.map((episode) => [episode.id, episode]));
const localHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/;
const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1):808[1-9]$/;

async function defaultReadPage(id, page) {
  const { readSourcePage } = await import('./source-page.mjs');
  return readSourcePage(id, page);
}

/** Loopback-only local document reader. Never a general URL proxy. */
export function createReaderServer({ readPage = defaultReadPage, chat = createChatHttpHandler() } = {}) {
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, body) => {
      response.writeHead(status);
      response.end(JSON.stringify(body));
    };
    const origin = request.headers.origin;
    if (!localHost.test(request.headers.host ?? '') || (origin && !localOrigin.test(origin))) {
      send(403, { error: 'LOCAL_ACCESS_ONLY' });
      return;
    }
    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
    }
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      response.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
      response.writeHead(204);
      response.end();
      return;
    }
    if (await chat(request, response)) return;
    if (request.method !== 'GET') {
      send(405, { error: 'METHOD_NOT_ALLOWED' });
      return;
    }
    if (request.url === '/health') {
      send(200, { service: 'manaschy-local-reader', version: 2, capabilities: ['reader', 'chat'] });
      return;
    }
    const match = /^\/episode\/([a-z0-9-]+)\/page\/(\d+)$/.exec(request.url ?? '');
    const episode = match && episodes.get(match[1]);
    const page = match ? Number(match[2]) : NaN;
    if (!episode || !Number.isSafeInteger(page) || page < episode.startPage || page > episode.endPage) {
      send(404, { error: 'PAGE_NOT_FOUND' });
      return;
    }
    try {
      send(200, await readPage(episode.id, page));
    } catch {
      send(502, { error: 'SOURCE_UNAVAILABLE' });
    }
  });
}

export async function startReaderServer() {
  const server = createReaderServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(8091, '127.0.0.1', resolve);
  });
  console.log('Manaschy text reader: http://127.0.0.1:8091 (local access only)');
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startReaderServer().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
