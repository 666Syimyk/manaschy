import { readFileSync } from 'node:fs';
import { chatFailure, validateModelAnswer } from './chat-ollama.mjs';
const catalog = JSON.parse(readFileSync(new URL('../../src/data/epic/catalog.json', import.meta.url), 'utf8'));
const notFound = locale => ({ status: 'not_found', answer: locale === 'ky'
  ? 'Бул төрт томдон сурооңузду ырастаган үзүндү табылган жок. Каармандын атын же окуяны тактап бериңиз.'
  : 'В доступных четырёх томах не удалось найти подтверждение этому моменту. Уточните имя персонажа или опишите событие подробнее.', sources: [] });

export function createChatAnswerer({ index, model }) {
  return {
    async ask(request, callerSignal) {
      const signal = AbortSignal.any([AbortSignal.timeout(180000), ...(callerSignal ? [callerSignal] : [])]);
      try {
        signal.throwIfAborted();
        if (index.getStatus().index !== 'ready') throw chatFailure('INDEX_NOT_READY');
        const hints = await model.expandQuery(request, signal);
        signal.throwIfAborted();
        const context = index.selectContext(index.search([request.question, ...hints], 30));
        if (!context.length) return notFound(request.locale);
        const reply = validateModelAnswer(await model.explain(request, context, signal));
        signal.throwIfAborted();
        if (reply.status === 'answered' && !reply.sourceIds.length) throw chatFailure('INVALID_MODEL_RESPONSE');
        if (reply.status === 'not_found') return notFound(request.locale);
        const sources = [...new Set(reply.sourceIds)].map(id => {
          const chunk = context.find(item => item.id === id);
          const episode = catalog.episodes.find(item => item.id === chunk?.episodeId);
          const volume = catalog.volumes.find(item => item.id === episode?.volumeId);
          if (!chunk || !episode || !volume || chunk.volumeId !== volume.id ||
            !Number.isSafeInteger(chunk.page) || chunk.page < episode.startPage || chunk.page > episode.endPage) throw chatFailure('INVALID_MODEL_RESPONSE');
          return { id, episodeId: episode.id, title: episode.title, volume: volume.number, page: chunk.page,
            href: `/episode/${episode.id}?page=${chunk.page}` };
        });
        return { status: reply.status, answer: reply.answer, sources };
      } catch (error) {
        if (signal.aborted) throw chatFailure(signal.reason?.name === 'TimeoutError' ? 'MODEL_TIMEOUT' : 'CANCELLED');
        throw error;
      }
    },
  };
}
