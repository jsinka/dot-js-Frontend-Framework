const registry = new WeakMap();

function getListeners(element, eventName) {
  if (!registry.has(element)) registry.set(element, new Map());
  const byEvent = registry.get(element);
  if (!byEvent.has(eventName)) byEvent.set(eventName, new Set());
  return byEvent.get(eventName);
}

export function on(element, eventName, handler, options = {}) {
  const { delegate, prevent = false, stop = false } = options;

  const wrapped = (event) => {
    let target = event.target;

    if (delegate) {
      target = event.target.closest(delegate);
      if (!target || !element.contains(target)) return;
    }

    if (prevent) event.preventDefault();
    if (stop) event.stopPropagation();

    handler(event, target);
  };

  getListeners(element, eventName).add(wrapped);
  element.addEventListener(eventName, wrapped);

  return () => {
    element.removeEventListener(eventName, wrapped);
    getListeners(element, eventName).delete(wrapped);
  };
}

export function bindEvents(element, eventsObj) {
  const cleanups = [];
  for (const [eventName, spec] of Object.entries(eventsObj)) {
    if (typeof spec === 'function') {
      cleanups.push(on(element, eventName, spec));
    } else if (spec && typeof spec === 'object') {
      const { handler, ...opts } = spec;
      cleanups.push(on(element, eventName, handler, opts));
    }
  }
  return () => cleanups.forEach((off) => off());
}

export function offAll(element) {
  if (!registry.has(element)) return;
  const byEvent = registry.get(element);
  for (const [eventName, handlers] of byEvent) {
    for (const wrapped of handlers) {
      element.removeEventListener(eventName, wrapped);
    }
  }
  registry.delete(element);
}

const mountCallbacks = new WeakMap();
const destroyCallbacks = new WeakMap();

let observer = null;

function ensureObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (mountCallbacks.has(node)) mountCallbacks.get(node)(node);
        for (const el of node.querySelectorAll('*')) {
          if (mountCallbacks.has(el)) mountCallbacks.get(el)(el);
        }
      }
      for (const node of mutation.removedNodes) {
        if (node.nodeType !== 1) continue;
        if (destroyCallbacks.has(node)) {
          destroyCallbacks.get(node)(node);
          offAll(node);
        }
        for (const el of node.querySelectorAll('*')) {
          if (destroyCallbacks.has(el)) {
            destroyCallbacks.get(el)(el);
            offAll(el);
          }
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function onMount(element, callback) {
  mountCallbacks.set(element, callback);
  ensureObserver();
}

export function onDestroy(element, callback) {
  destroyCallbacks.set(element, callback);
  ensureObserver();
}
