import type { Topic } from '../../features/guides/types';

export const guideTopics = [
  {
    id: 'epic-structure',
    label: { ru: 'Структура эпоса', ky: 'Эпостун түзүлүшү' },
  },
  {
    id: 'oral-tradition',
    label: { ru: 'Устная традиция', ky: 'Оозеки салт' },
  },
  {
    id: 'performance',
    label: { ru: 'Исполнительское искусство', ky: 'Аткаруучулук өнөр' },
  },
  {
    id: 'variation',
    label: { ru: 'Вариативность', ky: 'Варианттуулук' },
  },
  {
    id: 'documentary-heritage',
    label: { ru: 'Документальное наследие', ky: 'Документалдык мурас' },
  },
  {
    id: 'unesco-recognition',
    label: { ru: 'Признание UNESCO', ky: 'UNESCOнун таануусу' },
  },
] as const satisfies readonly Topic[];
