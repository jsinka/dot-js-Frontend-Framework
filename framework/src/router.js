function createRouter() {
  const routes = [];
  const subscribers = new Set();
  let current = { path: '/', params: {} };

  function parsePath(hash) {
    const stripped = hash.replace(/^#\/?/, '');
    return stripped ? '/' + stripped : '/';
  }

  function patternFromPath(path) {
    const keys = [];
    const src = path.replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    return { pattern: new RegExp('^' + src + '$'), keys };
  }

  function resolve(path) {
    for (const { pattern, keys, handler } of routes) {
      const match = pattern.exec(path);
      if (!match) continue;
      const params = {};
      keys.forEach((key, i) => { params[key] = match[i + 1]; });
      current = { path, params };
      for (const cb of subscribers) cb(current);
      handler(params);
      return;
    }
  }

  window.addEventListener('hashchange', () => resolve(parsePath(location.hash)));

  return {
    define(routeMap) {
      for (const [path, handler] of Object.entries(routeMap)) {
        const { pattern, keys } = patternFromPath(path);
        routes.push({ pattern, keys, handler });
      }
    },
    navigate(path) {
      location.hash = path;
    },
    start() {
      resolve(parsePath(location.hash));
    },
    current() {
      return { ...current };
    },
    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
  };
}

export const router = createRouter();
