# dot-js Framework — 5-Day Team Workflow

## Team Roles & Ownership

| Member | Role | Core Ownership |
|--------|------|----------------|
| **A** | Framework Architect | Component model, DOM abstraction, virtual DOM, router, build output |
| **B** | Core Systems Lead | State store, event system, HTTP module, lifecycle hooks, test suite |
| **C** | Example App Lead | Kanban demo app, all documentation, README, submission packaging |

---

## Day 1 — Foundation & Scaffolding

### A — Framework Architect
- Define folder structure (`framework/` + `example/`)
- Set up module system (ESM, no bundler or simple rollup)
- Implement `createElement()`, `nest()`, attrs/styles API
- Write `component()` factory with props + render lifecycle

### B — Core Systems Lead
- Design state store (`createStore`, `get`, `set`, `subscribe`)
- Implement reactive update pipeline (state → re-render)
- Define `on()` event API (registration, delegation, prevent)
- Write unit test harness (vanilla JS, no framework)

### C — Example App Lead
- Choose example app (Kanban recommended — uses every required feature)
- Sketch UI wireframes and data model
- Create `example/` scaffold and `index.html` entry point
- Draft README skeleton with all required sections

> **End-of-day sync** — Agree on the public API surface (`component`, `createStore`, `on`, `router`) before everyone codes against it.

---

## Day 2 — Router, HTTP & Virtual DOM

### A — Framework Architect
- Implement hash-based router (`navigate`, `onRoute`)
- Build route-matching and programmatic `pushState`
- Start vDOM layer: `h()`, `patch()`, diff algorithm

### B — Core Systems Lead
- Build `http.get` / `http.post` wrapper (fetch + error handling)
- Implement response-to-state binding helper
- Add form input binding (`onInput`, `onSubmit`, value sync)
- Write unit tests for state, events, HTTP

### C — Example App Lead
- Build Kanban board columns with `createStore` for cards
- Implement drag-to-move card between columns (events)
- Wire up routing (`/` = board, `/card/:id` = detail view)

> **Mid-sprint sync** — Verify router + store are working in the example app; unblock C if any API surface is missing.

---

## Day 3 — Integration & Performance

### A — Framework Architect
- Finish vDOM diffing and hook into component re-renders
- Implement lazy rendering (virtualised list for 10k+ items)
- Profile render loop; fix unnecessary re-renders

### B — Core Systems Lead
- Add shared store between multiple component instances
- Implement `onMount` / `onDestroy` lifecycle hooks
- Clean up event listener memory leaks on unmount

### C — Example App Lead
- Add HTTP fetch to load cards from a mock API (json-server or static JSON)
- Show loading / error states in the UI
- Write Getting Started guide + architecture overview in docs

> **Integration check** — All features wired together in the example app; identify remaining gaps.

---

## Day 4 — Polish, Tests & Full Docs

### A — Framework Architect
- Bundle framework as a single importable file
- Add optional feature flag (e.g. debug mode, devtools log)
- Write framework-level code comments for docs generation

### B — Core Systems Lead
- Expand unit tests to cover the full public API surface
- Test event delegation edge cases and bubbling/prevent
- Test router navigation and back/forward history

### C — Example App Lead
- Complete all docs sections (features, best practices, examples)
- Add inline code examples to every feature section
- Polish Kanban UI; add card creation form and delete

> **Pre-review rehearsal** — Each member demos their section; agree on talking points for the reviewer.

---

## Day 5 — Freeze, Review Prep & Submission

### A — Framework Architect
- Freeze framework codebase (no new features)
- Prepare architecture walkthrough for reviewer
- Have 2–3 bonus ideas ready to pitch to the reviewer

### B — Core Systems Lead
- Run full test suite; fix any failures
- Verify HTTP, state, and event modules end-to-end
- Check repo structure matches submission requirements (`framework/` + `example/`)

### C — Example App Lead
- Final pass on README and all markdown docs
- Verify `framework/` and `example/` directories are clean
- Prepare live demo walkthrough for the review

> **Submit & review** — C demos the app, A explains the framework architecture, B handles technical deep-dives.

---

## Review Day — Suggested Bonus Ideas to Pitch

| Idea | What it adds |
|------|-------------|
| `computed()` derived state | State values that auto-update when dependencies change |
| Transitions / animations API | Declarative enter/leave animations on component mount/unmount |
| Two-way binding directive | `bind:value` shorthand that syncs input ↔ store automatically |
| Plugin system | `framework.use(plugin)` hook for community extensions |
| DevTools integration | Console logging of state diffs and component tree |

---

## Key Principles

- **Lock the API on Day 1.** C depends on A and B's interfaces from Day 2 onward. Any breaking change after Day 1 sync costs everyone time.
- **Kanban is the right example app.** It naturally exercises drag events, shared state, routing, HTTP fetching, and forms — every required feature in one coherent project.
- **Virtualised list is the cleanest performance story.** It's visually demonstrable in the review, well understood, and doesn't complicate the rest of the framework.
- **B is the quality gate.** The test suite is the only check against integration failures. B should run it after every major merge.


## dot-js-project/
│
├── framework/                  # Contains your framework and documentation
│   ├── README.md               # Mandatory documentation file
│   ├── index.js                # The bundled framework exported as a single file 
│   └── src/                    # Source files for members A & B
│       ├── dom.js              # createElement, nest, attrs/styles
│       ├── state.js            # createStore, get, set, subscribe 
│       ├── events.js           # Event registration, delegation, bubbling
│       ├── router.js           # Hash-based router, navigate
│       └── http.js             # http.get/post wrapper
│
└── example/                    # Contains your example Kanban project
    ├── index.html              # The scaffolded entry point 
    ├── app.js                  # Main application logic wiring up components, state, and router
    ├── styles.css              # Styling for the Kanban board and detail views
    └── db.json                 # Mock API data (e.g., for json-server) to fetch cards