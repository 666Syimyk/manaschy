export type Locale = 'ru' | 'ky';

export type LocalizedText = Record<Locale, string>;

export interface Topic {
  id: string;
  label: LocalizedText;
}

export interface ClaimReference {
  sourceId: string;
  locator?: string;
  note?: LocalizedText;
}

export interface GuideParagraph {
  text: LocalizedText;
  claimRefs: ClaimReference[];
}

export interface GuideSection {
  id: string;
  heading: LocalizedText;
  paragraphs: GuideParagraph[];
}

export interface GuideArticle {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  sections: GuideSection[];
  topicIds: string[];
  readingMinutes: number;
  status: 'published';
  reviewedAt: string;
}

export interface ReferenceSource {
  id: string;
  title: string;
  publisher?: string;
  sourceType: 'official' | 'archive' | 'library' | 'academic';
  url: string;
  citationText: string;
  lastCheckedAt: string;
  rightsScope: 'link_only';
  rightsNote: LocalizedText;
  status: 'published';
}

export interface GuideProgress {
  firstOpenedAt: string;
  lastOpenedAt: string;
  completedAt?: string;
}

export interface LocalState {
  schemaVersion: 1;
  locale: Locale;
  fontScale: 'small' | 'medium' | 'large';
  onboarded: boolean;
  savedGuideIds: string[];
  guideProgress: Record<string, GuideProgress>;
  lastGuideId?: string;
}
