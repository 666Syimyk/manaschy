const { rmSync } = require('node:fs');
const { resolve } = require('node:path');

for (const directory of ['.expo', 'dist', 'dist-android', 'dist-ios', 'web-build', 'tmp']) {
  rmSync(resolve(process.cwd(), directory), { recursive: true, force: true });
}

console.log('Removed Expo, platform export, web build, and temporary artifacts.');
