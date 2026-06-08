import { test, assert, assertEqual, assertDeepEqual } from './harness.js';
import { createStore } from '../framework/src/state.js';

global.localStorage = (() => {
  const store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
})();

test('get returns initial state by key', () => {
  const s = createStore({ count: 0 });
  assertEqual(s.get('count'), 0);
});

test('get with no argument returns full snapshot', () => {
  const s = createStore({ a: 1, b: 2 });
  assertDeepEqual(s.get(), { a: 1, b: 2 });
});

test('set updates a key', () => {
  const s = createStore({ count: 0 });
  s.set({ count: 5 });
  assertEqual(s.get('count'), 5);
});

test('set does not mutate the original initialState', () => {
  const init = { x: 1 };
  const s = createStore(init);
  s.set({ x: 99 });
  assertEqual(init.x, 1);
});

test('subscribe fires callback on change', () => {
  const s = createStore({ n: 0 });
  let received = null;
  s.subscribe('n', (val) => { received = val; });
  s.set({ n: 7 });
  assertEqual(received, 7);
});

test('subscribe wildcard fires on any change', () => {
  const s = createStore({ a: 0, b: 0 });
  let calls = 0;
  s.subscribe('*', () => { calls++; });
  s.set({ a: 1 });
  s.set({ b: 2 });
  assertEqual(calls, 2);
});

test('subscribe returns unsubscribe function', () => {
  const s = createStore({ x: 0 });
  let calls = 0;
  const off = s.subscribe('x', () => { calls++; });
  s.set({ x: 1 });
  off();
  s.set({ x: 2 });
  assertEqual(calls, 1);
});

test('set skips unchanged values', () => {
  const s = createStore({ v: 42 });
  let calls = 0;
  s.subscribe('v', () => { calls++; });
  s.set({ v: 42 });
  assertEqual(calls, 0);
});

test('reset restores initial state and notifies', () => {
  const s = createStore({ count: 0 });
  let received = null;
  s.subscribe('count', (val) => { received = val; });
  s.set({ count: 99 });
  s.reset();
  assertEqual(s.get('count'), 0);
  assertEqual(received, 0);
});

test('persist saves to localStorage', () => {
  const s = createStore({ score: 0 }, { persist: 'test-persist' });
  s.set({ score: 42 });
  const raw = localStorage.getItem('test-persist');
  assert(raw !== null, 'nothing written to localStorage');
  assertDeepEqual(JSON.parse(raw), { score: 42 });
});

test('persist restores from localStorage on init', () => {
  localStorage.setItem('test-restore', JSON.stringify({ score: 99 }));
  const s = createStore({ score: 0 }, { persist: 'test-restore' });
  assertEqual(s.get('score'), 99);
});

test('multiple stores are independent', () => {
  const a = createStore({ x: 1 });
  const b = createStore({ x: 2 });
  a.set({ x: 10 });
  assertEqual(b.get('x'), 2);
});
