# Component Model — Design Decisions
 
This document defines all design choices for the `component()` factory in `src/component.js`. It complements the DOM Abstraction API design document. B's reactive store connects to the `__update` slot on Day 3, and the router (Day 2) calls `mount` / `unmount` on instances — so this is a binding contract. Do not deviate without a team sync.
 
> **Day 1 sync update:** lifecycle, event wiring, listener cleanup, and reactive-wiring ownership were reconciled against B's already-implemented `events.js` and `state.js`. Changes are marked **[sync]** below.
 
---
 
## 1. What the factory returns
 
`component(definition)` returns a **constructor function**. Calling that constructor with props produces an **instance object** (not a raw DOM node).
 
```
const Card = component({ render, onMount, onDestroy });  // factory -> constructor
const cardInstance = Card({ title: "Buy milk" });        // constructor -> instance object
```
 
The instance object exposes the live DOM node as a property, plus methods for mounting, unmounting, and internal updates. This gives the router and the reactive system a stable handle to work with, rather than a detached DOM node.
 
---
 
## 2. The definition object
 
The developer passes a definition object into `component()`. Supported keys:
 
- **`render`** — required. Receives the current props and returns a DOM node built with `createElement` and `nest`.
- **`onMount`** — optional. Called when the instance's DOM node actually enters the document.
- **`onDestroy`** — optional. Called when the instance's DOM node leaves the document.
**[sync] Lifecycle hooks are the PUBLIC API.** Developers only ever define `onMount`/`onDestroy` in their component definition. They never call B's element-level `onMount`/`onDestroy` from `events.js` directly. Both hooks remain **guarded** — if not provided, they are simply not registered.
 
**[sync] Reserved for Day 3:** a `subscriptions` (or `connect`) key naming a store and the keys the component depends on. See section 8.
 
---
 
## 3. Props
 
- Props are passed **at construction time** (when the constructor is called).
- Props are stored on the instance as **`__props`**.
- Both the initial render and every `__update` re-render read from `__props`, so they never drift out of sync.
---
 
## 4. The instance object shape
 
| Member | Type | Purpose |
|--------|------|---------|
| `element` | DOM node | The live node from the most recent render. Replaced on each `__update` re-render. |
| `__props` | object | Current props. Set at construction, shallow-merged on update. |
| `mount(container)` | method | Registers lifecycle hooks with B's observer, then appends `element` to `container`. |
| `unmount()` | method | Removes `element` from the DOM; B's observer handles `onDestroy` + listener cleanup. |
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
 
## 5. `mount` and `unmount` wiring  **[sync — changed]**
 
The component delegates lifecycle to B's MutationObserver-based system in `events.js`, imported as:
 
```
import { onMount as observeMount, onDestroy as observeDestroy } from './events.js';
```
 
**`mount(container)`**
1. If the definition provided `onMount`, register it via `observeMount(this.element, onMount)`.
2. If the definition provided `onDestroy`, register it via `observeDestroy(this.element, onDestroy)`.
3. Append `element` to `container`.
B's observer then fires `onMount` when the node actually enters the document, and fires `onDestroy` — plus `offAll` for listener cleanup — when it leaves.
 
**`unmount()`**
1. Remove `element` from the DOM (`element.remove()`).
That is all. The component does **not** call `onDestroy` or `offAll` itself — B's observer does both on removal. Calling them here would double-fire.
 
---
 
## 6. The `__update` slot
 
- **Name:** `__update` — double-underscore signals framework-internal, not for direct developer use.
- **Merge behaviour:** **shallow merge** — new props override matching keys; untouched keys are preserved.
- **Re-render behaviour (current):** **crude-but-correct.** Calls `render` with the merged props, replaces the old `element` in the DOM with the new one, and repoints `element`.
The crude full-replace is correct but inefficient. On Day 3 its internals are replaced with vDOM diffing — the slot name and signature stay the same, only the guts change.
 
---
 
## 7. `this` binding note
 
`mount`, `unmount`, and `__update` all reference `this.element` and `this.__props`. They must always be called **as methods on the instance** (`instance.mount(container)`), never pulled off into standalone variables — doing so detaches `this` and breaks them.
 
---
 
## 8. Reactive wiring — ownership and plan  **[sync — new]**
 
**Owner: A (component layer). Not B's store, not developer code.**
 
Rationale: the component is the only thing that owns both halves — the `__update` slot (what to call) and `__props` (what to render with). B's store stays deliberately generic and component-agnostic; it only exposes `subscribe(key, callback)` and notifies on change.
 
**Plan (Day 3):**
- A component declares its store dependencies via the reserved `subscriptions` definition key (section 2).
- Inside `mount`, the component calls `store.subscribe(key, () => instance.__update(...))` for each dependency, and keeps the returned unsubscribe functions.
- Inside `unmount`, the component calls those unsubscribe functions.
- B's `subscribe` API stays exactly as it is today. No component awareness leaks into the store.
---
 
## 9. Observer startup dependency  **[sync — important]**
 
Listener cleanup on unmount works **only because B's MutationObserver is active.** The observer is started lazily by `ensureObserver()` inside B's `onMount`/`onDestroy`. Because the component's `mount` always registers through `observeMount`/`observeDestroy`, the observer is guaranteed to start the first time any component mounts.
 
**Edge case to remember:** B's observer watches `document.body` with `subtree: true`. Hooks fire on entry/exit of the *real document*, not an arbitrary detached container. Mounting into a detached subtree defers hook firing until that subtree is itself attached — this is correct behaviour but can surprise you in isolated tests.
