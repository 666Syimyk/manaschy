import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { getPublishedGuides, getPublishedSources } from '../../src/data/guides';
import { getEpisodeStaticParams } from '../../src/data/epic';

const ROOT_ROUTES = ['', 'guides', 'chat', 'sources', 'saved', 'settings', 'privacy', 'methodology'] as const;
const NOT_FOUND_FILES = ['+not-found.html', '404.html', '_not-found.html', 'not-found.html'] as const;

function hasRouteFile(distDir: string, route: string): boolean {
  if (route === '') return existsSync(resolve(distDir, 'index.html'));
  return (
    existsSync(resolve(distDir, `${route}.html`)) ||
    existsSync(resolve(distDir, route, 'index.html'))
  );
}

export function verifyStaticExport(
  distDir: string,
  guideIds: readonly string[],
  sourceIds: readonly string[],
  episodeIds: readonly string[] = [],
): string[] {
  const resolvedDist = resolve(distDir);
  if (!existsSync(resolvedDist) || !statSync(resolvedDist).isDirectory()) {
    return [`Static export directory does not exist: ${resolvedDist}`];
  }

  const errors: string[] = [];
  const expectedRoutes = [
    ...ROOT_ROUTES,
    ...guideIds.map((id) => `guide/${id}`),
    ...sourceIds.map((id) => `source/${id}`),
    ...episodeIds.map((id) => `episode/${id}`),
  ];

  for (const route of expectedRoutes) {
    if (!hasRouteFile(resolvedDist, route)) {
      errors.push(`Missing static HTML for /${route}`);
    }
  }

  if (!NOT_FOUND_FILES.some((file) => existsSync(resolve(resolvedDist, file)))) {
    errors.push(
      'Missing emitted 404 document. The host must serve the generated not-found HTML with HTTP status 404.',
    );
  }

  return errors;
}

function main() {
  const distDir = process.argv[2] ?? 'dist';
  const guideIds = getPublishedGuides().map(({ id }) => id);
  const sourceIds = getPublishedSources().map(({ id }) => id);
  const episodeIds = getEpisodeStaticParams().map(({ id }) => id);
  const errors = verifyStaticExport(distDir, guideIds, sourceIds, episodeIds);

  if (errors.length > 0) {
    console.error(`Static export verification failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Static export verified: ${ROOT_ROUTES.length + guideIds.length + sourceIds.length + episodeIds.length} routes and a not-found document.`,
  );
  console.log('Hosting must return the emitted not-found document with HTTP status 404 for unmatched URLs.');
}

if (require.main === module) main();
