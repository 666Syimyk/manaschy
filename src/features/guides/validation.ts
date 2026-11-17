import type { GuideArticle, LocalizedText, ReferenceSource, Topic } from './types';

const LOCALES = ['ru', 'ky'] as const;
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function countLocalizedWords(text: string): number {
  const normalized = text.trim();
  return normalized ? normalized.split(/\s+/u).length : 0;
}

function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function localizedTextErrors(value: LocalizedText, field: string): string[] {
  return LOCALES.flatMap((locale) =>
    typeof value?.[locale] === 'string' && value[locale].trim().length > 0
      ? []
      : [`${field} is missing locale ${locale}`],
  );
}

function duplicateIdErrors(records: readonly { id: string }[], kind: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const record of records) {
    if (seen.has(record.id)) {
      duplicates.add(record.id);
    }
    seen.add(record.id);
  }

  return [...duplicates].map((id) => `Duplicate ${kind} id: ${id}`);
}

function stableIdError(id: string, field: string): string[] {
  return KEBAB_CASE.test(id) ? [] : [`${field} must be a stable kebab-case id: ${id}`];
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateSourceRegistry(
  sources: readonly ReferenceSource[],
  topics: readonly Topic[],
): string[] {
  const errors = [
    ...duplicateIdErrors(sources, 'source'),
    ...duplicateIdErrors(topics, 'topic'),
  ];

  for (const topic of topics) {
    errors.push(...stableIdError(topic.id, 'Topic id'));
    errors.push(...localizedTextErrors(topic.label, `Topic ${topic.id} label`));
  }

  for (const source of sources) {
    errors.push(...stableIdError(source.id, 'Source id'));
    if (!isHttpsUrl(source.url)) {
      errors.push(`Source ${source.id} must use an HTTPS URL`);
    }
    if (!isValidIsoDate(source.lastCheckedAt)) {
      errors.push(`Source ${source.id} has invalid lastCheckedAt: ${source.lastCheckedAt}`);
    }
    if (source.status !== 'published') {
      errors.push(`Source ${source.id} must have status published`);
    }
    if (source.rightsScope !== 'link_only') {
      errors.push(`Source ${source.id} must have rightsScope link_only`);
    }
    errors.push(
      ...localizedTextErrors(source.rightsNote, `Source ${source.id} rightsNote`),
    );
  }

  return errors;
}

export function validateGuideRegistry(
  guides: readonly GuideArticle[],
  sources: readonly ReferenceSource[],
  topics: readonly Topic[],
): string[] {
  const errors = duplicateIdErrors(guides, 'guide');
  const sourceIds = new Set(sources.map(({ id }) => id));
  const topicIds = new Set(topics.map(({ id }) => id));

  for (const guide of guides) {
    errors.push(...stableIdError(guide.id, 'Guide id'));
    errors.push(...localizedTextErrors(guide.title, `Guide ${guide.id} title`));
    errors.push(...localizedTextErrors(guide.summary, `Guide ${guide.id} summary`));

    if (guide.status !== 'published') {
      errors.push(`Guide ${guide.id} must have status published`);
    }
    if (!isValidIsoDate(guide.reviewedAt)) {
      errors.push(`Guide ${guide.id} has invalid reviewedAt: ${guide.reviewedAt}`);
    }
    if (!Number.isInteger(guide.readingMinutes) || guide.readingMinutes < 1) {
      errors.push(`Guide ${guide.id} readingMinutes must be a positive integer`);
    }

    for (const topicId of guide.topicIds) {
      if (!topicIds.has(topicId)) {
        errors.push(`Guide ${guide.id} references unknown topic: ${topicId}`);
      }
    }

    const sectionIds = new Set<string>();
    for (const section of guide.sections) {
      if (sectionIds.has(section.id)) {
        errors.push(`Guide ${guide.id} has duplicate section id: ${section.id}`);
      }
      sectionIds.add(section.id);
      errors.push(...stableIdError(section.id, `Guide ${guide.id} section id`));
      errors.push(
        ...localizedTextErrors(section.heading, `Guide ${guide.id} section ${section.id} heading`),
      );

      section.paragraphs.forEach((paragraph, paragraphIndex) => {
        const paragraphNumber = paragraphIndex + 1;
        errors.push(
          ...localizedTextErrors(
            paragraph.text,
            `Guide ${guide.id} section ${section.id} paragraph ${paragraphNumber} text`,
          ),
        );

        if (!Array.isArray(paragraph.claimRefs) || paragraph.claimRefs.length === 0) {
          errors.push(
            `Guide ${guide.id} section ${section.id} paragraph ${paragraphNumber} has no claim references`,
          );
        }

        for (const claimRef of paragraph.claimRefs ?? []) {
          if (!sourceIds.has(claimRef.sourceId)) {
            errors.push(`Guide ${guide.id} references unknown source: ${claimRef.sourceId}`);
          }
          if (claimRef.note) {
            errors.push(
              ...localizedTextErrors(
                claimRef.note,
                `Guide ${guide.id} reference ${claimRef.sourceId} note`,
              ),
            );
          }
        }
      });
    }

    for (const locale of LOCALES) {
      const wordCount = guide.sections.reduce(
        (total, section) =>
          total +
          section.paragraphs.reduce(
            (sectionTotal, paragraph) =>
              sectionTotal + countLocalizedWords(paragraph.text?.[locale] ?? ''),
            0,
          ),
        0,
      );
      if (wordCount < 250 || wordCount > 600) {
        errors.push(`Guide ${guide.id} has ${wordCount} ${locale} words; expected 250-600`);
      }
    }
  }

  return errors;
}
