import { on } from './events.js';

const DIRECT_PROPS = new Set(['value', 'checked', 'selected', 'disabled', 'textContent']);

export function createElement(tag, props = {}) {
  const el = document.createElement(tag);

  for (const [key, val] of Object.entries(props)) {
    if (key === 'events') {
      for (const [event, spec] of Object.entries(val)) {
        if (typeof spec === 'function') {
          on(el, event, spec);
        } else {
          const { handler, ...opts } = spec;
          on(el, event, handler, opts);
        }
      }
    } else if (key === 'style') {
      for (const [prop, value] of Object.entries(val)) {
        el.style[prop] = value;
      }
    } else if (key === 'className') {
      el.className = val;
    } else if (DIRECT_PROPS.has(key)) {
      el[key] = val;
    } else {
      el.setAttribute(key, val);
    }
  }

  return el;
}

export function nest(parent, ...children) {
  for (const child of children.flat()) {
    if (child == null) continue;
    parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return parent;
}

export function lazyList(container, items, renderItem, batchSize = 20) {
  let index = 0;
  let cancelled = false;

  function batch() {
    if (cancelled) return;
    const end = Math.min(index + batchSize, items.length);
    while (index < end) {
      container.appendChild(renderItem(items[index]));
      index++;
    }
    if (index < items.length) requestAnimationFrame(batch);
  }

  requestAnimationFrame(batch);
  return () => { cancelled = true; };
}
