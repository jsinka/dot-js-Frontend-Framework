// Entry point: node tests/run.js
import { summary } from './harness.js';

const suites = [
  './state.test.js',
  './http.test.js',
];

for (const suite of suites) {
  const label = suite.replace('./', '').replace('.test.js', '');
  console.log(`\n── ${label} ──`);
  await import(suite);
}

summary();
