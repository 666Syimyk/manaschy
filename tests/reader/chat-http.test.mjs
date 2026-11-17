import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReaderServer } from '../../scripts/reader/server.mjs';
import { createChatHttpHandler } from '../../scripts/reader/chat-http.mjs';

const valid = { question: 'Тест', locale: 'ru', history: [] };
const reply = { status: 'not_found', answer: 'Нет подтверждения', sources: [] };
async function fixture(run, options = {}) {
  let preparations = 0;
  const chat = createChatHttpHandler({
    index: { getStatus: () => ({ index: options.indexState ?? 'ready', completedPages: 4, totalPages: 4 }), prepare: async () => { preparations++; } },
    model: { getStatus: async () => 'ready' },
    answerer: { ask: options.ask ?? (async () => reply) }, now: options.now ?? (() => 1000),
  });
  const server = createReaderServer({ chat });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (patch = {}) => fetch(`${base}/chat/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid, ...patch }) });
  try { await run({ base, post, preparations: () => preparations }); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('serves chat readiness, preparation and answers without an episode selector', async () => {
  await fixture(async ({ base, post, preparations }) => {
    assert.deepEqual(await (await post()).json(), reply);
    assert.equal((await (await fetch(`${base}/chat/status`)).json()).model, 'ready');
    const started = await fetch(`${base}/chat/prepare`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(started.status, 202); assert.equal(preparations(), 1);
    const health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.version, 2); assert.ok(health.capabilities.includes('chat'));
  });
});

test('validates request boundaries and never accepts system roles or a model URL', async () => {
  await fixture(async ({ post, base }) => {
    for (const patch of [{ question: '' }, { question: ' ' }, { question: 'я'.repeat(2001) }, { history: Array(9).fill({ role: 'user', content: 'a' }) },
      { history: [{ role: 'system', content: 'a' }] }, { history: [{ role: 'user', content: 'a'.repeat(2001) }] }, { locale: 'en' }, { url: 'https://evil.example' }, { question: null }]) {
      assert.equal((await post(patch)).status, 400);
    }
    assert.equal((await post({ question: 'я'.repeat(2000), history: Array(8).fill({ role: 'user', content: 'a' }) })).status, 200);
    const tooLarge = await fetch(`${base}/chat/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ' '.repeat(32769) });
    assert.equal(tooLarge.status, 413);
    assert.equal((await fetch(`${base}/chat/messages`, { method: 'POST', body: '{}' })).status, 415);
    assert.equal((await fetch(`${base}/chat/messages`)).status, 405);
  });
});

test('limits messages to twelve per minute and releases the next time window', async () => {
  let now = 1000;
  await fixture(async ({ post }) => {
    for (let i = 0; i < 12; i++) assert.equal((await post()).status, 200);
    assert.equal((await post()).status, 429);
    now = 61001;
    assert.equal((await post()).status, 200);
  }, { now: () => now });
});

test('rejects concurrent questions and frees the model after client cancellation', async () => {
  let modelSignal;
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  let calls = 0;
  await fixture(async ({ base, post }) => {
    const abort = new AbortController();
    const first = fetch(`${base}/chat/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid), signal: abort.signal }).catch(() => undefined);
    await started;
    assert.equal((await post()).status, 429);
    abort.abort(); await first;
    await new Promise(resolve => modelSignal.aborted ? resolve() : modelSignal.addEventListener('abort', resolve, { once: true }));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(modelSignal.aborted, true);
    assert.equal((await post()).status, 200);
  }, { ask: async (_request, signal) => {
    calls++; if (calls > 1) return reply;
    modelSignal = signal; entered();
    await new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(Error(), { code: 'CANCELLED' })), { once: true }));
  } });
});

test('keeps local origin protection for writes and supports JSON preflight', async () => {
  await fixture(async ({ base }) => {
    const response = await fetch(`${base}/chat/prepare`, { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 403);
    const preflight = await fetch(`${base}/chat/messages`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081' } });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /POST/);
    assert.match(preflight.headers.get('Access-Control-Allow-Headers'), /Content-Type/i);
  });
});

test('reports incomplete index, timeout and model errors without leaking details', async () => {
  await fixture(async ({ post }) => assert.equal((await post()).status, 409), { indexState: 'preparing' });
  for (const [code, expected] of [['MODEL_TIMEOUT', 504], ['INVALID_MODEL_RESPONSE', 502], ['MODEL_UNAVAILABLE', 503], ['secret', 503]]) {
    await fixture(async ({ post }) => {
      const response = await post(); assert.equal(response.status, expected);
      assert.ok(!JSON.stringify(await response.json()).includes('private'));
    }, { ask: async () => { throw Object.assign(Error('private upstream'), { code }); } });
  }
});
