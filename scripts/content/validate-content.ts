import {
  guideArticles,
  guideTopics,
  referenceSources,
} from '../../src/data/guides';
import { validateGuideRegistry } from '../../src/features/guides/validation';

const errors = validateGuideRegistry(guideArticles, referenceSources, guideTopics);

if (errors.length > 0) {
  console.error(`Guide validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Guide validation passed: ${guideArticles.length} published guides.`);
}
