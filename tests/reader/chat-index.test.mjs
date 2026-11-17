import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEpicIndex } from '../../scripts/reader/chat-index.mjs';

const source = (volume, text, page = 11, episodeId = `orozbakov-v${volume}-001`) => ({
  episodeId, volumeId: `orozbakov-2018-v${volume}`, volume, title: 'Тест', page,
  blocks: [{ kind: 'verse', text }],
});

test('searches all volumes, normalizes mixed glyphs and keeps the original intact', async () => {
  const original = 'Aлмамбеттин тулпары жайлоодо жүрөт. Тесттик сап.';
  async function* pages() { for (let v = 1; v <= 4; v++) yield source(v, original); }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 4 });
  assert.throws(() => index.search(['тулпар']), { code: 'INDEX_NOT_READY' });
  await index.prepare();
  assert.equal(index.getStatus().index, 'ready');
  const hits = index.search(['алмамбет']);
  assert.deepEqual(new Set(hits.map(h => h.chunk.volume)), new Set([1, 2, 3, 4]));
  assert.equal(hits[0].chunk.text, original);
  assert.equal(index.search(['космонавт']).length, 0);
  assert.equal(index.search(['   ']).length, 0);
});

test('deduplicates preparation and counts a shared page once without losing its sections', async () => {
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  async function* pages() {
    calls++;
    yield source(1, 'Биринчи бөлүмдүн өзгөчө тексти');
    await gate;
    yield source(1, 'Экинчи бөлүмдөгү башка көрүнүш', 11, 'orozbakov-v1-002');
  }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 1 });
  const first = index.prepare();
  const second = index.prepare();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(index.getStatus().index, 'preparing');
  release();
  await Promise.all([first, second]);
  assert.equal(index.getStatus().completedPages, 1);
  assert.equal(index.search(['көрүнүш'])[0].chunk.episodeId, 'orozbakov-v1-002');
});

test('finds short Kyrgyz roots across possessive and negative suffixes', async () => {
  async function* pages() {
    yield source(1, 'Жакып баласы жоктугун арман кылды.', 11);
    yield source(1, 'Жакыптын балдары тойго келишти.', 12);
    yield source(2, 'Көкчөнүн балдары жок.', 13);
  }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 3 }); await index.prepare();
  assert.equal(index.search(['Жакып балдары жок'])[0].chunk.page, 11);
});

test('prefers nearby action/negation terms to separated repeated keywords', async () => {
  async function* pages() {
    yield source(1, 'Жакыптын баласы жоктугун айтып, арман кылганы.', 11);
    yield source(1, 'Жакып балдары келет. Ал жерде жыйын өтөт. Башка сөзү жок. Балдары келет.', 12);
  }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 2 }); await index.prepare();
  assert.equal(index.search(['Жакып балдары жок'])[0].chunk.page, 11);
});

test('uses original episode headings to rank passages from the requested event', async () => {
  async function* pages() {
    yield { ...source(4, 'Кошой жеңишке жетип, эл кубанды.', 194), title: 'Кошой менен Жолойдун күрөшкөнү' };
    yield source(1, 'Кошой Кошой Кошой аттанып жөнөдү.', 175);
  }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 2 }); await index.prepare();
  assert.equal(index.search(['Кошой күрөшү'])[0].chunk.page, 194);
});

test('never reports a partial corpus ready and can rebuild after a source failure', async () => {
  let fail = true;
  async function* pages() {
    yield source(1, 'Тесттик булак');
    if (fail) throw new Error('private upstream detail');
    yield source(2, 'Башка тесттик булак');
  }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 2 });
  await assert.rejects(index.prepare());
  assert.equal(index.getStatus().index, 'error');
  assert.equal(index.getStatus().error, 'SOURCE_UNAVAILABLE');
  assert.throws(() => index.search(['булак']), { code: 'INDEX_NOT_READY' });
  fail = false;
  await index.prepare();
  assert.equal(index.search(['булак']).length, 2);
  const incomplete = createEpicIndex({ iteratePages: async function* () { yield source(1, 'Бир барак'); }, totalPages: 2 });
  await assert.rejects(incomplete.prepare());
  assert.equal(incomplete.getStatus().index, 'error');
});

test('context has bounded unique chunks, complete source metadata and stable ranks', async () => {
  async function* pages() {
    for (let page = 11; page < 21; page++) yield source(1, ('Тулпар талаада жүрөт.\n').repeat(160), page);
  }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 10 });
  await index.prepare();
  const hits = index.search(['тулпар']);
  assert.equal(hits.length, 30);
  const context = index.selectContext(hits);
  assert.ok(context.length > 0 && context.length <= 3);
  assert.equal(new Set(context.map(c => c.id)).size, context.length);
  assert.ok(context.reduce((sum, c) => sum + c.text.length, 0) <= 4500);
  assert.deepEqual(index.search(['тулпар']).map(h => h.chunk.id), hits.map(h => h.chunk.id));
});

test('keeps the selected context in one contiguous scene instead of merging distant hits', async () => {
  async function* pages() {
    yield source(1, 'Тесттик Жакып баласы тууралуу айтат. '.repeat(110), 11);
    yield source(1, 'Жакып башка окуяда малын карайт. '.repeat(90), 51);
  }
  const index = createEpicIndex({ iteratePages: pages, totalPages: 2 }); await index.prepare();
  const hits = index.search(['Жакып']);
  const anchor = hits.find(hit => hit.chunk.id.endsWith(':11:1'));
  const distant = hits.find(hit => hit.chunk.page === 51);
  assert.ok(anchor && distant);
  const context = index.selectContext([anchor, distant]);
  assert.equal(context[0].id, anchor.chunk.id);
  assert.ok(context.length >= 2);
  assert.ok(context.every(chunk => chunk.page === 11));
  assert.ok(context.some(chunk => chunk.id.endsWith(':11:0')));
});
