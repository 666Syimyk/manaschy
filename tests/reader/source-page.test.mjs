import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as source from '../../scripts/reader/source-page.mjs';

test('counts all 2149 distinct original pages and honours cancellation before accessing PDFs', async () => {
  assert.equal(typeof source.getSourcePageCount, 'function');
  assert.equal(source.getSourcePageCount(), 2149);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(async () => {
    for await (const page of source.iterateSourcePages({ signal: abort.signal })) assert.fail(String(page.page));
  }, { name: 'AbortError' });
});

test('clips two sections sharing a printed page to their own text', () => {
  const first = { startPage: 11, endPage: 20, volumeId: 'v1' };
  const next = { title: 'ЖАҢЫ БӨЛҮМ', startPage: 20, volumeId: 'v1', startsMidPage: true };
  const blocks = [{ kind: 'verse', text: 'Эски бөлүм' }, { kind: 'heading', text: 'ЖАҢЫ БӨЛҮМ' }, { kind: 'verse', text: 'Жаңы сап' }];
  assert.deepEqual(source.clipEpisodeBlocks(blocks, first, next, 20), [blocks[0]]);
  assert.deepEqual(source.clipEpisodeBlocks(blocks, next, undefined, 20), blocks.slice(1));
});
