import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createReaderServer } from '../../scripts/reader/server.mjs';

async function withServer(run) {
  const requests = [];
  const server = createReaderServer({
    readPage: async (id, page) => {
      requests.push({ id, page });
      if (page === 12) throw new Error('upstream detail must not leak');
      return { episodeId: id, page, blocks: [{ kind: 'verse', text: 'Сыноо' }] };
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base, requests); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('serves only known episodes and bounded integer source pages', async () => {
  await withServer(async (base, requests) => {
    const response = await fetch(`${base}/episode/orozbakov-v1-001/page/11`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).blocks[0].text, 'Сыноо');
    for (const route of ['/episode/unknown/page/11', '/episode/orozbakov-v1-001/page/10', '/episode/orozbakov-v1-001/page/11.5', '/?url=https://example.com']) {
      assert.ok((await fetch(base + route)).status >= 400);
    }
    assert.deepEqual(requests, [{ id: 'orozbakov-v1-001', page: 11 }]);
  });
});

test('blocks foreign origins and hostnames; allows the local UI without wildcard CORS', async () => {
  await withServer(async (base, requests) => {
    assert.equal((await fetch(`${base}/health`, { headers: { Origin: 'https://evil.example' } })).status, 403);
    const foreignHostStatus = await new Promise((resolve, reject) => {
      const request = httpRequest(`${base}/health`, { headers: { Host: 'evil.example' } }, (response) => {
        response.resume();
        resolve(response.statusCode);
      });
      request.on('error', reject);
      request.end();
    });
    assert.equal(foreignHostStatus, 403);
    const response = await fetch(`${base}/health`, { headers: { Origin: 'http://localhost:8081' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8081');
    assert.equal((await response.json()).service, 'manaschy-local-reader');
    assert.equal(requests.length, 0);
  });
});

test('handles failures and rejects unsupported methods', async () => {
  await withServer(async (base) => {
    const failed = await fetch(`${base}/episode/orozbakov-v1-001/page/12`);
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), { error: 'SOURCE_UNAVAILABLE' });
    assert.equal((await fetch(`${base}/health`, { method: 'POST' })).status, 405);
  });
});
