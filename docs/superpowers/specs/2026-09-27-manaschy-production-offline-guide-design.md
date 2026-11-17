# Manaschy 1.0 Production Offline Guide Design

## Purpose

Manaschy 1.0 will be a production-ready, offline-first cultural guide to the Manas epic tradition. It will provide useful, source-linked educational material without pretending to contain a licensed full epic corpus, playable recordings, a working AI backend, or secure server accounts.

The application must launch without API keys or a backend and expose only complete user flows. Installed Android and iOS builds work after installation without a network connection. The static website requires a connection for its initial page and asset load; it does not claim offline reload or PWA installation in 1.0. Network access from an installed app is limited to opening an external source chosen by the user.

## Product Decision

The release will use the existing Expo 56 visual foundation but replace the prototype's library, audio, AI, and local-account simulation with a focused guide product.

Three product directions were considered:

1. A full text, audio, AI, and account platform. This cannot ship honestly without a licensed content corpus, signed reuse permissions, backend infrastructure, and service credentials.
2. An offline cultural field guide with original explanatory articles and claim-level source links. This is the selected direction because it is useful, self-contained, and compatible with the evidence currently available.
3. A source directory only. This is legally safer but too thin to be the primary consumer experience; its strongest elements will be included as the Sources section of the selected product.

## Release Scope

The first release contains these complete capabilities:

- A concise onboarding screen with one primary action and a working language selector.
- A home dashboard with the last opened guide, reading completion, featured topics, and direct navigation.
- A guide catalog of at least 10 short, original, bilingual, cited articles about the trilogy, oral performance tradition, variants, recording history, and documentary heritage.
- A guide detail reader with source citations, adjustable text size, bookmark control, explicit read or unread state, and related guides.
- Full-text local search over guide titles, summaries, body text, tags, and source metadata.
- A verified source directory with filters, citation details, last-checked dates, rights notes, and safe external-link handling.
- Local bookmarks and reading history.
- Settings for Russian or Kyrgyz interface language and text size.
- A privacy screen and a destructive local-data reset action with an explicit confirmation.
- Responsive phone, tablet, and desktop-web layouts.

The release does not contain:

- Registration, login, email, passwords, birth dates, avatars, or cloud profiles.
- AI chat, RAG, synthetic answers, or chat history.
- Audio controls, autoplay settings, or recordings without documented reuse rights.
- Placeholder chapters, generic episode names, empty variants, fake listening statistics, or hard-coded catalog totals.
- Full modern editions, scans, translations, UNESCO media, or copyrighted recordings without source-specific permission.
- Analytics, advertising, notifications, tracking, or remote data collection.

## Information Architecture

### Public entry

`/` is a lightweight welcome screen. On first launch it explains the product in one paragraph, offers Russian and Kyrgyz interface choices, and has one primary action. After onboarding, `/` redirects to the home tab. There are no authentication routes in the production navigation.

### Main tabs

The mobile tab bar and desktop shell expose five destinations:

1. Home: reading summary, featured guide, recent guide, and topic shortcuts.
2. Guides: searchable and filterable guide catalog.
3. Sources: verified reference directory and citation details.
4. Saved: bookmarked guides and recent reading history.
5. Settings: language, text size, privacy, source methodology, and local-data reset.

### Detail routes

- `/guide/[id]` renders a published guide.
- `/source/[id]` renders a verified source record.
- `/privacy` explains local storage and external links.
- `/methodology` explains what is verified, what is excluded, and how citations are maintained.

Every dynamic route exports static parameters from the bundled content registry so Expo Router static web export generates a valid page for every published record. An invalid ID reached through in-app navigation renders a localized not-found state with a safe route back to the relevant catalog. A root `+not-found` route provides the static 404 page; the hosting configuration must serve that page for unknown direct URLs.

Old prototype URLs will either be removed from navigation or replaced with small local redirects to the closest supported destination. They will not render prototype content.

## Content Strategy

### Editorial content

Guide prose will be newly written for the application and will summarize only facts supported by reviewed references. It will not copy the prose of the two workspace DOCX files or reproduce substantial epic passages. The DOCX files remain editorial research maps, not runtime content.

The editorial backlog covers these topics:

1. The Manas, Semetey, and Seytek trilogy.
2. The role of the manaschi and oral transmission.
3. How performance and variation coexist in the tradition.
4. A careful orientation to the Manas cycle.
5. A careful orientation to the Semetey cycle.
6. A careful orientation to the Seytek cycle.
7. The recording of Sagymbay Orozbakov's narration in 1922 to 1926.
8. The Orozbakov manuscript collection and its preservation.
9. The 2013 UNESCO intangible-heritage listing.
10. The 2023 Memory of the World registration.
11. How to distinguish a narrator, manuscript, edition, translation, and research work.
12. How to verify a quotation or claim about the epic.

The launch catalog contains at least 10 of these topics. Each localized version contains 250 to 600 words, at least two evidence-bearing paragraphs, and citations to every factual paragraph. If a listed topic cannot meet the evidence and localization requirements, it is replaced by another source-backed topic rather than filled with generic prose. The catalog and all progress denominators derive from the actual published array, never from a hard-coded number.

### Sources

Only sources whose identity and URL are independently checked will be marked published. The starting source set prioritizes official UNESCO records, official Kyrgyz academic or university pages, and institutional library catalogs. A downloadable file or public webpage is not treated as a reuse license.

Every 1.0 source record uses the runtime rights scope `link_only`: bibliographic facts and an external link may be displayed, but source text or media is not bundled. Historical Radlov or Valikhanov excerpts are outside the 1.0 scope even if they may qualify for future public-domain use.

The existing Orozbakov record must not claim `permission_granted` for bundled content until written permission covers the exact display, distribution, and commercial use intended by a future release. Translation, AI, and other uses are tracked as independent scopes and are not inferred from that permission. Modern editions, translations, recordings, images, and website copies remain excluded unless separately cleared.

### Localization

Navigation, controls, empty states, errors, accessibility labels, privacy text, and all published guides ship in Russian and Kyrgyz. Localized content is stored together in the same record so a published item cannot silently disappear when the language changes. Content validation fails if either required locale is missing.

Names, titles, dates, URLs, and citation locators are shared data. Translations do not alter those fields. Original-language titles are preserved where useful.

## Data Model

The runtime content model is intentionally smaller than the prototype epic model.

```ts
type Locale = 'ru' | 'ky';

type LocalizedText = Record<Locale, string>;

interface GuideParagraph {
  text: LocalizedText;
  claimRefs: ClaimReference[];
}

interface GuideSection {
  id: string;
  heading: LocalizedText;
  paragraphs: GuideParagraph[];
}

interface ClaimReference {
  sourceId: string;
  locator?: string;
  note?: LocalizedText;
}

interface GuideArticle {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  sections: GuideSection[];
  topicIds: string[];
  readingMinutes: number;
  status: 'published';
  reviewedAt: string;
}

interface ReferenceSource {
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

interface GuideProgress {
  firstOpenedAt: string;
  lastOpenedAt: string;
  completedAt?: string;
}

interface LocalState {
  schemaVersion: 1;
  locale: Locale;
  fontScale: 'small' | 'medium' | 'large';
  onboarded: boolean;
  savedGuideIds: string[];
  guideProgress: Record<string, GuideProgress>;
  lastGuideId?: string;
}
```

Topic IDs resolve through a separate localized topic registry. Source IDs for an article are derived from its paragraph-level claim references so duplicated metadata cannot drift. Selectors provide published guides, localized search, valid bookmarks, completion counts, recent guides, and static route parameters. Screens do not import mutable arrays directly.

## State and Privacy

Zustand and AsyncStorage remain for non-sensitive local preferences and reading state. The production store uses a new storage key and a versioned schema.

On first production launch, a one-time migration permanently removes the legacy `manaschy-app-store` value because it may contain plaintext demo passwords, email addresses, birth dates, avatar data, and chat history. No sensitive field is copied. Only a supported language or text-size preference may be migrated after strict validation.

The application does not send local state anywhere. Opening an external source leaves the app and is initiated only by the user. The privacy screen names every locally stored field and explains that clearing application data or using Reset local data removes it.

Reset local data clears the production store, restores defaults, and returns to onboarding. The UI requires an explicit confirmation and states that the operation cannot be undone.

## Search and Reading Flow

Search is deterministic and offline. A normalized index is built from both locales, localized topic labels, citations, and source titles. Search ignores case and punctuation and supports Kyrgyz characters without replacing the original displayed text. Empty queries show the catalog; unmatched queries show a localized zero state and a clear-search action.

Opening a guide records `firstOpenedAt`, refreshes `lastOpenedAt`, and sets `lastGuideId`. Completion is explicit: the reader offers Mark as read and Mark as unread controls near the end. Progress is the number of completed published guides divided by the current number of published guides. Removing or adding content cannot leave an invented denominator.

Bookmarks are idempotent and are pruned during hydration if a guide no longer exists. History is derived from valid progress records and ordered by `lastOpenedAt`.

## External Links and Error Handling

All bundled source URLs must use HTTPS. Before opening a source, the app verifies that the URL belongs to the published source record and asks the platform whether it can open the URL. Failure produces a localized, non-blocking message and keeps the user on the source page.

Storage hydration failure falls back to default local state without blocking the content catalog. A corrupt or unsupported state version is discarded without copying sensitive legacy values. Missing images use a deterministic branded fallback. No screen depends on network availability.

Every async action exposes a visible pressed, loading, success, or error state where relevant. No decorative control is rendered as a button unless it performs an action.

## Interface and Accessibility

The existing white, red, gold, and ivory visual system and generated brand assets are retained after provenance and dimension checks. Layout uses the current responsive shell but removes empty desktop affordances such as the inert notification button and fake global shortcut.

Requirements for every interactive element:

- A semantic role and localized accessible name.
- Selected, checked, disabled, or expanded state where applicable.
- A minimum practical touch target of 44 by 44 points.
- Keyboard activation and visible focus on web.
- Text contrast suitable for normal text.
- No information conveyed by color alone.

Text-size settings apply to article body text, headings, cards, navigation labels, and empty states while preserving layout at large scale. Login-specific keyboard and form problems disappear because authentication is removed.

## Release Configuration

The repository targets Expo SDK 56, React Native 0.85, React 19.2.3, Android 7 and newer, iOS 16.4 and newer, and static web output.

The production app configuration includes:

- Android package `kg.manaschy.app` and initial `versionCode` 1.
- iOS bundle identifier `kg.manaschy.app` and initial `buildNumber` 1.
- Existing `manaschy` deep-link scheme.
- No image-picker plugin and no photo, camera, microphone, notification, or tracking permission.
- Static web output with generated parameters for every dynamic content route.
- Stable Expo Router features only; the experimental React compiler flag is removed for the first release.
- EAS development, preview, and production profiles. Android preview produces an installable APK; Android production produces an AAB. iOS production is configured for the publisher's signing account.

Store signing, store accounts, final legal publisher name, store screenshots, and store submission are external publishing actions. The repository will be ready for them but will not invent owner credentials or accept store agreements. Generated Android manifests and iOS property lists are inspected to confirm that removed plugins did not leave photo, camera, microphone, notification, or tracking permissions.

## Testing Strategy

### Automated tests

Tests cover:

- Content validation: unique IDs, required locales, HTTPS links, resolvable paragraph-level citations, valid review dates, and no placeholder or draft records in the runtime bundle.
- Search normalization and ranking in Russian and Kyrgyz.
- Published-content selectors and completion denominators.
- Bookmark, completion, history, reset, and hydration behavior.
- Legacy-state cleanup without copying credentials or personal data.
- Static parameter generation for every dynamic route.
- Critical screen flows: onboarding, catalog search, guide completion, bookmark toggling, settings, and invalid IDs.
- Accessibility roles and labels for primary navigation and reader controls.

### Build and runtime checks

The completion gate is:

1. A clean dependency install succeeds from the lockfile.
2. Lint and strict TypeScript succeed.
3. Unit and component tests succeed.
4. Content, source, permission, and asset validators succeed without relying on an undeclared executable.
5. Expo Doctor succeeds or any external network failure is documented separately from project errors.
6. Static web export succeeds and contains every guide and source route, plus the static 404 document.
7. Android and iOS JavaScript production bundles succeed through Expo export. This is recorded as bundle validation, not a native binary build.
8. An installable Android preview or release build succeeds either locally or through the publisher's EAS account. If publisher credentials are unavailable, repository completion is reported separately from this external build gate.
9. The website is smoke-tested at phone and desktop widths. A normal connected reload is required; offline web reload is not a 1.0 promise.
10. A native smoke test verifies onboarding, navigation, offline content, persistence, reset, and external links on an available Android device or Expo Go client.
11. Generated Android and iOS native configuration is inspected for unintended permissions.
12. A manual editorial matrix confirms that each published paragraph is supported by its cited source, both localizations preserve the same claim, and every retained brand asset is project-generated or otherwise documented for use. Automated validation checks structure but does not claim to prove factual support, translation quality, or asset ownership.

No completion claim is made from lint alone.

## Implementation Boundaries

The required 1.0 slice is the five-tab application, 10 bilingual cited guides, published-source details, local search, bookmarks, completion and history, settings, privacy and methodology pages, responsive accessibility, production configuration, and the verification gates above. No required 1.0 feature is hidden behind a future flag.

PWA offline caching, signed iOS distribution, public-domain text excerpts, licensed audio, AI, accounts, quizzes, a CMS, analytics, and a larger guide catalog are explicit follow-on projects. They are not allowed to delay or partially enter the 1.0 implementation.

The prototype is replaced in focused layers:

1. Introduce the production content and state models with validators and tests.
2. Migrate navigation away from authentication, AI, audio, and episode placeholders.
3. Build guide, source, search, saved, settings, privacy, and methodology flows.
4. Complete localization, accessibility, and responsive behavior.
5. Add release configuration and automated checks.
6. Run the full verification matrix and correct all failures before handoff.

Unrelated framework upgrades, a backend, analytics, a CMS, payments, social features, and unverified corpus ingestion are outside Manaschy 1.0.

## Definition of Done

Manaschy 1.0 is done when a new user can install or open it, choose a language, browse and search substantive cited guides, inspect sources, save and complete guides, change accessibility preferences, understand local privacy, reset all local data, close the application, reopen it, and see the expected non-sensitive state restored.

The production navigation contains no dead controls, mock delays, placeholder records, fake counts, plaintext credentials, or claims of unavailable audio, AI, or full epic text. All required automated checks and exports pass, and any remaining action is limited to publisher-owned signing or store submission.
