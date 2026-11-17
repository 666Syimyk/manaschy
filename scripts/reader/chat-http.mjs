import { createEpicIndex } from './chat-index.mjs';
import { createOllamaClient, chatFailure } from './chat-ollama.mjs';
import { createChatAnswerer } from './chat-answer.mjs';

const statuses = { INVALID_REQUEST: 400, REQUEST_TOO_LARGE: 413, JSON_REQUIRED: 415,
  INDEX_NOT_READY: 409, CHAT_BUSY: 429, RATE_LIMITED: 429, MODEL_TIMEOUT: 504,
  INVALID_MODEL_RESPONSE: 502, MODEL_UNAVAILABLE: 503, MODEL_MISSING: 503,
  SOURCE_UNAVAILABLE: 503, CANCELLED: 499 };
function send(response, status, body) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status); response.end(JSON.stringify(body));
}
function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    request.resume(); return Promise.reject(chatFailure('JSON_REQUIRED'));
  }
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    const timer = setTimeout(() => finish(chatFailure('INVALID_REQUEST')), 10000);
    const finish = (error, value) => {
      clearTimeout(timer);
      request.off('data', onData); request.off('end', onEnd); request.off('error', onError); request.off('aborted', onAbort);
      if (error) { request.resume(); reject(error); } else resolve(value);
    };
    const onData = chunk => {
      size += chunk.length;
      if (size > 32768) return finish(chatFailure('REQUEST_TOO_LARGE'));
      chunks.push(chunk);
    };
    const onEnd = () => {
      try { finish(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { finish(chatFailure('INVALID_REQUEST')); }
    };
    const onError = () => finish(chatFailure('INVALID_REQUEST'));
    const onAbort = () => finish(chatFailure('CANCELLED'));
    request.on('data', onData); request.once('end', onEnd); request.once('error', onError); request.once('aborted', onAbort);
  });
}
function validRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !['question', 'locale', 'history'].includes(key)) ||
      typeof value.question !== 'string' || !value.question.trim() || value.question.length > 2000 ||
      !['ru', 'ky'].includes(value.locale) || !Array.isArray(value.history) || value.history.length > 8 ||
      value.history.some(turn => !turn || typeof turn !== 'object' || Object.keys(turn).some(key => !['role', 'content'].includes(key)) ||
        !['user', 'assistant'].includes(turn.role) || typeof turn.content !== 'string' || !turn.content.trim() || turn.content.length > 2000)) {
    throw chatFailure('INVALID_REQUEST');
  }
  return { question: value.question.trim(), locale: value.locale, history: value.history };
}

export function createChatHttpHandler({ index = createEpicIndex(), model = createOllamaClient(),
  answerer = createChatAnswerer({ index, model }), now = Date.now } = {}) {
  let busy = false; let attempts = [];
  let cachedModel = 'unavailable'; let checkedAt = -Infinity; let checking;
  const status = async () => {
    if (now() - checkedAt >= 5000) {
      checking ??= model.getStatus().then(value => { cachedModel = value; checkedAt = now(); }).finally(() => { checking = undefined; });
      await checking;
    }
    return { ...index.getStatus(), model: cachedModel };
  };
  return async (request, response) => {
    if (!['/chat/status', '/chat/prepare', '/chat/messages'].includes(request.url)) return false;
    const expected = request.url === '/chat/status' ? 'GET' : 'POST';
    if (request.method !== expected) { send(response, 405, { error: 'METHOD_NOT_ALLOWED' }); return true; }
    try {
      if (request.url === '/chat/status') { send(response, 200, await status()); return true; }
      const value = await readJson(request);
      if (request.url === '/chat/prepare') {
        if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length) throw chatFailure('INVALID_REQUEST');
        const current = await status();
        if (current.model === 'ready') void index.prepare().catch(() => {});
        send(response, 202, { ...index.getStatus(), model: current.model }); return true;
      }
      const input = validRequest(value);
      const current = await status();
      if (current.index !== 'ready') throw chatFailure(current.index === 'error' ? 'SOURCE_UNAVAILABLE' : 'INDEX_NOT_READY');
      if (current.model !== 'ready') throw chatFailure(current.model === 'missing' ? 'MODEL_MISSING' : 'MODEL_UNAVAILABLE');
      if (busy) throw chatFailure('CHAT_BUSY');
      attempts = attempts.filter(time => time > now() - 60000);
      if (attempts.length >= 12) throw chatFailure('RATE_LIMITED');
      attempts.push(now()); busy = true;
      const abort = new AbortController();
      const onClose = () => { if (!response.writableEnded) abort.abort(); };
      response.once('close', onClose);
      try {
        if (response.destroyed) abort.abort();
        const reply = await answerer.ask(input, abort.signal);
        send(response, 200, reply);
      } finally { busy = false; response.off('close', onClose); }
    } catch (error) {
      const code = Object.hasOwn(statuses, error.code) ? error.code : 'MODEL_UNAVAILABLE';
      if (code === 'REQUEST_TOO_LARGE' || code === 'INVALID_REQUEST') response.setHeader('Connection', 'close');
      send(response, statuses[code], { error: code });
    }
    return true;
  };
}
