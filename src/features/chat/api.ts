import { epicVolumes, getEpisodeById } from '../../data/epic';
import type { ChatReply, ChatRequest, ChatSource, ChatStatus } from './types';

const knownErrors = new Set(['INVALID_REQUEST', 'REQUEST_TOO_LARGE', 'JSON_REQUIRED', 'INDEX_NOT_READY', 'CHAT_BUSY', 'RATE_LIMITED', 'MODEL_TIMEOUT', 'INVALID_MODEL_RESPONSE', 'MODEL_UNAVAILABLE', 'MODEL_MISSING', 'SOURCE_UNAVAILABLE', 'CANCELLED']);
function baseUrl() {
  const configured = process.env.EXPO_PUBLIC_READER_URL;
  const local = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location?.hostname);
  const base = configured || (local ? 'http://127.0.0.1:8091' : '');
  if (!/^https?:\/\//.test(base)) throw Error('READER_UNAVAILABLE');
  return base.replace(/\/$/, '');
}
async function requestJson(path: string, body?: object, parent?: AbortSignal): Promise<unknown> {
  if (parent?.aborted) throw Error('CANCELLED');
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  parent?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, path === '/chat/messages' ? 185000 : 15000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, { method: body ? 'POST' : 'GET', signal: controller.signal,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const text = await response.text();
    if (text.length > 65536) throw Error('INVALID_CHAT_RESPONSE');
    let value: unknown;
    try { value = JSON.parse(text); } catch { throw Error('INVALID_CHAT_RESPONSE'); }
    if (!response.ok) {
      const code = value && typeof value === 'object' && 'error' in value ? value.error : null;
      throw Error(typeof code === 'string' && knownErrors.has(code) ? code : 'READER_UNAVAILABLE');
    }
    if (controller.signal.aborted) throw Error('CANCELLED');
    return value;
  } catch (error) {
    if (controller.signal.aborted) throw Error(timedOut ? 'MODEL_TIMEOUT' : 'CANCELLED');
    if (error instanceof Error && (knownErrors.has(error.message) || ['INVALID_CHAT_RESPONSE', 'READER_UNAVAILABLE'].includes(error.message))) throw error;
    throw Error('READER_UNAVAILABLE');
  } finally { clearTimeout(timeout); parent?.removeEventListener('abort', cancel); }
}
function parseStatus(value: unknown): ChatStatus {
  if (!value || typeof value !== 'object') throw Error('INVALID_CHAT_RESPONSE');
  const status = value as ChatStatus;
  if (!['idle', 'preparing', 'ready', 'error'].includes(status.index) || !['ready', 'unavailable', 'missing'].includes(status.model) ||
    !Number.isSafeInteger(status.completedPages) || !Number.isSafeInteger(status.totalPages) || status.totalPages <= 0 ||
    status.completedPages < 0 || status.completedPages > status.totalPages ||
    (status.index === 'ready' && status.completedPages !== status.totalPages)) throw Error('INVALID_CHAT_RESPONSE');
  return status;
}
function validSource(source: ChatSource): boolean {
  if (!source || typeof source.id !== 'string' || !source.id || source.id.length > 120) return false;
  const episode = getEpisodeById(source.episodeId);
  const volume = epicVolumes.find(item => item.id === episode?.volumeId);
  return !!episode && !!volume && source.volume === volume.number && source.title === episode.title &&
    Number.isSafeInteger(source.page) && source.page >= episode.startPage && source.page <= episode.endPage &&
    source.href === `/episode/${episode.id}?page=${source.page}`;
}
export async function getChatStatus(signal?: AbortSignal): Promise<ChatStatus> {
  return parseStatus(await requestJson('/chat/status', undefined, signal));
}
export async function prepareChat(signal?: AbortSignal): Promise<ChatStatus> {
  return parseStatus(await requestJson('/chat/prepare', {}, signal));
}
export async function sendChat(input: ChatRequest, signal: AbortSignal): Promise<ChatReply> {
  const value = await requestJson('/chat/messages', input, signal);
  if (!value || typeof value !== 'object') throw Error('INVALID_CHAT_RESPONSE');
  const reply = value as ChatReply;
  if (!['answered', 'clarify', 'not_found'].includes(reply.status) || typeof reply.answer !== 'string' || !reply.answer.trim() || reply.answer.length > 6000 ||
    !Array.isArray(reply.sources) || reply.sources.length > 6 || !reply.sources.every(validSource) ||
    (reply.status === 'answered' && !reply.sources.length) || (reply.status === 'not_found' && reply.sources.length)) throw Error('INVALID_CHAT_RESPONSE');
  return reply;
}
