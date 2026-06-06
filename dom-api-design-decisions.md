# DOM Abstraction API — Design Decisions

This document defines all design choices made for the `createElement` and `nest` functions in `dom.js`. These are the contracts that B and C will code against. Do not deviate from these without a team sync.

---

## 1. Function signature — positional arguments

`createElement` uses positional arguments: tag name first, props object second.

The props argument is **optional**. Calling `createElement('div')` with no second argument is valid and equivalent to passing an empty object. Internally, a missing props argument is coerced to an empty object as the very first step, before any other logic runs.

---

## 2. Children

### 2a. Strict separation via `nest()`

`createElement` does not accept children. All parent-child relationships are expressed exclusively through a separate `nest()` function.

**One exception:** `createElement` accepts an optional `textContent` key in the props object as a convenience shorthand for text-only nodes. This avoids requiring a `nest()` call just to put text inside a simple element. This is not a children array — it is a single string value.

### 2b. Child types accepted by `nest()`

- Other DOM elements
- Plain strings — converted to text nodes automatically
- `null` and `undefined` — silently ignored, no error thrown
- Arrays — flattened **one level deep** before appending

---

## 3. Attributes vs. DOM properties

The props object uses **DOM property names**, not HTML attribute names. For example: `className` not `class`, `htmlFor` not `for`.

The known property list — attributes that must be set directly as DOM properties rather than via `setAttribute` — is:

- `value`
- `checked`
- `selected`
- `disabled`
- `textContent`

Everything outside this list is set via `setAttribute`.

---

## 4. Event listeners

### 4a. Separate `events` key

Event listeners are passed under a dedicated `events` key in the props object, completely separate from HTML attributes. This eliminates any ambiguity between attributes and event handlers.

The `events` value is a plain object where:
- Keys are plain event names with no prefix — `click`, `input`, `submit`, not `onClick` or `on-click`
- Values are single handler functions — one handler per event name

Example shape:
```
events: {
  click: handleClick,
  input: handleInput
}
```

### 4b. Routing through B's `on()` system

Event listeners are **never** registered via `addEventListener` directly inside `dom.js`. All event registration is delegated to B's `on()` function. During Day 1 implementation, the call site is written as a stub that assumes the signature `on(element, eventName, handler)`. B's real implementation replaces the stub once it is ready.

---

## 5. Styles and class names

Both a `style` object and a `className` prop are supported.

- `className` — a string of one or more class names, used for structural styling via external CSS
- `style` — a plain object of inline style declarations, used for dynamic styling

Style property names follow **camelCase JavaScript conventions** — `backgroundColor`, `fontSize`, `marginTop`. Properties are applied by setting `element.style[key] = value` directly.

---

## 6. Return value

`createElement` returns a **raw DOM element**. No wrapper objects.

Framework-internal metadata that needs to be associated with a DOM node (such as the previous vDOM tree for diffing, introduced later) is stored in a `WeakMap` defined at the module level in `dom.js`, keyed on the DOM element. This keeps the DOM node itself clean while allowing the framework to track internal state per node without risking memory leaks.

---

## 7. `createElement` implementation algorithm

When iterating over the props object, each key is handled in this exact order:

1. **`events`** — pass the entire events object to B's `on()` system
2. **`style`** — iterate the style object and apply each property to `element.style[key]`
3. **`className`** — set `element.className` directly
4. **Known property list** (`value`, `checked`, `selected`, `disabled`, `textContent`) — set as a DOM property directly: `element[key] = value`
5. **Everything else** — call `element.setAttribute(key, value)`

The order matters. `events`, `style`, and `className` must be checked before the fallback `setAttribute` call, otherwise they will be passed through as literal HTML attributes.
