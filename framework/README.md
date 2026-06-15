# dot-js Framework

A small, dependency-free frontend framework for building single-page applications with plain JavaScript.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Installation & Setup](#installation--setup)
4. [Getting Started](#getting-started)
5. [Core Features](#core-features)
   - [DOM Manipulation & Components](#dom-manipulation--components)
   - [State Management](#state-management)
   - [Event Handling](#event-handling)
   - [Routing](#routing)
6. [Advanced Features](#advanced-features)
   - [HTTP Requests](#http-requests)
   - [Performance: Lazy List Rendering](#performance-lazy-list-rendering)
7. [Best Practices](#best-practices)
8. [Example Application](#example-application)

---

## Project Overview

dot-js is a minimal frontend framework built entirely with the browser's native APIs. No build step, no transpilation, no npm packages — just ES modules that you import directly in the browser.

It covers the core things every web app needs: creating and composing DOM elements, managing reactive state, handling user events, routing between views, and talking to APIs. Everything is small, readable, and straightforward to extend.

---

## Architecture & Design Principles

The framework is split into five independent modules. Each module does one thing and can be used on its own.

| Module      | File              | Responsibility                          |
|-------------|-------------------|-----------------------------------------|
| DOM         | `src/dom.js`      | Creating and nesting HTML elements      |
| State       | `src/state.js`    | Reactive key-value store                |
| Events      | `src/events.js`   | Attaching and cleaning up DOM listeners |
| Router      | `src/router.js`   | Hash-based client-side routing          |
| HTTP        | `src/http.js`     | Fetch wrapper for REST APIs             |

**Design choices:**

- **ES modules only.** No bundler required. Import the framework directly from `framework/index.js`.
- **Raw DOM elements.** `createElement` returns a real `HTMLElement`, not a virtual node or wrapper object. What you get is what the browser sees.
- **Explicit subscriptions.** State changes don't automatically re-render anything. Components subscribe to the parts of state they care about and update themselves.
- **Events are tracked.** The `on()` function registers listeners through a `WeakMap` registry so they can be bulk-removed when a component is destroyed.
- **Hash-based routing.** Routes are matched against `location.hash`, so the app works without any server-side routing configuration.

---

## Installation & Setup

Clone the repo and start the dev server. No `npm install` needed — the server is written in plain Node.js.

```bash
git clone https://gitea.kood.tech/jorgensinka/frontend-framework.git
cd frontend-framework
node server.js
```

Then open `http://localhost:3000/example/` in your browser.

The server handles two things:
- Serves all project files as static assets.
- Provides a REST API at `http://localhost:3000/api/cards` backed by `example/db.json`.

To regenerate the sample data (default 10 cards):

```bash
node generateData.js
```

If you want to generate a specific number of cards, you can pass the desired amount as an argument at the end of the command.

For example, to generate exactly 5000 cards:

```bash
node generateData.js 5000
```

---

## Getting Started

Here is the minimum code to render something on screen using dot-js.

**index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

**app.js**

```javascript
import { createElement as el, nest } from '../framework/src/dom.js';

const heading = el('h1', { textContent: 'Hello, dot-js!' });
const para    = el('p',  { textContent: 'This is your first component.' });
const app     = document.getElementById('app');

nest(app, heading, para);
```

That's it. No configuration, no lifecycle hooks to wire up, no compiler to run.

---

## Core Features

### DOM Manipulation & Components

**`createElement(tag, props?)`**

Creates an HTML element. The `props` object maps to element attributes, DOM properties, inline styles, and event listeners.

```javascript
import { createElement as el } from '../framework/src/dom.js';

const btn = el('button', {
  className: 'btn',
  textContent: 'Click me',
  disabled: false,
  style: { backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px' },
});
```

Event listeners go under an `events` key. The keys are plain event names (no `on` prefix). Each value is either a function or an object with `handler`, `prevent`, and `stop` options.

```javascript
const form = el('form', {
  events: {
    submit: {
      handler: (e) => console.log('submitted'),
      prevent: true,
    },
  },
});

const link = el('a', {
  href: '#',
  textContent: 'Stop propagation',
  events: {
    click: {
      handler: () => console.log('clicked'),
      prevent: true,
      stop: true,
    },
  },
});
```

For form inputs, set `value`, `checked`, or `selected` as direct DOM properties:

```javascript
const input = el('input', { type: 'text', value: 'prefilled' });
const checkbox = el('input', { type: 'checkbox', checked: true });
```

**`nest(parent, ...children)`**

Appends children to a parent element. Children can be DOM nodes, strings, `null`, `undefined`, or arrays. Strings become text nodes, `null` and `undefined` are ignored.

```javascript
import { createElement as el, nest } from '../framework/src/dom.js';

const ul = el('ul');
const items = ['One', 'Two', 'Three'].map(text => el('li', { textContent: text }));
nest(ul, ...items);

// Nesting also works with inline content
const card = el('div', { className: 'card' });
const title = el('h2', { textContent: 'Card Title' });
const body  = el('p',  { textContent: 'Card content goes here.' });
nest(card, title, body);
```

**Reusable components**

A component is a plain function that returns a DOM element. There's no special syntax — just call the function where you need the element.

```javascript
function Button(label, onClick) {
  return el('button', {
    className: 'btn',
    textContent: label,
    events: { click: onClick },
  });
}

function Card(title, description) {
  const card = el('div', { className: 'card' });
  const heading = el('h3', { textContent: title });
  const text    = el('p',  { textContent: description });
  nest(card, heading, text);
  return card;
}

// Using them together
const app = document.getElementById('app');
const saveBtn = Button('Save', () => console.log('saved'));
const myCard  = Card('Hello', 'This is a card.');
nest(app, myCard, saveBtn);
```

---

### State Management

**`createStore(initialState, options?)`**

Creates a reactive key-value store. Components subscribe to specific keys and receive new values whenever those keys change.

```javascript
import { createStore } from '../framework/src/state.js';

const store = createStore({ count: 0, name: 'Johannes' });

// Read a value
console.log(store.get('count'));  // 0
console.log(store.get());        // { count: 0, name: 'Johannes' }

// Update one or more values
store.set({ count: 1 });

// Subscribe to a specific key
const unsub = store.subscribe('count', (newValue, fullSnapshot) => {
  console.log('count changed to', newValue);
});

// Subscribe to any change
store.subscribe('*', (snapshot) => {
  console.log('something changed', snapshot);
});

// Remove a subscription
unsub();

// Reset everything back to the initial state
store.reset();
```

**Persisting state across sessions**

Pass a `persist` key to save state to `localStorage` automatically. When the user returns to the page, the stored data is loaded as the initial state.

```javascript
const store = createStore(
  { tasks: [], theme: 'light' },
  { persist: 'my-app' }
);

// Now every call to store.set() also updates localStorage.
store.set({ theme: 'dark' });
// Reload the page — theme will still be 'dark'.
```

**Sharing state between elements and pages**

One store can be shared by multiple components. Add `crossTab: true` together with `persist` to sync state across different browser tabs automatically.

```javascript
const store = createStore(
  { notifications: [] },
  { persist: 'app-store', crossTab: true }
);
```

**Connecting state to the DOM**

The typical pattern is to subscribe once during component setup and update the relevant DOM node inside the callback.

```javascript
const counter = el('span', { textContent: store.get('count') });
store.subscribe('count', (val) => { counter.textContent = val; });
```

---

### Event Handling

**`on(element, eventName, handler, options?)`**

Attaches an event listener and returns a cleanup function. Options: `delegate` (CSS selector for delegation), `prevent` (calls `preventDefault`), `stop` (calls `stopPropagation`).

```javascript
import { on } from '../framework/src/events.js';

const btn = document.querySelector('#save');
const off = on(btn, 'click', () => console.log('saved'));

// Remove the listener later
off();
```

**Event delegation**

Attach one listener to a parent and let it handle events from matching children. This is useful for lists where items are added dynamically.

```javascript
const list = el('ul', { id: 'task-list' });

on(list, 'click', (event, target) => {
  console.log('clicked task:', target.dataset.id);
}, { delegate: 'li[data-id]' });

// Any <li data-id="..."> inside list will trigger the handler,
// even ones added after the listener was registered.
```

**`bindEvents(element, eventsObj)`**

Attaches multiple events at once and returns a single cleanup function.

```javascript
import { bindEvents } from '../framework/src/events.js';

const input = el('input', { type: 'text' });

const cleanup = bindEvents(input, {
  focus: () => input.style.outline = '2px solid blue',
  blur:  () => input.style.outline = '',
  input: { handler: (e) => console.log(e.target.value), prevent: false },
});

// Remove all of them at once
cleanup();
```

**Lifecycle callbacks**

`onMount` fires when an element is added to the DOM. `onDestroy` fires when it is removed. These are useful for starting and cleaning up subscriptions or timers.

```javascript
import { onMount, onDestroy } from '../framework/src/events.js';

function LiveClock() {
  const span = el('span');
  let timer;

  onMount(span, () => {
    span.textContent = new Date().toLocaleTimeString();
    timer = setInterval(() => {
      span.textContent = new Date().toLocaleTimeString();
    }, 1000);
  });

  onDestroy(span, () => clearInterval(timer));

  return span;
}
```

---

### Routing

The router uses the URL hash (`#`), so it works with any static file server and requires no server-side configuration.

**`router.define(routes)`**

Maps path patterns to handler functions. Patterns can include named parameters with a `:` prefix.

```javascript
import { router } from '../framework/src/router.js';

router.define({
  '/': () => {
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(homeView());
  },
  '/users': () => {
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(usersView());
  },
  '/users/:id': ({ id }) => {
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(userDetailView(id));
  },
});

router.start();
```

**`router.navigate(path)`**

Changes the URL and triggers the matching route handler.

```javascript
// Navigating programmatically
router.navigate('/users/42');

// Inside a click handler
const link = el('a', {
  href: '#',
  textContent: 'Go to user profile',
  events: {
    click: {
      handler: () => router.navigate('/users/42'),
      prevent: true,
    },
  },
});
```

**`router.current()`** returns the current route: `{ path, params }`.

**`router.subscribe(callback)`** fires on every navigation. Useful for updating active nav links.

```javascript
router.subscribe(({ path }) => {
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.path === path);
  });
});
```

---

## Advanced Features

### HTTP Requests

The `http` module wraps `fetch` with methods for the standard REST verbs. All methods return Promises and throw on non-2xx responses.

```javascript
import { http } from '../framework/src/http.js';

// GET
const users = await http.get('https://api.example.com/users');

// POST
const newUser = await http.post('https://api.example.com/users', {
  name: 'Johannes',
  email: 'johanneskristiankonks@gmail.com',
});

// PUT
const updated = await http.put(`https://api.example.com/users/${id}`, {
  name: 'Updated Name',
});

// DELETE
await http.del(`https://api.example.com/users/${id}`);
```

**`http.bindToStore(promise, store, key)`**

Runs a request and automatically writes the result into the store. It sets `${key}Loading` to `true` while the request is running and writes either the data or an error message when it completes.

```javascript
const store = createStore({
  users: null,
  usersLoading: false,
  usersError: null,
});

await http.bindToStore(http.get('/api/users'), store, 'users');

// After the request resolves:
// store.get('users')        → the data
// store.get('usersLoading') → false
// store.get('usersError')   → null
```

---

### Performance: Lazy List Rendering

**`lazyList(container, items, renderItem, batchSize?)`**

Renders large arrays without blocking the browser. Instead of appending all items at once, it processes them in batches across animation frames. The default batch size is 20.

```javascript
import { lazyList } from '../framework/src/dom.js';

const list = el('ul');
document.getElementById('app').appendChild(list);

const bigArray = Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

lazyList(list, bigArray, (item) => {
  return el('li', { textContent: item.name, 'data-id': item.id });
});
```

Without `lazyList`, rendering 5000 items synchronously would freeze the browser while the DOM is being built. With `lazyList`, the first batch appears almost instantly and the rest fill in during idle frames.

The example app switches to `lazyList` automatically when a column has more than 20 cards. To observe the difference yourself, run `node generateData.js` after changing `cardCount` at the top of that file to `500`, then restart the server.

---

## Best Practices

**Organize by feature, not by type.** Instead of a `components/` folder and a `views/` folder, group things by the feature they belong to.

**Keep components pure.** A component function receives data and returns a DOM node. Side effects like subscriptions and HTTP calls belong in the code that mounts the component, not inside it.

**Clean up after yourself.** When a view is replaced, its subscriptions and timers should stop. Use `onDestroy` to register cleanup functions on the root element of a view or component.

```javascript
function Column(status) {
  const section = el('section');
  const unsub = store.subscribe('cards', render);
  onDestroy(section, unsub);
  return section;
}
```

**One store per feature, or one shared store.** A single global store works fine for small apps. For larger ones, create a separate store per domain (a `taskStore`, a `userStore`, etc.) and import only what a component needs.

**Don't use `innerHTML` to build structure.** Use `createElement` and `nest`. `innerHTML` bypasses the event registry and can introduce XSS vulnerabilities if user-provided strings are involved.

**Avoid deeply nested `nest()` calls.** Build pieces separately and assemble them at the end. It reads closer to the way HTML is structured.

```javascript
// Hard to read
nest(el('div'), el('header'), nest(el('nav'), el('a', { href: '#/' })));

// Easier to read
const link = el('a', { href: '#/', textContent: 'Home' });
const nav  = el('nav');
const header = el('header');
nest(nav, link);
nest(header, nav);
nest(el('div'), header);
```

---

## Example Application

The `/example` directory contains a Kanban board that uses every part of the framework.

### Running it

```bash
node server.js
# open http://localhost:3000/example/
```

### What it demonstrates

| Feature              | Where it is used                                                 |
|----------------------|------------------------------------------------------------------|
| `createElement`/`nest` | Every component — cards, columns, modals, forms                |
| `createStore`        | `store` in `app.js` — holds all card data, loading, error state  |
| `persist`            | Cards survive page reloads via `localStorage`                    |
| `crossTab`           | Changes in one tab are reflected in other open tabs              |
| `subscribe`          | Each `Column` re-renders its cards list when store changes       |
| `on`/`bindEvents`    | Buttons, form submit, modal overlay click-to-close               |
| `onDestroy`          | Each `Column` cleans up its store subscription on removal        |
| `router`             | `/` for board view, `/card/:id` for card detail view             |
| `router.navigate`    | Open/back buttons change the URL without page reload             |
| `http.get`           | Cards are fetched from the local API on startup                  |
| `http.post/put/del`  | Adding, editing, moving, and deleting cards hit the API          |
| `lazyList`           | Columns with more than 20 cards use batched rendering            |

### Adding functionality

The example is meant to be extended. Here are a few things a reviewer can add to verify the framework works:

- **Filter by status** — add a dropdown that filters the visible cards without changing the store's canonical list.
- **Search** — add a text input that hides cards whose title doesn't match. Subscribe to the input's `input` event and re-render columns.
- **Due dates** — add a `dueDate` field to the card form and display it on each card. Sorting by due date is a natural next step.
- **Card count in page title** — subscribe to the `cards` key and update `document.title` with the total count.
- **Dark mode toggle** — add a button in the app bar that toggles a class on `document.body` and persists the choice in the store.
