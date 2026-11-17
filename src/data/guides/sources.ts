import type { ReferenceSource } from '../../features/guides/types';
import { epicVolumes } from '../epic';

const LINK_ONLY_NOTE = {
  ru: 'В приложении хранятся только библиографические сведения и ссылка; текст и медиа источника не включены.',
  ky: 'Тиркемеде библиографиялык маалымат жана шилтеме гана сакталат; булактын тексти менен медиасы кошулган эмес.',
} as const;

export const referenceSources = [
  {
    id: 'unesco-ich-00876',
    title: 'Kyrgyz epic trilogy: Manas, Semetey, Seytek',
    publisher: 'UNESCO Intangible Cultural Heritage',
    sourceType: 'official',
    url: 'https://ich.unesco.org/en/RL/kyrgyz-epic-trilogy-manas-semetey-seytek-00876',
    citationText:
      'UNESCO Intangible Cultural Heritage. “Kyrgyz epic trilogy: Manas, Semetey, Seytek.” Nomination file No. 00876; inscribed in 2013.',
    lastCheckedAt: '2026-09-27',
    rightsScope: 'link_only',
    rightsNote: LINK_ONLY_NOTE,
    status: 'published',
  },
  {
    id: 'unesco-decision-8-com-8-19',
    title: 'Decision of the Intergovernmental Committee: 8.COM 8.19',
    publisher: 'UNESCO Intangible Cultural Heritage',
    sourceType: 'official',
    url: 'https://ich.unesco.org/en/d%C3%A9cisions/8.COM/8.19?dec=decisions&ref_decision=8.COM',
    citationText:
      'UNESCO Intergovernmental Committee for the Safeguarding of the Intangible Cultural Heritage. Decision 8.COM 8.19, Baku, 2013.',
    lastCheckedAt: '2026-09-27',
    rightsScope: 'link_only',
    rightsNote: LINK_ONLY_NOTE,
    status: 'published',
  },
  {
    id: 'unesco-memory-orozbakov',
    title: 'Manuscript of the Kyrgyz epic Manas by the narrator Sagymbay Orozbakov',
    publisher: 'UNESCO',
    sourceType: 'archive',
    url: 'https://www.unesco.org/en/memory-world/manuscript-kyrgyz-epic-manas-narrator-sagymbay-orozbakov',
    citationText:
      'UNESCO Memory of the World. “Manuscript of the Kyrgyz epic Manas by the narrator Sagymbay Orozbakov.” Registration year 2023.',
    lastCheckedAt: '2026-09-27',
    rightsScope: 'link_only',
    rightsNote: LINK_ONLY_NOTE,
    status: 'published',
  },
  {
    id: 'unesco-memory-announcement-2023',
    title: 'The Manas epic manuscripts are included in the Memory of the World',
    publisher: 'UNESCO',
    sourceType: 'official',
    url: 'https://www.unesco.org/en/articles/manas-epic-manuscripts-are-included-memory-world',
    citationText:
      'UNESCO. “The Manas epic manuscripts are included in the Memory of the World.” 8 June 2023; updated 27 June 2023.',
    lastCheckedAt: '2026-09-27',
    rightsScope: 'link_only',
    rightsNote: LINK_ONLY_NOTE,
    status: 'published',
  },
  ...epicVolumes.map((volume): ReferenceSource => ({
    id: `orozbakov-2018-volume-${volume.number}`,
    title: `Сагымбай Орозбаков. «Манас». Том ${volume.number} (2018)`,
    publisher: 'Институт языка и литературы им. Ч. Айтматова НАН КР; Принт-экспресс',
    sourceType: 'academic',
    url: volume.pdfUrl,
    citationText: volume.citation,
    lastCheckedAt: '2026-09-28',
    rightsScope: 'link_only',
    rightsNote: {
      ru: 'Оригинал доступен на manas-discovery.kg. Локальный читатель извлекает текст выбранной страницы из PDF; копия книги не включена в сборку. Открытая лицензия на перепубликацию не установлена.',
      ky: 'Түпнуска manas-discovery.kg сайтында жеткиликтүү. Жергиликтүү окугуч тандалган беттин текстин PDFтен чыгарат; китептин көчүрмөсү тиркеменин курамына кирбейт. Кайра жарыялоого ачык лицензия аныкталган эмес.',
    },
    status: 'published',
  })),
] as const satisfies readonly ReferenceSource[];
