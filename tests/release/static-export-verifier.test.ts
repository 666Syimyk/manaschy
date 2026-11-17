import { mkdtempSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyStaticExport } from '../../scripts/release/verify-static-export';

const guideIds = ['trilogy', 'manaschi'] as const;
const sourceIds = ['unesco-ich-00876', 'unesco-memory-orozbakov'] as const;
const rootRoutes = ['', 'guides', 'chat', 'sources', 'saved', 'settings', 'privacy', 'methodology'];

function writeHtml(root: string, route: string, shape: 'flat' | 'directory') {
  const target =
    route === ''
      ? join(root, 'index.html')
      : shape === 'flat'
        ? join(root, `${route}.html`)
        : join(root, route, 'index.html');
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, '<!doctype html><title>Manaschy</title>');
  return target;
}

function createCompleteExport(root: string, shape: 'flat' | 'directory') {
  for (const route of rootRoutes) writeHtml(root, route, shape);
  for (const id of guideIds) writeHtml(root, `guide/${id}`, shape);
  for (const id of sourceIds) writeHtml(root, `source/${id}`, shape);
}

describe('verifyStaticExport', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'manaschy-export-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it.each(['flat', 'directory'] as const)(
    'accepts a complete %s-shaped static export',
    (shape) => {
      createCompleteExport(directory, shape);
      writeFileSync(join(directory, shape === 'flat' ? '+not-found.html' : '404.html'), '<!doctype html>');

      expect(verifyStaticExport(directory, guideIds, sourceIds)).toEqual([]);
    },
  );

  it('reports every missing production route instead of accepting a partial export', () => {
    createCompleteExport(directory, 'flat');
    writeFileSync(join(directory, '+not-found.html'), '<!doctype html>');
    unlinkSync(join(directory, 'guides.html'));
    unlinkSync(join(directory, 'chat.html'));
    unlinkSync(join(directory, 'guide', 'manaschi.html'));
    unlinkSync(join(directory, 'source', 'unesco-memory-orozbakov.html'));

    const errors = verifyStaticExport(directory, guideIds, sourceIds);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/guides'),
        expect.stringContaining('/chat'),
        expect.stringContaining('/guide/manaschi'),
        expect.stringContaining('/source/unesco-memory-orozbakov'),
      ]),
    );
    expect(errors).toHaveLength(4);
  });

  it('requires an emitted not-found document for an HTTP 404 hosting rule', () => {
    createCompleteExport(directory, 'directory');

    expect(verifyStaticExport(directory, guideIds, sourceIds)).toEqual([
      expect.stringContaining('404'),
    ]);
  });

  it('requires every episode route when an episode catalog is supplied', () => {
    createCompleteExport(directory, 'flat');
    writeFileSync(join(directory, '+not-found.html'), '<!doctype html>');

    expect(verifyStaticExport(directory, guideIds, sourceIds, ['orozbakov-v1-001'])).toEqual([
      'Missing static HTML for /episode/orozbakov-v1-001',
    ]);
    writeHtml(directory, 'episode/orozbakov-v1-001', 'flat');
    expect(verifyStaticExport(directory, guideIds, sourceIds, ['orozbakov-v1-001'])).toEqual([]);
  });

  it('reports an unreadable export directory', () => {
    const missing = join(directory, 'missing');

    expect(verifyStaticExport(missing, guideIds, sourceIds)).toEqual([
      expect.stringContaining('does not exist'),
    ]);
  });
});
