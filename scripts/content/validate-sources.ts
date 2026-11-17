import { guideTopics, referenceSources } from '../../src/data/guides';
import { validateSourceRegistry } from '../../src/features/guides/validation';

const errors = validateSourceRegistry(referenceSources, guideTopics);

if (errors.length > 0) {
  console.error(`Source validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Source validation passed: ${referenceSources.length} sources and ${guideTopics.length} topics.`,
  );
}
