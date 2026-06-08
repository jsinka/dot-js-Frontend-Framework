import { test, assert, assertEqual } from './harness.js';
import { http } from '../framework/src/http.js';
import { createStore } from '../framework/src/state.js';

global.localStorage = (() => {
  const s = {};
  return { getItem: k => s[k] ?? null, setItem: (k, v) => { s[k] = v; }, removeItem: k => { delete s[k]; } };
})();

function mockFetch(body, { status = 200, contentType = 'application/json' } = {}) {
  global.fetch = () => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { get: () => contentType },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  });
}

test('http.get resolves with parsed JSON', async () => {
  mockFetch({ items: [1, 2] });
  const data = await http.get('/api/items');
  assertEqual(JSON.stringify(data), JSON.stringify({ items: [1, 2] }));
});

test('http.post sends JSON body and resolves', async () => {
  let captured;
  global.fetch = (url, init) => {
    captured = init;
    return Promise.resolve({
      ok: true, status: 201,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ id: 1 }),
      text: () => Promise.resolve(''),
    });
  };
  const res = await http.post('/api/items', { title: 'hello' });
  assertEqual(captured.method, 'POST');
  assertEqual(captured.headers['Content-Type'], 'application/json');
  assertEqual(JSON.parse(captured.body).title, 'hello');
  assertEqual(res.id, 1);
});

test('http.get rejects on non-2xx status', async () => {
  mockFetch('Not found', { status: 404, contentType: 'text/plain' });
  let threw = false;
  await http.get('/api/missing').catch(() => { threw = true; });
  assert(threw, 'Expected http.get to throw on 404');
});

test('bindToStore populates key and clears loading', async () => {
  mockFetch([{ id: 1 }]);
  const store = createStore({ cards: null, cardsLoading: false, cardsError: null });
  await http.bindToStore(http.get('/api/cards'), store, 'cards');
  assertEqual(store.get('cardsLoading'), false);
  assertEqual(store.get('cardsError'), null);
  assertEqual(JSON.stringify(store.get('cards')), JSON.stringify([{ id: 1 }]));
});

test('bindToStore sets error on failure', async () => {
  mockFetch(null, { status: 500 });
  const store = createStore({ data: null, dataLoading: false, dataError: null });
  await http.bindToStore(http.get('/api/fail'), store, 'data').catch(() => {});
  assertEqual(store.get('dataLoading'), false);
  assert(store.get('dataError') !== null, 'Expected dataError to be set');
});
