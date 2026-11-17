import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractPageBlocks } from './pdf-layout.mjs';

const catalog = JSON.parse(await readFile(new URL('../../src/data/epic/catalog.json', import.meta.url), 'utf8'));
const documents = new Map();
const maxBytes = 8 * 1024 * 1024;

async function sourceBytes(volume) {
  // Reuse the inspected local source if available; no text or PDF is written by the reader.
  let bytes;
  try {
    bytes = await readFile(new URL(`../../tmp/epic/orozbakov-2018-v${volume.number}.pdf`, import.meta.url));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(volume.pdfUrl, { signal: AbortSignal.timeout(30000), redirect: 'error' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) throw new Error('INVALID_SOURCE');
    const chunks = [];
    let length = 0;
    for await (const chunk of response.body) {
      length += chunk.length;
      if (length > maxBytes) throw new Error('SOURCE_TOO_LARGE');
      chunks.push(chunk);
    }
    bytes = Buffer.concat(chunks);
  }
  if (bytes.length > maxBytes || createHash('sha256').update(bytes).digest('hex') !== volume.sha256) {
    throw new Error('SOURCE_CHANGED');
  }
  return new Uint8Array(bytes);
}

async function getSourceDocument(volume) {
  if (!documents.has(volume.id)) {
    const pending = sourceBytes(volume).then(async (data) => {
      const task = getDocument({ data, isEvalSupported: false, useSystemFonts: true, verbosity: 0 });
      const document = await task.promise;
      if (document.numPages !== volume.pageCount) { await task.destroy(); throw new Error('SOURCE_CHANGED'); }
      return document;
    }).catch((error) => { documents.delete(volume.id); throw error; });
    documents.set(volume.id, pending);
  }
  return documents.get(volume.id);
}

function normalizeHeading(text) {
  return text.toLocaleLowerCase().replace(/a/g, 'а').replace(/[^\p{L}\p{N}]/gu, '');
}

/** Keep shared-page text on its own side of the printed section boundary. */
export function clipEpisodeBlocks(blocks, episode, next, page) {
  let start = 0;
  let end = blocks.length;
  const findHeading = (title) => {
    const needle = normalizeHeading(title);
    for (let index = 0; index < blocks.length; index++) {
      if (blocks[index].kind !== 'heading') continue;
      let candidate = '';
      for (let scan = index; scan < blocks.length && blocks[scan].kind === 'heading'; scan++) {
        candidate += normalizeHeading(blocks[scan].text);
        if (candidate === needle || needle.startsWith(candidate) && candidate.length >= 25) return index;
      }
    }
    return -1;
  };
  if (page === episode.startPage && episode.startsMidPage) {
    start = findHeading(episode.title);
    if (start < 0) throw new Error('SECTION_BOUNDARY_NOT_FOUND');
  }
  if (next?.volumeId === episode.volumeId && next.startsMidPage && page === next.startPage) {
    end = findHeading(next.title);
    if (end < 0) throw new Error('SECTION_BOUNDARY_NOT_FOUND');
  }
  return blocks.slice(start, end).map(({ kind, text }) => ({ kind, text }));
}

export async function readSourcePage(id, pageNumber) {
  const index = catalog.episodes.findIndex((episode) => episode.id === id);
  const episode = catalog.episodes[index];
  if (!episode || !Number.isInteger(pageNumber) || pageNumber < episode.startPage || pageNumber > episode.endPage) {
    throw new Error('PAGE_NOT_FOUND');
  }
  const volume = catalog.volumes.find((item) => item.id === episode.volumeId);
  const document = await getSourceDocument(volume);
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });
  const extracted = extractPageBlocks(content.items, { width: viewport.width, height: viewport.height, styles: content.styles });
  const blocks = clipEpisodeBlocks(extracted, episode, catalog.episodes[index + 1], pageNumber);
  if (!blocks.length) throw new Error('EMPTY_PAGE');
  return { episodeId: id, page: pageNumber, blocks };
}

export function getSourcePageCount() {
  const pages = new Set();
  for (const episode of catalog.episodes) {
    for (let page = episode.startPage; page <= episode.endPage; page++) pages.add(`${episode.volumeId}:${page}`);
  }
  return pages.size;
}

/** Private runtime iteration; never writes a corpus to disk or into a bundle. */
export async function* iterateSourcePages({ signal } = {}) {
  for (const episode of catalog.episodes) {
    const volume = catalog.volumes.find(item => item.id === episode.volumeId);
    for (let page = episode.startPage; page <= episode.endPage; page++) {
      signal?.throwIfAborted();
      const result = await readSourcePage(episode.id, page);
      signal?.throwIfAborted();
      yield { ...result, volumeId: episode.volumeId, volume: volume.number, title: episode.title };
    }
  }
}
