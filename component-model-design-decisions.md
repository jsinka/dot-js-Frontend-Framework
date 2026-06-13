# Component Model — Design Decisions

This document defines all design choices made for the `component()` factory in `src/component.js`. It complements the DOM Abstraction API design document. B connects the reactive system to the `__update` slot and the instance shape on Day 3, and the router (Day 2) calls `mount` / `unmount` on instances — so this is a binding contract. Do not deviate without a team sync.

---

## 1. What the factory returns

`component(definition)` returns a **constructor function**. Calling that constructor with props produces an **instance object** (not a raw DOM node).

```
const Card = component({ render, onMount, onDestroy });  // factory → constructor
const cardInstance = Card({ title: "Buy milk" });        // constructor → instance object
```

The instance object exposes the live DOM node as a property, plus methods for mounting, unmounting, and internal updates. This gives the router and the reactive system a stable handle to work with, rather than a detached DOM node.

---

## 2. The definition object

The developer passes a definition object into `component()`. Supported keys:

- **`render`** — required. Receives the current props and returns a DOM node built with `createElement` and `nest`.
- **`onMount`** — optional. Called after the instance's DOM node is inserted into the document.
- **`onDestroy`** — optional. Called before the instance's DOM node is removed from the document.

`onMount` and `onDestroy` are **wired** in `mount` / `unmount` today, but are expected to be filled with meaningful behaviour once B's lifecycle system lands. Both are **guarded** — if the developer did not provide one, it is simply not called, and nothing crashes.

---

## 3. Props

- Props are passed **at construction time** (when the constructor is called).
- Props are stored on the instance as **`__props`**.
- Both the initial render and every `__update` re-render read from `__props`, so they never drift out of sync.

---

## 4. The instance object shape

Every instance exposes the following:

| Member | Type | Purpose |
|--------|------|---------|
| `element` | DOM node | The live node from the most recent render. Replaced on each `__update` re-render. |
| `__props` | object | Current props. Set at construction, shallow-merged on update. |
| `mount(container)` | method | Appends `element` to `container`, then calls `onMount` if provided. |
| `unmount()` | method | Calls `onDestroy` if provided, then removes `element` from the DOM. |
| `__update(newProps)` | method | Internal slot for the reactive system. Shallow-merges `newProps` into `__props`, then re-renders. |

Conceptual shape (illustrative, not construction logic):

```
{
  element: <the live DOM node>,
  __props: { title: "Buy milk", done: false },
  mount(container) { ... },
  unmount() { ... },
  __update(newProps) { ... }
}
```

---

## 5. `mount` and `unmount` wiring

**`mount(container)`**
1. Append `element` to `container` (via `appendChild`).
2. If `onMount` was provided, call it (guarded existence check first).

**`unmount()`**
1. If `onDestroy` was provided, call it (guarded existence check first).
2. Remove `element` from the DOM (via `element.remove()`).

Order matters: destroy runs **before** removal, so the teardown hook can still read the element while it is attached.

---

## 6. The `__update` slot

- **Name:** `__update` — double-underscore signals framework-internal, not for direct developer use.
- **Merge behaviour:** **shallow merge** — new props override matching keys; untouched keys are preserved.
- **Re-render behaviour (current):** **crude-but-correct.** Calls `render` with the merged props to produce a fresh DOM node, replaces the old `element` in the DOM with the new one, and updates the `element` property to point at the new node.

The crude full-replace is correct but inefficient. On Day 3 its internals are replaced with vDOM diffing — the slot name and signature stay the same, only the guts change.

---

## 7. `this` binding note

`mount`, `unmount`, and `__update` all reference `this.element` and `this.__props`. They must always be called **as methods on the instance** (`instance.mount(container)`), never pulled off into standalone variables — doing so detaches `this` and breaks them. The router and reactive system must respect this.
