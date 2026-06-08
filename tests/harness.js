let passed = 0;
let failed = 0;

export function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`      ${err.message}`);
    failed++;
  }
}

export function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

export function assertEqual(actual, expected, message) {
  const msg = message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
  if (actual !== expected) throw new Error(msg);
}

export function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(message ?? `Expected ${e}, got ${a}`);
}

export function summary() {
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}
