import { setImmediate as yieldTurn } from 'node:timers/promises';
import { iterateSourcePages, getSourcePageCount } from './source-page.mjs';

const stop = new Set('и в на по о об из за как кто что где когда почему зачем чем это был была были его её они про этот эта который менен жана бул бир деп эле үчүн эмне ким кандай'.split(' '));
const glyphs = { a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', x: 'х', y: 'у' };
function normalize(text) {
  return text.toLowerCase().replace(/ё/g, 'е').replace(/[\p{L}\p{N}]+/gu, word =>
    /[а-яөүң]/u.test(word) ? word.replace(/[aceopxy]/g, char => glyphs[char]) : word);
}
function terms(text) {
  return (normalize(text).match(/[\p{L}\p{N}]+/gu) ?? []).filter(word => word.length >= 3 && !stop.has(word));
}
function keys(word) {
  return [word, ...(word.length >= 6 ? [`~${word.slice(0, 6)}`] : []), `^${word.slice(0, 3)}`];
}
function chunksOf(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + 1500, text.length);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf('\n', end), text.lastIndexOf(' ', end));
      if (boundary > start + 700) end = boundary;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === text.length) break;
    const overlapStart = text.indexOf(' ', end - 150);
    start = overlapStart >= end - 150 && overlapStart < end ? overlapStart + 1 : end;
  }
  return chunks;
}

export function createEpicIndex({ iteratePages = iterateSourcePages, totalPages = getSourcePageCount() } = {}) {
  let state = 'idle';
  let completedPages = 0;
  let pending;
  let chunks = [];
  let postings = new Map();
  let lengths = [];
  let headingKeys = [];
  let averageLength = 1;
  const requireReady = () => { if (state !== 'ready') throw Object.assign(new Error('INDEX_NOT_READY'), { code: 'INDEX_NOT_READY' }); };
  const clear = () => { chunks = []; postings = new Map(); lengths = []; headingKeys = []; averageLength = 1; };
  const prepare = () => {
    if (state === 'ready') return Promise.resolve();
    if (pending) return pending;
    state = 'preparing'; completedPages = 0; clear();
    pending = (async () => {
      const seenPages = new Set();
      const seenChunks = new Set();
      for await (const page of iteratePages()) {
        for (const [part, text] of chunksOf(page.blocks.map(block => block.text).join('\n\n')).entries()) {
          const duplicateKey = `${page.volumeId}:${page.page}:${text}`;
          if (seenChunks.has(duplicateKey)) continue;
          seenChunks.add(duplicateKey);
          const chunk = { id: `${page.episodeId}:${page.page}:${part}`, episodeId: page.episodeId,
            volumeId: page.volumeId, volume: page.volume, title: page.title, page: page.page, text };
          const position = chunks.length;
          chunks.push(chunk);
          headingKeys.push(new Set(terms(page.title ?? '').flatMap(keys)));
          const words = terms(text);
          lengths.push(words.length || 1);
          const counts = new Map();
          for (const word of words) for (const key of keys(word)) counts.set(key, (counts.get(key) ?? 0) + 1);
          for (const [key, count] of counts) {
            if (!postings.has(key)) postings.set(key, new Map());
            postings.get(key).set(position, count);
          }
        }
        seenPages.add(`${page.volumeId}:${page.page}`);
        completedPages = seenPages.size;
        await yieldTurn();
      }
      if (completedPages !== totalPages || !chunks.length) throw new Error('INCOMPLETE_INDEX');
      averageLength = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
      state = 'ready';
    })().catch(error => { state = 'error'; clear(); throw error; }).finally(() => { pending = undefined; });
    return pending;
  };
  const search = (queries, limit = 30) => {
    requireReady();
    const scores = new Map();
    const queryWords = [...new Set(queries.flatMap(query => terms(query)))];
    const availableWords = queryWords.filter(word => keys(word).some(key => postings.has(key)));
    const queryTerms = new Set(queryWords.flatMap(keys));
    for (const key of queryTerms) {
      const matches = postings.get(key);
      if (!matches) continue;
      const idf = Math.log(1 + (chunks.length - matches.size + 0.5) / (matches.size + 0.5));
      for (const [position, frequency] of matches) {
        const bm25 = idf * frequency * 2.2 / (frequency + 1.2 * (0.25 + 0.75 * lengths[position] / averageLength));
        scores.set(position, (scores.get(position) ?? 0) + bm25 * (key.startsWith('^') ? 0.25 : key.startsWith('~') ? 0.4 : 1));
      }
    }
    const phrases = queries.map(normalize).filter(query => terms(query).length >= 2);
    const pairs = new Set(queries.flatMap(query => {
      const roots = terms(query).map(word => word.slice(0, 3));
      return roots.slice(1).map((root, index) => `${roots[index]} ${root}`);
    }));
    return [...scores].map(([position, score]) => {
      // Short-root matches help Kyrgyz suffixes; coverage prevents a rare single word
      // from outweighing passages containing the character, action AND its negation.
      const covered = availableWords.filter(word => keys(word).some(key => postings.get(key)?.has(position))).length;
      const coverage = covered / Math.max(1, availableWords.length);
      const headingBonus = availableWords.filter(word => keys(word).some(key => headingKeys[position].has(key))).length * 3;
      const roots = terms(chunks[position].text).map(word => word.slice(0, 3));
      let proximity = 0;
      for (let index = 1; index < roots.length; index++) {
        if (pairs.has(`${roots[index - 1]} ${roots[index]}`)) proximity += 3;
      }
      return { chunk: chunks[position], score: score * coverage ** 3 + headingBonus + Math.min(12, proximity) +
        phrases.reduce((bonus, phrase) => bonus + (normalize(chunks[position].text).includes(phrase) ? 3 : 0), 0) };
    })
      .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
      .slice(0, Math.min(30, Math.max(0, limit)));
  };
  const selectContext = hits => {
    requireReady();
    const selected = []; const seen = new Set(); let size = 0;
    const add = chunk => {
      if (!chunk || seen.has(chunk.id) || selected.length >= 3 || size + chunk.text.length > 4500) return;
      selected.push(chunk); seen.add(chunk.id); size += chunk.text.length;
    };
    // Explain one contiguous passage. Combining distant hits let the small model
    // merge different moments into a false story with otherwise valid citations.
    const anchor = hits[0]?.chunk;
    add(anchor);
    if (anchor) {
      const position = chunks.indexOf(anchor);
      for (const neighbour of [chunks[position - 1], chunks[position + 1]]) {
        if (neighbour?.episodeId === anchor.episodeId && Math.abs(neighbour.page - anchor.page) <= 1) add(neighbour);
      }
    }
    return selected;
  };
  return { prepare, search, selectContext, getStatus: () => ({ index: state, completedPages, totalPages,
    ...(state === 'error' ? { error: 'SOURCE_UNAVAILABLE' } : {}) }) };
}
