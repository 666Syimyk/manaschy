import assert from 'node:assert/strict';
import test from 'node:test';

import { extractPageBlocks } from '../../scripts/reader/pdf-layout.mjs';

// These are invented layout fixtures, not text copied from the books.
const page = { width: 467.717, height: 680.315 };
function item(str, x, baseline, width = 140, extra = {}) {
  return {
    str, width, height: 12.5, fontName: 'body',
    transform: [12.5, 0, 0, 12.5, x, baseline], ...extra,
  };
}
const textBlocks = (items, options = page) => extractPageBlocks(items, options)
  .map(({ kind, text }) => ({ kind, text }));

test('reads odd and even columns in order, preserving Kyrgyz and verse breaks', () => {
  for (const left of [42.5, 56.7]) {
    const right = left + 191.3;
    const input = [
      item('Оң экинчи', right, 575), item('Сол биринчи — ө, ү, ң.', left, 590),
      item('Оң биринчи', right, 590), item('Сол экинчи', left, 575),
    ];
    assert.deepEqual(textBlocks(input), [
      { kind: 'verse', text: 'Сол биринчи — ө, ү, ң.\nСол экинчи' },
      { kind: 'verse', text: 'Оң биринчи\nОң экинчи' },
    ]);
    assert.equal(input[0].str, 'Оң экинчи');
  }
});

test('omits running headers, folios, empty items, and malformed items', () => {
  assert.deepEqual(textBlocks([
    item('RUNNING HEADER', 100, 660), item('42 |', 394, 45, 20),
    item('Көрүнгөн сап', 42.5, 600), item('   ', 200, 600),
    { str: 'broken', transform: [] }, { type: 'beginMarkedContent' },
  ]), [{ kind: 'verse', text: 'Көрүнгөн сап' }]);
});

test('a spanning heading separates complete column regions', () => {
  assert.deepEqual(textBlocks([
    item('Сол жогору', 42.5, 590), item('Оң жогору', 233.8, 590),
    item('ЖАҢЫ БӨЛҮМ', 145, 540, 180, { fontName: 'opaque-font-id' }),
    item('Сол төмөн', 42.5, 500), item('Оң төмөн', 233.8, 500),
  ]), [
    { kind: 'verse', text: 'Сол жогору' }, { kind: 'verse', text: 'Оң жогору' },
    { kind: 'heading', text: 'ЖАҢЫ БӨЛҮМ' },
    { kind: 'verse', text: 'Сол төмөн' }, { kind: 'verse', text: 'Оң төмөн' },
  ]);
});

test('joins multi-line headings and preserves their position for episode clipping', () => {
  const blocks = extractPageBlocks([
    item('БИРИНЧИ АТАЛЫШ', 100, 550, 270),
    item('ЭКИНЧИ АТАЛЫШ', 110, 535, 250),
    item('Сол сап', 42.5, 500), item('Оң сап', 233.8, 500),
  ], page);
  assert.equal(blocks[0].kind, 'heading');
  assert.equal(blocks[0].text, 'БИРИНЧИ АТАЛЫШ ЭКИНЧИ АТАЛЫШ');
  assert.ok(blocks[0].top < blocks[0].bottom);
  assert.ok(blocks[0].bottom < blocks[1].top);
  assert.ok(blocks.every((block) => Number.isFinite(block.top) && Number.isFinite(block.bottom)));
});

test('reflows full-width prose with an indented paragraph and a short final line before verse', () => {
  assert.deepEqual(textBlocks([
    item('Биринчи сүйлөмдүн башы', 65, 580, 346),
    item('андан кийинки бөлүгү.', 42.5, 565, 369),
    item('Жаңы абзацтын башы', 65, 550, 346),
    item('акыркы кыска сап.', 42.5, 535, 110),
    item('Сол сап', 42.5, 505), item('Оң сап', 233.8, 505),
  ]), [
    { kind: 'prose', text: 'Биринчи сүйлөмдүн башы андан кийинки бөлүгү.' },
    { kind: 'prose', text: 'Жаңы абзацтын башы акыркы кыска сап.' },
    { kind: 'verse', text: 'Сол сап' }, { kind: 'verse', text: 'Оң сап' },
  ]);
});

test('joins fragments on one baseline without merging the two columns', () => {
  assert.deepEqual(textBlocks([
    item('Кыргыз', 42.5, 590, 40), item('тили', 85, 590.2, 24),
    item('ө', 110, 590, 5), item('ң', 115, 590, 5), item('ү', 120, 590, 5),
    item('Башка сап', 233.8, 590, 100),
  ]), [
    { kind: 'verse', text: 'Кыргыз тили өңү' },
    { kind: 'verse', text: 'Башка сап' },
  ]);
});

test('dehyphenates soft hyphens and corroborated words but retains ambiguous compound hyphens', () => {
  assert.deepEqual(textBlocks([
    item('Сынамык бирик\u00ad', 42.5, 590, 369),
    item('тирүү өзүнчө өзүн-', 42.5, 575, 369),
    item('чө кыргыз-', 42.5, 560, 369),
    item('орус тили.', 42.5, 545, 100),
  ]), [{ kind: 'prose', text: 'Сынамык бириктирүү өзүнчө өзүнчө кыргыз-орус тили.' }]);
});

test('keeps verse hyphens and explicit stanza spacing', () => {
  assert.deepEqual(textBlocks([
    item('Сынамык сап-', 42.5, 590), item('экинчи сап', 42.5, 575),
    item('Башка топ', 42.5, 540),
  ]), [{ kind: 'verse', text: 'Сынамык сап-\nэкинчи сап\n\nБашка топ' }]);
});

test('uses optional font metadata for mixed-case centered headings', () => {
  assert.deepEqual(textBlocks([
    item('Бөлүмдүн аталышы', 120, 570, 240, { fontName: 'f2' }),
    item('Сол сап', 42.5, 530), item('Оң сап', 233.8, 530),
  ], { ...page, styles: { f2: { fontFamily: 'TimesNewRoman-Bold' } } }), [
    { kind: 'heading', text: 'Бөлүмдүн аталышы' },
    { kind: 'verse', text: 'Сол сап' }, { kind: 'verse', text: 'Оң сап' },
  ]);
});

test('handles empty pages and rejects invalid page geometry', () => {
  assert.deepEqual(extractPageBlocks([], page), []);
  assert.throws(() => extractPageBlocks([], { width: 0, height: 10 }), /page dimensions/i);
});
