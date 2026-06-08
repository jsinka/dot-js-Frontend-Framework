export function createStore(initialState = {}, options = {}) {
  const { persist: persistKey, crossTab = false } = options;

  let state = { ...initialState };

  if (persistKey) {
    try {
      const saved = localStorage.getItem(persistKey);
      if (saved) state = { ...state, ...JSON.parse(saved) };
    } catch {}
  }

  const subscribers = new Map();

  function notify(changedKeys, snapshot) {
    for (const key of changedKeys) {
      if (subscribers.has(key)) {
        for (const cb of subscribers.get(key)) cb(snapshot[key], snapshot);
      }
    }
    if (changedKeys.length && subscribers.has('*')) {
      for (const cb of subscribers.get('*')) cb(snapshot);
    }
  }

  function get(key) {
    return key === undefined ? { ...state } : state[key];
  }

  function set(updates) {
    const changed = [];
    for (const [key, val] of Object.entries(updates)) {
      if (state[key] !== val) {
        state[key] = val;
        changed.push(key);
      }
    }
    if (!changed.length) return;

    if (persistKey) {
      try { localStorage.setItem(persistKey, JSON.stringify(state)); } catch {}
    }

    notify(changed, { ...state });
  }

  function subscribe(key, callback) {
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    subscribers.get(key).add(callback);
    return () => subscribers.get(key).delete(callback);
  }

  function reset() {
    state = { ...initialState };
    if (persistKey) {
      try { localStorage.removeItem(persistKey); } catch {}
    }
    notify(Object.keys(initialState), { ...state });
  }

  if (crossTab && persistKey) {
    window.addEventListener('storage', (e) => {
      if (e.key !== persistKey || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue);
        const changed = [];
        for (const [key, val] of Object.entries(incoming)) {
          if (state[key] !== val) {
            state[key] = val;
            changed.push(key);
          }
        }
        if (changed.length) notify(changed, { ...state });
      } catch {}
    });
  }

  return { get, set, subscribe, reset };
}
