import { createStore } from '../framework/src/state.js';
import { on, onDestroy } from '../framework/src/events.js';
import { http } from '../framework/src/http.js';
import { router } from '../framework/src/router.js';
import { createElement as el, nest, lazyList } from '../framework/src/dom.js';

const API = 'http://localhost:3000/api';

const store = createStore({
  cards: [],
  cardsLoading: false,
  cardsError: null,
}, { persist: 'dot-js-kanban', crossTab: true });

const COLUMNS = [
  { status: 'todo',        label: 'To Do'       },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'done',        label: 'Done'        },
];

async function loadCards() {
  store.set({ cardsLoading: true, cardsError: null });
  try {
    const cards = await http.get(`${API}/cards`);
    store.set({ cards, cardsLoading: false });
  } catch (err) {
    store.set({ cardsLoading: false, cardsError: err.message });
  }
}

async function createCard(fields) {
  const card = {
    id: `c${Date.now()}`,
    title: fields.title.trim(),
    description: fields.description.trim(),
    status: fields.status,
    createdAt: Date.now(),
  };
  const created = await http.post(`${API}/cards`, card);
  store.set({ cards: [...store.get('cards'), created] });
  return created;
}

async function moveCard(id, newStatus) {
  const cards = store.get('cards');
  const card = cards.find(c => c.id === id);
  if (!card || card.status === newStatus) return;
  const updated = { ...card, status: newStatus };
  await http.put(`${API}/cards/${id}`, updated);
  store.set({ cards: cards.map(c => c.id === id ? updated : c) });
}

async function removeCard(id) {
  await http.del(`${API}/cards/${id}`);
  store.set({ cards: store.get('cards').filter(c => c.id !== id) });
}

async function saveCard(id, changes) {
  const cards = store.get('cards');
  const card = cards.find(c => c.id === id);
  const updated = { ...card, ...changes };
  await http.put(`${API}/cards/${id}`, updated);
  store.set({ cards: cards.map(c => c.id === id ? updated : c) });
  return updated;
}

function CardItem(card) {
  const div = el('div', { className: `card card--${card.status}` });

  const title = el('h3', { className: 'card__title', textContent: card.title });
  const desc = el('p', { className: 'card__desc', textContent: card.description || 'No description.' });

  const footer = el('div', { className: 'card__footer' });

  const moveSelect = el('select', { className: 'card__move' });
  nest(moveSelect, el('option', { value: '', textContent: 'Move to...' }));
  COLUMNS.forEach(({ status, label }) => {
    if (status === card.status) return;
    nest(moveSelect, el('option', { value: status, textContent: label }));
  });

  on(moveSelect, 'change', (e) => {
    if (e.target.value) moveCard(card.id, e.target.value).catch(console.error);
  });

  const viewBtn = el('button', {
    className: 'btn btn--ghost',
    textContent: 'Open',
    events: { click: () => router.navigate(`/card/${card.id}`) },
  });

  const delBtn = el('button', {
    className: 'btn btn--danger',
    textContent: '✕',
    events: { click: () => removeCard(card.id).catch(console.error) },
  });

  nest(footer, moveSelect, viewBtn, delBtn);
  nest(div, title, desc, footer);
  return div;
}

function Column(status, label) {
  const section = el('section', { className: 'column' });
  const head = el('div', { className: 'column__head' });
  const titleEl = el('h2', { className: 'column__title', textContent: label });
  const countEl = el('span', { className: 'column__count', textContent: '0' });
  const body = el('div', { className: 'column__body' });
  let cancelLazy = null;

  function render(allCards) {
    if (cancelLazy) { cancelLazy(); cancelLazy = null; }
    const filtered = allCards.filter(c => c.status === status);
    countEl.textContent = String(filtered.length);
    body.innerHTML = '';
    if (filtered.length > 20) {
      cancelLazy = lazyList(body, filtered, CardItem);
    } else {
      nest(body, ...filtered.map(CardItem));
    }
  }

  render(store.get('cards'));
  const unsub = store.subscribe('cards', render);
  onDestroy(section, unsub);

  nest(head, titleEl, countEl);
  nest(section, head, body);
  return section;
}

function AddCardModal(onClose) {
  const overlay = el('div', { className: 'modal-overlay' });
  on(overlay, 'click', (e) => { if (e.target === overlay) onClose(); });

  const modal = el('div', { className: 'modal' });
  const modalTitle = el('h2', { className: 'modal__title', textContent: 'New Card' });

  const form = el('form', { className: 'form' });

  const titleInput = el('input', {
    type: 'text',
    placeholder: 'Card title',
    className: 'form__input',
    required: true,
  });

  const descInput = el('textarea', {
    placeholder: 'Description (optional)',
    className: 'form__textarea',
    rows: '3',
  });

  const statusSelect = el('select', { className: 'form__select' });
  COLUMNS.forEach(({ status, label }) => {
    nest(statusSelect, el('option', { value: status, textContent: label }));
  });

  const errMsg = el('p', { className: 'form__error', style: { display: 'none' } });

  const btnRow = el('div', { className: 'form__actions' });
  const submitBtn = el('button', { type: 'submit', className: 'btn btn--primary', textContent: 'Add Card' });
  const cancelBtn = el('button', {
    type: 'button',
    className: 'btn btn--ghost',
    textContent: 'Cancel',
    events: { click: onClose },
  });
  nest(btnRow, submitBtn, cancelBtn);

  on(form, 'submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      errMsg.textContent = 'Title is required.';
      errMsg.style.display = 'block';
      return;
    }
    errMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    try {
      await createCard({ title, description: descInput.value, status: statusSelect.value });
      onClose();
    } catch (err) {
      errMsg.textContent = err.message;
      errMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Card';
    }
  });

  nest(form, titleInput, descInput, statusSelect, errMsg, btnRow);
  nest(modal, modalTitle, form);
  nest(overlay, modal);
  return overlay;
}

function openModal(buildFn) {
  const modal = buildFn(() => document.body.removeChild(modal));
  document.body.appendChild(modal);
}

function boardView() {
  const view = el('div', { className: 'view board-view' });

  const appBar = el('header', { className: 'app-bar' });
  const appTitle = el('span', { className: 'app-bar__title', textContent: 'dot-js Kanban' });
  const addBtn = el('button', {
    className: 'btn btn--primary',
    textContent: '+ New Card',
    events: { click: () => openModal(AddCardModal) },
  });
  nest(appBar, appTitle, addBtn);

  const notice = el('div', { className: 'notice', style: { display: 'none' } });

  const unsubLoading = store.subscribe('cardsLoading', (loading) => {
    if (loading) {
      notice.textContent = 'Loading cards…';
      notice.className = 'notice notice--info';
      notice.style.display = 'block';
    } else {
      notice.style.display = 'none';
    }
  });

  const unsubError = store.subscribe('cardsError', (err) => {
    if (err) {
      const cached = store.get('cards');
      notice.textContent = cached.length
        ? `Server unavailable — showing ${cached.length} cached cards.`
        : `Could not load cards: ${err}`;
      notice.className = 'notice notice--warn';
      notice.style.display = 'block';
    }
  });

  onDestroy(view, () => { unsubLoading(); unsubError(); });

  const board = el('div', { className: 'board' });
  COLUMNS.forEach(({ status, label }) => nest(board, Column(status, label)));

  nest(view, appBar, notice, board);
  return view;
}

function cardDetailView({ id }) {
  const view = el('div', { className: 'view card-detail-view' });

  const backBtn = el('button', {
    className: 'btn btn--ghost',
    textContent: '← Board',
    events: { click: () => router.navigate('/') },
  });

  const card = store.get('cards').find(c => c.id === id);

  if (!card) {
    const msg = el('p', { className: 'notice notice--warn', textContent: 'Card not found.' });
    nest(view, backBtn, msg);
    return view;
  }

  const panel = el('div', { className: 'detail-panel' });

  const titleInput = el('input', {
    type: 'text',
    className: 'detail__title',
    value: card.title,
  });

  const descInput = el('textarea', {
    className: 'detail__desc',
    rows: '6',
    textContent: card.description,
  });

  const statusEl = el('span', {
    className: `badge badge--${card.status}`,
    textContent: COLUMNS.find(c => c.status === card.status)?.label || card.status,
  });

  const dateEl = el('span', {
    className: 'detail__date',
    textContent: `Created ${new Date(card.createdAt).toLocaleDateString()}`,
  });

  const meta = el('div', { className: 'detail__meta' });
  nest(meta, statusEl, dateEl);

  const feedback = el('span', { className: 'detail__feedback', style: { display: 'none' } });

  const saveBtn = el('button', {
    className: 'btn btn--primary',
    textContent: 'Save',
    events: {
      click: async () => {
        saveBtn.disabled = true;
        try {
          await saveCard(id, { title: titleInput.value, description: descInput.value });
          feedback.textContent = 'Saved';
          feedback.className = 'detail__feedback detail__feedback--ok';
          feedback.style.display = 'inline';
          setTimeout(() => { feedback.style.display = 'none'; }, 2000);
        } catch (err) {
          feedback.textContent = err.message;
          feedback.className = 'detail__feedback detail__feedback--err';
          feedback.style.display = 'inline';
        }
        saveBtn.disabled = false;
      },
    },
  });

  const deleteBtn = el('button', {
    className: 'btn btn--danger',
    textContent: 'Delete Card',
    events: {
      click: async () => {
        await removeCard(id);
        router.navigate('/');
      },
    },
  });

  const actions = el('div', { className: 'detail__actions' });
  nest(actions, saveBtn, feedback, deleteBtn);

  nest(panel, titleInput, descInput, meta, actions);
  nest(view, backBtn, panel);
  return view;
}

function renderView(view) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  nest(app, view);
}

router.define({
  '/': () => renderView(boardView()),
  '/card/:id': (params) => renderView(cardDetailView(params)),
});

loadCards();
router.start();
