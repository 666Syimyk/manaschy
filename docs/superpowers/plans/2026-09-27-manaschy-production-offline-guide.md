# Manaschy 1.0 Production Offline Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Manaschy prototype with a launchable, backend-free Expo 56 cultural guide containing bilingual source-backed articles, offline native reading state, complete navigation, and production release checks.

**Architecture:** A read-only bundled registry supplies topics, references, and paragraph-cited guide articles. Pure selectors and search functions sit between that registry and route screens; a separate versioned Zustand store persists only language, text size, bookmarks, and reading progress after deleting the sensitive legacy store. Expo Router serves five responsive tabs plus statically generated guide and source details.

**Tech Stack:** Expo SDK 56, React Native 0.85, React 19.2.3, TypeScript 6, Expo Router, Zustand, AsyncStorage, Jest with `jest-expo`, React Native Testing Library, `tsx`, EAS configuration.

**Spec:** `docs/superpowers/specs/2026-09-27-manaschy-production-offline-guide-design.md`

## Global Constraints

- Use only Expo SDK 56-compatible packages and the exact SDK 56 documentation; target React Native 0.85 and React 19.2.3.
- Target Android 7+, iOS 16.4+, and static web; only installed native builds promise offline startup.
- Runtime content contains at least 10 published guides, each 250–600 words in both Russian and Kyrgyz with citations on every paragraph.
- Every runtime reference uses HTTPS, `status: 'published'`, and `rightsScope: 'link_only'`; no modern text, translation, scan, image, audio, or UNESCO media is bundled.
- No registration, login, password, email, birth date, avatar, AI, RAG, audio, analytics, advertising, notifications, tracking, or remote persistence remains in production navigation or state.
- Persist only `schemaVersion`, `locale`, `fontScale`, `onboarded`, saved guide IDs, guide progress, and the last guide ID.
- Permanently remove the legacy `manaschy-app-store` before copying its validated locale or font scale; never migrate personal fields.
- Use Android package and iOS bundle ID `kg.manaschy.app`, app version `1.0.0`, Android version code `1`, and iOS build number `1`.
- Preserve unrelated user files and staged changes. Commit only paths belonging to the current task.

## Review Focus

- Corrupt, unsupported, or privacy-sensitive legacy storage must leave the catalog usable, copy no personal data, and retry deletion on a later launch. Task 5 pins this with storage-failure and hostile-payload tests.
- Unknown guide, source, or direct web paths must not crash or expose a blank page. Tasks 7 and 8 pin in-app invalid IDs; Task 10 verifies the exported not-found document and documents host HTTP 404 behavior.
- Russian and Kyrgyz queries containing mixed case, punctuation, `ң`, `ө`, or `ү` must rank deterministically. Task 4 pins normalization and ranking.
- An unsupported, malformed, or failed external URL must keep the user inside Manaschy and show a localized error. Task 7 pins every failure path.
- Large text, keyboard focus, mobile tab selection, and narrow phone layouts must retain usable 44-point controls and meaningful accessible state. Tasks 6 and 9 pin semantics and scaled typography, followed by visual smoke checks.

---

## File Structure

### Production domain and data

- Create `src/features/guides/types.ts` for the approved content contracts.
- Create `src/features/guides/validation.ts` for structural runtime validation.
- Create `src/features/guides/selectors.ts` for lookups, related content, progress totals, and static parameters.
- Create `src/features/guides/search.ts` for Unicode normalization and deterministic local ranking.
- Create `src/data/guides/topics.ts` and `src/data/guides/sources.ts` for published registries.
- Create ten modules in `src/data/guides/articles/`: `trilogy.ts`, `manaschi.ts`, `variation.ts`, `manas-cycle.ts`, `semetey-cycle.ts`, `seytek-cycle.ts`, `orozbakov-recording.ts`, `orozbakov-manuscripts.ts`, `unesco-2013.ts`, and `memory-of-world-2023.ts`.
- Create `src/data/guides/index.ts` as the only runtime registry entry point.

### Local state

- Create `src/features/local-state/schema.ts`, `legacy-migration.ts`, and `store.ts`.
- Retire `src/features/library/store.ts` only after every route uses the new store.

### Interface and routes

- Rewrite `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/(tabs)/_layout.tsx`, and `src/app/(tabs)/index.tsx`.
- Create `src/app/(tabs)/guides.tsx`, `sources.tsx`, `saved.tsx`, and `settings.tsx`.
- Create `src/app/guide/[id].tsx`, `src/app/source/[id].tsx`, `src/app/privacy.tsx`, `src/app/methodology.tsx`, and `src/app/+not-found.tsx`.
- Create focused screen modules under `src/features/onboarding`, `home`, `sources`, `saved`, and `settings`; keep route files thin.
- Create `src/components/guide-card.tsx`, `source-card.tsx`, `language-selector.tsx`, `search-field.tsx`, `empty-state.tsx`, `reading-controls.tsx`, and `external-source-button.tsx`.
- Rewrite `src/components/nav/mobile-tab-bar.tsx`, `mobile-header.tsx`, `desktop-sidebar.tsx`, `desktop-topbar.tsx`, and `responsive-shell.tsx`.
- Rewrite `src/i18n/ru.ts`, `ky.ts`, and `index.ts`, plus the production parts of `src/shared/ui/index.tsx` and `src/components/ui.tsx`.

### Tooling and release

- Create `jest.config.js` and `tests/setup.ts`.
- Replace the release-facing content validators in `scripts/content/validate-content.ts` and `scripts/content/validate-sources.ts`; remove `validate-permissions.ts` from the release gate.
- Create `scripts/release/verify-static-export.ts` and `scripts/release/validate-app-permissions.ts`.
- Modify `package.json`, `package-lock.json`, `app.json`, `README.md`, `assets/images.ts`, `assets/ui/README.md`, and `assets/branding/README.md`.
- Create `eas.json`, `docs/CONTENT_REVIEW.md`, and `docs/RELEASE_CHECKLIST.md`.

### Prototype removal after cutover

- Replace obsolete auth and episode URLs with small local redirects during the route cutover; remove obsolete AI, profile, avatar, and episode implementation modules only after `rg` proves they have no production imports.
- Remove `src/data/content-database.ts`, `src/data/mock-database.ts`, `src/data/epic/`, `src/services/ai-service.ts`, `rag-service.ts`, `audio-service.ts`, `avatar-service.ts`, `avatar-service.web.ts`, `src/features/progress/`, and old domain types after the new registries compile.
- Keep research DOCX files and research documentation untouched; they remain editorial inputs, not runtime content.

---

### Task 1: Test Harness and Guide Contracts

**Files:**
- Modify: `package.json`, `package-lock.json`, `tsconfig.json`
- Create: `jest.config.js`, `tests/setup.ts`, `tests/guides/validation.test.ts`
- Create: `src/features/guides/types.ts`, `src/features/guides/validation.ts`

**Interfaces:**
- Produces: `Locale`, `LocalizedText`, `Topic`, `ClaimReference`, `GuideParagraph`, `GuideSection`, `GuideArticle`, `ReferenceSource`, `GuideProgress`, `LocalState`.
- Produces: `countLocalizedWords(text: string): number`, `validateSourceRegistry(sources: readonly ReferenceSource[], topics: readonly Topic[]): string[]`, and `validateGuideRegistry(guides: readonly GuideArticle[], sources: readonly ReferenceSource[], topics: readonly Topic[]): string[]`.

- [ ] **Step 1: Install the official Expo 56 test dependencies and local TypeScript runner**

Run `npx expo install jest-expo jest @types/jest @testing-library/react-native -- --dev`, then `npm install --save-dev tsx`. Expected: lockfile records compatible versions and no on-demand `npx tsx` download is needed.

- [ ] **Step 2: Configure deterministic tests**

Add `jest.config.js` with preset `jest-expo`, `tests/setup.ts` as `setupFilesAfterEnv`, and test matching under `tests/**/*.test.ts?(x)`. Add `test` as `jest --runInBand`, `test:ci` as `jest --ci --runInBand`, and `typecheck` as `tsc --noEmit`.

- [ ] **Step 3: Write the failing registry validation tests**

In `tests/guides/validation.test.ts`, assert that invalid fixtures report duplicate IDs, a missing locale, 249- and 601-word content, uncited paragraphs, unresolved source/topic IDs, an HTTP URL, an invalid ISO date, non-published status, and a rights scope other than `link_only`. Assert minimal valid source and guide fixtures return `[]` from their respective validators.

- [ ] **Step 4: Run the focused test and confirm the missing module failure**

Run `npm test -- tests/guides/validation.test.ts`. Expected: FAIL because `types.ts` or `validation.ts` does not exist.

- [ ] **Step 5: Implement the domain contracts and structural validator**

Use the exact property names from the approved spec. `GuideParagraph.claimRefs` is required and non-empty; `ReferenceSource.rightsScope` accepts only `'link_only'`; dates use `YYYY-MM-DD`; topic IDs and record IDs use stable kebab-case.

- [ ] **Step 6: Run focused and static checks**

Run `npm test -- tests/guides/validation.test.ts` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 7: Commit the test foundation**

Commit only the files above with message `test: add production guide contracts`.

### Task 2: Verified Topic and Source Registries

**Files:**
- Create: `src/data/guides/topics.ts`, `src/data/guides/sources.ts`, `src/data/guides/index.ts`
- Create: `tests/guides/sources.test.ts`
- Modify: `scripts/content/validate-sources.ts`, `package.json`

**Interfaces:**
- Produces: `guideTopics: readonly Topic[]`, `referenceSources: readonly ReferenceSource[]`.
- Produces: `getPublishedSources(): readonly ReferenceSource[]`, `getSourceById(id: string): ReferenceSource | undefined`, `getSourceStaticParams(): { id: string }[]`.

- [ ] **Step 1: Re-open and verify the four official UNESCO pages**

Check `https://ich.unesco.org/en/RL/kyrgyz-epic-trilogy-manas-semetey-seytek-00876`, `https://ich.unesco.org/en/d%C3%A9cisions/8.COM/8.19?dec=decisions&ref_decision=8.COM`, `https://www.unesco.org/en/memory-world/manuscript-kyrgyz-epic-manas-narrator-sagymbay-orozbakov`, and `https://www.unesco.org/en/articles/manas-epic-manuscripts-are-included-memory-world`. Record only claims visible on those pages; use `lastCheckedAt: '2026-09-27'` and `rightsScope: 'link_only'`.

- [ ] **Step 2: Write the failing registry tests**

Assert exact source IDs `unesco-ich-00876`, `unesco-decision-8-com-8-19`, `unesco-memory-orozbakov`, and `unesco-memory-announcement-2023`; all URLs are HTTPS, all records are published/link-only, source IDs are unique, and no title or rights note claims reuse permission. Assert topic IDs are unique and both labels are non-empty.

- [ ] **Step 3: Run the source tests and confirm failure**

Run `npm test -- tests/guides/sources.test.ts`. Expected: FAIL because the production registries are absent.

- [ ] **Step 4: Implement topics, sources, and pure source selectors**

Create localized topic labels and the four checked source records. Do not import or promote any record from `src/data/epic/sources.ts`.

- [ ] **Step 5: Replace the source validation CLI**

Make `scripts/content/validate-sources.ts` call `validateSourceRegistry(referenceSources, guideTopics)`, print each error, and set a non-zero exit code on failure. Point `sources:validate` to local `tsx` without `npx`.

- [ ] **Step 6: Verify sources**

Run `npm test -- tests/guides/sources.test.ts`, `npm run sources:validate`, and `npm run typecheck`. Expected: PASS.

- [ ] **Step 7: Commit the source registry**

Commit only Task 2 files with message `feat: add verified source registry`.

### Task 3: Bilingual Cited Guide Corpus

**Files:**
- Create: the ten exact files under `src/data/guides/articles/` listed in File Structure
- Modify: `src/data/guides/index.ts`, `scripts/content/validate-content.ts`, `package.json`
- Create: `tests/guides/content.test.ts`, `docs/CONTENT_REVIEW.md`

**Interfaces:**
- Produces: `guideArticles: readonly GuideArticle[]`.
- Extends: `getPublishedGuides(): readonly GuideArticle[]`, `getGuideById(id: string): GuideArticle | undefined`, and `getGuideStaticParams(): { id: string }[]`.

- [ ] **Step 1: Write the failing real-corpus contract tests**

Assert exactly 10 initial guides, unique stable IDs, 250–600 words per locale, at least two paragraphs per guide, citations on every paragraph, resolvable topics/sources, positive reading minutes, at least one unique cited source per guide, and no strings matching prototype placeholder or permission claims.

- [ ] **Step 2: Run the corpus test and confirm failure**

Run `npm test -- tests/guides/content.test.ts`. Expected: FAIL because article modules do not exist.

- [ ] **Step 3: Author the trilogy guide**

Create `trilogy.ts`; every factual paragraph cites checked sources and preserves the same claim in Russian and Kyrgyz.

- [ ] **Step 4: Author the manaschi guide**

Create `manaschi.ts` under the same content contract.

- [ ] **Step 5: Author the variation guide**

Create `variation.ts` under the same content contract.

- [ ] **Step 6: Author the Manas cycle guide**

Create `manas-cycle.ts` under the same content contract.

- [ ] **Step 7: Author the Semetey cycle guide**

Create `semetey-cycle.ts` under the same content contract.

- [ ] **Step 8: Author the Seytek cycle guide**

Create `seytek-cycle.ts` under the same content contract.

- [ ] **Step 9: Author the Orozbakov recording guide**

Create `orozbakov-recording.ts` under the same content contract.

- [ ] **Step 10: Author the Orozbakov manuscripts guide**

Create `orozbakov-manuscripts.ts` under the same content contract.

- [ ] **Step 11: Author the UNESCO 2013 guide**

Create `unesco-2013.ts` under the same content contract.

- [ ] **Step 12: Author the Memory of the World 2023 guide**

Create `memory-of-world-2023.ts` under the same content contract.

- [ ] **Step 13: Build the runtime article registry and validator CLI**

Export the immutable array from `src/data/guides/index.ts`. Make `scripts/content/validate-content.ts` run `validateGuideRegistry(guideArticles, referenceSources, guideTopics)` and fail the process on any error. Point `content:validate` to local `tsx`.

- [ ] **Step 14: Perform and record paragraph-level editorial review**

In `docs/CONTENT_REVIEW.md`, create one row per paragraph with guide ID, paragraph index, cited source and locator, Russian/Kyrgyz claim equivalence result, reviewer date, and pass/fail. Resolve every failed row before continuing; do not claim cultural-expert review.

- [ ] **Step 15: Verify the corpus**

Run `npm test -- tests/guides/content.test.ts`, `npm run content:validate`, `npm run sources:validate`, and `npm run typecheck`. Expected: PASS with at least 10 guides.

- [ ] **Step 16: Commit the guide corpus**

Commit only Task 3 files with message `feat: add bilingual cited guides`.

### Task 4: Search and Derived Selectors

**Files:**
- Create: `src/features/guides/search.ts`, `src/features/guides/selectors.ts`
- Create: `tests/guides/search.test.ts`, `tests/guides/selectors.test.ts`

**Interfaces:**
- Produces: `normalizeSearchText(value: string): string`.
- Produces: `searchGuides(query: string, locale: Locale): GuideArticle[]`, with title weight 5, localized topic weight 3, summary weight 2, and body/source weight 1; ties retain registry order.
- Produces: `getSourcesForGuide(id: string): ReferenceSource[]`, `getRelatedGuides(id: string, limit?: number): GuideArticle[]`, `getCompletionSummary(progress: Record<string, GuideProgress>): { completed: number; total: number }`, `getValidSavedGuides(ids: readonly string[]): GuideArticle[]`, and `getRecentGuides(progress: Record<string, GuideProgress>): GuideArticle[]`.

- [ ] **Step 1: Write failing Unicode search tests**

Assert empty/whitespace query returns the full registry, case and punctuation normalize, `ң ө ү` remain searchable, Russian and Kyrgyz title matches outrank body matches, source-title matches work, and equal scores preserve registry order.

- [ ] **Step 2: Write failing selector tests**

Assert stale saved/progress IDs are pruned, completion total equals the current registry length, completed count ignores invalid IDs, recent guides sort by `lastOpenedAt`, related guides exclude the current ID, and source lists are derived from paragraph references.

- [ ] **Step 3: Run focused tests and confirm missing implementations**

Run `npm test -- tests/guides/search.test.ts tests/guides/selectors.test.ts`. Expected: FAIL.

- [ ] **Step 4: Implement normalization and deterministic weighted search**

Normalize with Unicode NFKC, lowercase, and `/[^\p{L}\p{N}]+/gu`; index both locales while using the selected locale for display-weighted matches.

- [ ] **Step 5: Implement immutable selectors**

Return registry-backed arrays without mutating content or caller state. Default related-guide limit is 3.

- [ ] **Step 6: Verify search and selectors**

Run the two focused tests and `npm run typecheck`. Expected: PASS.

- [ ] **Step 7: Commit search and selectors**

Commit Task 4 files with message `feat: add offline guide search`.

### Task 5: Privacy-Safe Local State and Legacy Cleanup

**Files:**
- Create: `src/features/local-state/schema.ts`, `src/features/local-state/legacy-migration.ts`, `src/features/local-state/store.ts`
- Create: `tests/state/schema.test.ts`, `tests/state/legacy-migration.test.ts`, `tests/state/store.test.ts`

**Interfaces:**
- Produces constants `GUIDE_STORE_KEY = 'manaschy-guide-store-v1'` and `LEGACY_STORE_KEY = 'manaschy-app-store'`.
- Produces: `sanitizeLocalState(input: unknown, validGuideIds: ReadonlySet<string>): LocalState`, `decodeStoredState(raw: string | null, validGuideIds: ReadonlySet<string>): LocalState`.
- Produces: `migrateLegacyStorage(storage: Pick<typeof AsyncStorage, 'getItem' | 'removeItem'>): Promise<Partial<Pick<LocalState, 'locale' | 'fontScale'>>>`.
- Produces: `useGuideStore` with `initialize`, `finishOnboarding`, `setLocale`, `setFontScale`, `openGuide`, `setGuideCompleted`, `toggleSavedGuide`, and `resetLocalData` actions.

- [ ] **Step 1: Write failing schema and hostile-payload tests**

Assert corrupt JSON, wrong schema versions, unknown keys, prototype personal fields, invalid IDs, invalid enums, and malformed dates fall back or are pruned. Assert valid `firstOpenedAt` is preserved and `lastOpenedAt` is refreshed.

- [ ] **Step 2: Write failing migration tests**

Assert a legacy Zustand wrapper may contribute only exact `ru|ky` and `small|medium|large` values after `removeItem` succeeds. Assert password, email, birth date, avatar, users, and messages never appear in the result. If legacy removal fails, return `{}` and allow a later initialization to retry.

- [ ] **Step 3: Write failing store action tests**

Assert unknown guide IDs are ignored, bookmark toggling is idempotent, explicit complete/uncomplete works, reset removes the production key and returns onboarding defaults, and the catalog remains usable when storage read/write/remove rejects.

- [ ] **Step 4: Run state tests and confirm failure**

Run `npm test -- tests/state`. Expected: FAIL because the local-state modules do not exist.

- [ ] **Step 5: Implement schema decoding and legacy deletion first**

Do not hydrate or write the new store until the legacy removal attempt completes. Copy preferences only after successful removal and only when no valid production preference exists.

- [ ] **Step 6: Implement the versioned Zustand store**

Persist only approved `LocalState` fields under `GUIDE_STORE_KEY`; expose a hydration flag so routing waits without requiring authentication.

- [ ] **Step 7: Verify state behavior**

Run `npm test -- tests/state` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 8: Commit local state**

Commit Task 5 files with message `feat: add private local reading state`.

### Task 6: Production Shell, Onboarding, Home, and Navigation

**Files:**
- Modify: `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`
- Create: `src/app/(tabs)/guides.tsx`, `src/app/(tabs)/sources.tsx`, `src/app/(tabs)/saved.tsx`, `src/app/(tabs)/settings.tsx`
- Create: `src/features/onboarding/onboarding-screen.tsx`, `src/features/home/home-screen.tsx`
- Modify: `src/i18n/ru.ts`, `src/i18n/ky.ts`, `src/i18n/index.ts`, `src/shared/ui/index.tsx`, `src/components/ui.tsx`
- Create: `src/components/language-selector.tsx`, `src/components/empty-state.tsx`
- Modify: all five files in `src/components/nav/`
- Delete during the same cutover: conflicting top-level `src/app/settings.tsx` and `src/app/sources.tsx`
- Delete during the same cutover: obsolete tab routes `src/app/(tabs)/episodes.tsx`, `ai.tsx`, `favorites.tsx`, and `profile.tsx`
- Replace during the same cutover with local redirects: `src/app/login.tsx`, `register.tsx`, `edit-profile.tsx`, `episode/[id].tsx`, `history.tsx`, and `variants.tsx`
- Test: `tests/screens/onboarding.test.tsx`, `tests/screens/home.test.tsx`, `tests/screens/navigation.test.tsx`

**Interfaces:**
- Consumes: Task 4 selectors and Task 5 store.
- Produces: `translate(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string` and `useT()`.
- Produces: five accessible tab destinations: `/(tabs)`, `/(tabs)/guides`, `/(tabs)/sources`, `/(tabs)/saved`, `/(tabs)/settings`.

- [ ] **Step 1: Write failing onboarding, home, and navigation tests**

Assert onboarding has one primary CTA and a working RU/KY selector; onboarded hydration redirects to home; home derives total/completed/recent data; mobile and desktop nav expose exactly five localized destinations with role, label, selected state, keyboard activation, and 44-point minimum targets.

- [ ] **Step 2: Run screen tests and confirm prototype failures**

Run `npm test -- tests/screens/onboarding.test.tsx tests/screens/home.test.tsx tests/screens/navigation.test.tsx`. Expected: FAIL on auth redirects, duplicate CTA, and obsolete tabs.

- [ ] **Step 3: Replace the interface dictionaries and translation API**

Provide complete matching keys in Russian and Kyrgyz, typed interpolation, and `useT()` backed by the new locale state.

- [ ] **Step 4: Replace shared production primitives**

Make title/body/button/card primitives consume `fontScale`; remove profile and floating-AI helpers from the shared API.

- [ ] **Step 5: Implement onboarding and hydration without authentication**

Initialize Task 5 state at root, render a branded loading state only during hydration, and redirect based only on `onboarded`.

- [ ] **Step 6: Implement responsive mobile and desktop navigation**

Remove fake search, shortcut, notification, and profile controls. Expose exactly the five approved destinations on both breakpoints.

- [ ] **Step 7: Implement the production home and initial tab modules**

Home shows actual featured, last-opened, and completion data. The four other tab modules render real registry-backed content or truthful empty states, never placeholders.

- [ ] **Step 8: Replace legacy URLs with local redirects**

Replace the six legacy URLs listed above with `Redirect` components to their specified production destinations, and remove the conflicting/obsolete tab files in the same change.

- [ ] **Step 9: Verify shell behavior**

Run the three focused tests, `npm run lint`, and `npm run typecheck`. Expected: PASS with no authentication import in active routes or nav.

- [ ] **Step 10: Commit the production shell**

Commit Task 6 files with message `feat: replace prototype navigation shell`.

### Task 7: Guide, Source, Search, and Detail Flows

**Files:**
- Modify: `src/app/(tabs)/guides.tsx`, `src/app/(tabs)/sources.tsx`
- Create: `src/app/guide/[id].tsx`, `src/app/source/[id].tsx`
- Create: `src/features/guides/catalog-screen.tsx`, `reader-screen.tsx`; `src/features/sources/directory-screen.tsx`, `detail-screen.tsx`
- Create: `src/components/guide-card.tsx`, `source-card.tsx`, `search-field.tsx`, `reading-controls.tsx`, `external-source-button.tsx`
- Create: `src/services/external-links.ts`
- Test: `tests/screens/guide-catalog.test.tsx`, `guide-reader.test.tsx`, `source-directory.test.tsx`, `tests/services/external-links.test.ts`, `tests/routes/static-params.test.ts`

**Interfaces:**
- Produces: `openPublishedSource(source: ReferenceSource): Promise<{ ok: true } | { ok: false; reason: 'invalid' | 'unsupported' | 'failed' }>`.
- Produces: `generateStaticParams(): Promise<{ id: string }[]>` from each dynamic route, delegating to Task 3 selectors without storage access.

- [ ] **Step 1: Write failing catalog and reader tests**

Assert query/filter/clear/zero states, localized topic chips, guide open/save/complete/uncomplete, citations linking to source detail, related guides, large body text, and a localized in-app invalid-ID fallback.

- [ ] **Step 2: Write failing source and external-link tests**

Assert source filters and details display citation, check date, and link-only rights note. Assert non-HTTPS input returns `invalid`, `canOpenURL=false` returns `unsupported`, thrown open returns `failed`, and no failure navigates away.

- [ ] **Step 3: Write failing static-parameter tests**

Assert guide/source route parameters equal the exact published registry IDs, contain no duplicates, and perform no AsyncStorage access.

- [ ] **Step 4: Run Task 7 tests and confirm failure**

Run the five Task 7 test files. Expected: FAIL because screens and routes are incomplete.

- [ ] **Step 5: Implement the guide catalog**

Use Task 4 search/selectors, controlled query/filter state, accessible topic chips, and real zero/clear states.

- [ ] **Step 6: Implement the source directory**

Filter published references by source type and render citation, check date, and link-only rights information.

- [ ] **Step 7: Implement the guide reader**

Call `openGuide` once per ID, expose explicit completion and bookmark state, render paragraph citations and related guides, and provide the localized invalid-ID state.

- [ ] **Step 8: Implement source detail and safe external opening**

Source detail never embeds remote pages or media. `external-source-button.tsx` maps every `openPublishedSource` result to localized feedback without navigating on failure.

- [ ] **Step 9: Add pure static parameters and invalid-ID states**

Keep route modules independent of hydration so static export can evaluate them in Node.

- [ ] **Step 10: Verify content flows**

Run all Task 7 tests, `npm run content:validate`, `npm run sources:validate`, lint, and typecheck. Expected: PASS.

- [ ] **Step 11: Commit guide and source flows**

Commit Task 7 files with message `feat: add searchable guide and source flows`.

### Task 8: Saved, Settings, Privacy, Methodology, and Not Found

**Files:**
- Modify: `src/app/(tabs)/saved.tsx`, `src/app/(tabs)/settings.tsx`
- Create: `src/app/privacy.tsx`, `src/app/methodology.tsx`, `src/app/+not-found.tsx`
- Create: `src/features/saved/saved-screen.tsx`, `src/features/settings/settings-screen.tsx`, `privacy-screen.tsx`, `methodology-screen.tsx`
- Test: `tests/screens/saved.test.tsx`, `settings.test.tsx`, `legal-pages.test.tsx`, `not-found.test.tsx`

**Interfaces:**
- Consumes: valid saved/recent selectors and `resetLocalData()`.
- Produces: localized privacy/methodology copy and a confirmation-gated reset flow.

- [ ] **Step 1: Write failing saved/history tests**

Assert saved guides preserve registry order, history sorts by `lastOpenedAt`, invalid IDs disappear, each section has a truthful empty state, and cards navigate to valid guide IDs.

- [ ] **Step 2: Write failing settings and reset tests**

Assert locale and font size persist, reset requires explicit confirmation, cancel keeps data, confirm clears data and returns to onboarding, and the warning says the action cannot be undone.

- [ ] **Step 3: Write failing privacy, methodology, and not-found tests**

Assert privacy lists every persisted field and no remote collection; methodology distinguishes link access from reuse rights; not-found offers a localized route home and has a document title on web.

- [ ] **Step 4: Run Task 8 tests and confirm failure**

Run the four Task 8 test files. Expected: FAIL.

- [ ] **Step 5: Implement the saved and history screen**

Use valid saved/recent selector output and truthful empty states.

- [ ] **Step 6: Implement settings and confirmation-gated reset**

Persist language/text size immediately. Do not reset before the final platform confirmation action.

- [ ] **Step 7: Implement the privacy screen**

Keep copy aligned with the actual persisted fields and absence of remote collection.

- [ ] **Step 8: Implement the methodology screen**

Explain paragraph citations, review dates, link-only scope, and excluded materials without claiming legal clearance.

- [ ] **Step 9: Implement the root not-found screen**

Provide localized navigation home and a web document title without pretending to configure the host's HTTP status.

- [ ] **Step 10: Verify secondary flows**

Run Task 8 tests, lint, and typecheck. Expected: PASS.

- [ ] **Step 11: Commit secondary flows**

Commit Task 8 files with message `feat: add privacy and reading management flows`.

### Task 9: Prototype Removal, Redirects, and Accessibility Pass

**Files:**
- Verify redirects created in Task 6: `src/app/login.tsx`, `register.tsx`, `edit-profile.tsx`, `episode/[id].tsx`, `history.tsx`, `variants.tsx`
- Delete: prototype route, component, service, state, data, and type paths listed in File Structure after import audit
- Modify: `assets/images.ts`, `src/components/page-hero.tsx`, `src/shared/layout/app-screen.tsx`, active nav/components/screens as audit requires
- Test: `tests/screens/accessibility.test.tsx`, `tests/routes/legacy-redirects.test.tsx`

**Interfaces:**
- Produces: legacy auth URLs → `/`, profile URL → `/(tabs)/settings`, episode/variants URLs → `/(tabs)/guides`, and history URL → `/(tabs)/saved`.
- Produces: no active or reachable auth, AI, audio, episode, profile, avatar, or placeholder flow.

- [ ] **Step 1: Write failing redirect and accessibility tests**

Assert all six legacy redirects, labels for icon-only controls, selected state on tabs and topic filters, visible web focus styles, text-size propagation to article/card/nav text, and 44-point target styles.

- [ ] **Step 2: Inventory obsolete imports before deletion**

Run `rg -n "features/library/store|data/(content-database|mock-database|epic)|services/(ai|rag|audio|avatar)|Episode|mockPassword|permission_granted" src`. Expected: only prototype paths or explicitly safe documentation references.

- [ ] **Step 3: Remove prototype routes and modules**

Delete only files with no production imports. Remove obsolete assets from `assets/images.ts`; retain research documents and manifests outside runtime.

- [ ] **Step 4: Verify every legacy redirect destination**

Use exact route matching so each old URL reaches only its specified production destination.

- [ ] **Step 5: Implement accessibility and narrow-layout fixes**

Add localized back labels, keyboard focus, selected/disabled state, large text propagation, and narrow layout wrapping.

- [ ] **Step 6: Run code and vocabulary audits**

Run the Task 9 tests, `rg` again, `npm run lint`, `npm run typecheck`, and `npm run assets:audit`. Expected: PASS and no production match for mock credentials, fake AI/audio, or placeholder content.

- [ ] **Step 7: Smoke the responsive UI**

Start web and inspect onboarding, all tabs, both detail routes, reset confirmation, not-found, phone width, desktop width, keyboard navigation, and large text. Record concrete defects and fix them before committing.

- [ ] **Step 8: Commit cleanup and accessibility**

Commit Task 9 files with message `refactor: remove prototype-only product flows`.

### Task 10: Release Configuration, Provenance, Export Verification, and Final Gate

**Files:**
- Modify: `package.json`, `package-lock.json`, `app.json`, `README.md`, `assets/ui/README.md`, `assets/branding/README.md`
- Create: `eas.json`, `scripts/release/verify-static-export.ts`, `scripts/release/validate-app-permissions.ts`, `tests/release/static-export-verifier.test.ts`, `tests/release/permissions.test.ts`, `docs/RELEASE_CHECKLIST.md`

**Interfaces:**
- Produces: `verifyStaticExport(distDir: string, guideIds: readonly string[], sourceIds: readonly string[]): string[]`.
- Produces: `validateAppPermissions(config: unknown): string[]` covering camera, microphone, media/storage, notifications, ad ID, and iOS usage strings.

- [ ] **Step 1: Write failing export and permission tests**

Use temporary fixture trees to assert every root, guide, source, privacy, methodology, and emitted not-found HTML file is required; accept Expo's observed `route.html` or `route/index.html` shape but never skip a route. Assert forbidden Android permissions/plugins and iOS usage descriptions fail validation.

- [ ] **Step 2: Run release tests and confirm failure**

Run `npm test -- tests/release`. Expected: FAIL because release helpers do not exist and app config still includes image picker.

- [ ] **Step 3: Align dependencies and Expo configuration**

Remove `expo-image-picker`; install Expo 56-compatible `expo-dev-client`; set package/bundle identifiers and build numbers; remove image-picker plugin and `reactCompiler`; preserve typed routes, scheme, icons, and static output. Add explicit blocked Android permissions for microphone, camera, media/storage, notifications, and ad ID where supported by Expo 56.

- [ ] **Step 4: Add EAS profiles**

Configure development with `developmentClient: true` and internal distribution, preview as internal Android APK, and production as Android AAB plus normal iOS release. Do not invent Expo owner or project ID.

- [ ] **Step 5: Implement static export and permission validators**

Derive expected route IDs from the production registry. Detect the actual Expo not-found artifact and require the hosting checklist to map unmatched URLs to it with HTTP 404. Inspect Expo's introspected config; do not present JS export as native-manifest proof.

- [ ] **Step 6: Complete retained-asset provenance**

For every retained asset, document filename, dimensions, generator/source, creation date if known, use basis, and active screen. Remove untraceable unused illustrations rather than asserting ownership.

- [ ] **Step 7: Rewrite product and release documentation**

Rewrite README to describe the real product, local data, connected web behavior, run commands, checks, and external publishing steps. Make `docs/RELEASE_CHECKLIST.md` distinguish repository checks, native binary checks, publisher signing, and store submission.

- [ ] **Step 8: Strengthen the final check scripts**

Set `permissions:validate` to `tsx scripts/release/validate-app-permissions.ts`, `export:web` to `expo export --platform web --output-dir dist`, and `export:verify` to `tsx scripts/release/verify-static-export.ts dist`. Set `check` to `npm run lint && npm run typecheck && npm run test:ci && npm run content:validate && npm run sources:validate && npm run permissions:validate && npm run assets:audit`.

- [ ] **Step 9: Run a clean repository verification**

Run `npm ci`, `npm run check`, `npx expo-doctor`, `npm run export:web`, `npm run export:verify`, `npx expo export --platform android --output-dir dist-android`, and `npx expo export --platform ios --output-dir dist-ios`. Expected: all local checks pass; a network-only doctor failure is reported separately with evidence.

- [ ] **Step 10: Inspect platform configuration and build an Android preview when credentials exist**

Run `npx expo config --type introspect --json` and `npm run permissions:validate`. If the publisher's EAS session is available, run `npx eas-cli build --platform android --profile preview` and inspect the resulting APK manifest; otherwise mark native binary/signing as the only external release gate, not as a passed check.

- [ ] **Step 11: Perform final native and web smoke tests**

Verify connected web reload, static direct routes, phone/desktop layouts, and browser keyboard use. On an available Android device or Expo Go, verify cold offline content, onboarding, navigation, persistence, reset, and external-link failure behavior.

- [ ] **Step 12: Commit release readiness**

Commit Task 10 files with message `chore: prepare Manaschy 1.0 release`.

- [ ] **Step 13: Request whole-branch review and fix every release-blocking finding**

Review the final diff against the approved spec, rerun `npm run check` and export verification after fixes, and record exact command results in the handoff.
