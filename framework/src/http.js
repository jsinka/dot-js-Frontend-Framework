async function request(url, init = {}) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ': ' + body : ''}`);
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

export const http = {
  get(url, options = {}) {
    return request(url, { ...options, method: 'GET' });
  },

  post(url, data, options = {}) {
    return request(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
    });
  },

  put(url, data, options = {}) {
    return request(url, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
    });
  },

  del(url, options = {}) {
    return request(url, { ...options, method: 'DELETE' });
  },

  bindToStore(promise, store, key) {
    store.set({ [`${key}Loading`]: true, [`${key}Error`]: null });
    return promise
      .then((data) => {
        store.set({ [key]: data, [`${key}Loading`]: false });
        return data;
      })
      .catch((err) => {
        store.set({ [`${key}Loading`]: false, [`${key}Error`]: err.message });
        throw err;
      });
  },
};
