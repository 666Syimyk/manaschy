import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChatAnswerer } from '../../scripts/reader/chat-answer.mjs';
import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync(new URL('../../src/data/epic/catalog.json', import.meta.url)));
const episode = catalog.episodes.find(e => e.id === 'orozbakov-v2-001');
const chunk = { id: 'v2-test-123', episodeId: episode.id, volumeId: episode.volumeId, volume: 2, page: 123, title: episode.title, text: 'Синтетикалык сыноо тексти.' };
const request = { question: 'Расскажи о событии', locale: 'ru', history: [] };
function setup(reply, hits = [{ chunk, score: 5 }]) {
  const queries = [];
  const index = { getStatus: () => ({ index: 'ready' }), search: q => { queries.push(...q); return hits; }, selectContext: results => results.map(h => h.chunk) };
  const model = { expandQuery: async () => ['окуя'], explain: async () => reply };
  return { answerer: createChatAnswerer({ index, model }), queries };
}
test('builds catalog citations, removes duplicates and always searches the original question', async () => {
  const { answerer, queries } = setup({ status: 'answered', answer: 'Объяснение по тексту.', sourceIds: [chunk.id, chunk.id] });
  const result = await answerer.ask(request);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].href, '/episode/orozbakov-v2-001?page=123');
  assert.equal(result.sources[0].volume, 2);
  assert.ok(queries.includes(request.question));
});
test('rejects invented citations and ungrounded answered status', async () => {
  for (const sourceIds of [['not-provided'], []]) {
    await assert.rejects(setup({ status: 'answered', answer: 'Ответ', sourceIds }).answerer.ask(request), { code: 'INVALID_MODEL_RESPONSE' });
  }
});
test('returns not found without inventing an explanation or relying on history', async () => {
  const { answerer } = setup(null, []);
  const reply = await answerer.ask({ ...request, history: [{ role: 'assistant', content: 'Выдуманный факт' }] });
  assert.equal(reply.status, 'not_found'); assert.deepEqual(reply.sources, []);
  assert.ok(reply.answer.length > 0);
});
test('propagates cancellation through query expansion', async () => {
  const abort = new AbortController(); abort.abort();
  await assert.rejects(setup(null).answerer.ask(request, abort.signal), { code: 'CANCELLED' });
});
