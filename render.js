// Renderer — отображение состояния игры
// Не содержит игровой логики

function render() {
  renderTableau();
  renderFoundations();
  renderSelection();
  applyLightAnimations();
}

// TABLEAU
function renderTableau() {
  const el = document.getElementById("tableau");
  el.innerHTML = "";

  game.tableau.forEach((column, colIndex) => {
    const col = document.createElement("div");
    col.className = "column";
    col.dataset.col = String(colIndex);

    col.onclick = () => onTargetClick({ type: "tableau", col: colIndex });

    column.forEach((card, index) => {
      const cardEl = createCard(card, colIndex, index);
      col.appendChild(cardEl);
    });

    el.appendChild(col);
  });
}

// FOUNDATIONS (динамически)
function renderFoundations() {
  const root = document.getElementById("foundations");
  root.innerHTML = "";

  game.foundations.forEach((foundation, foundationIndex) => {
    const slot = document.createElement("div");
    slot.className = "column foundation-slot";
    slot.dataset.foundation = String(foundationIndex);

    if (game.isFoundationComplete(foundationIndex)) slot.classList.add("complete");

    const suit = game.foundationSuits[foundationIndex];

    if (!foundation.length) {
      const tex = document.createElement("div");
      tex.className = "foundation-texture";
      tex.style.backgroundImage = `url('cards/T/${suit}.png')`;
      slot.appendChild(tex);
    } else {
      const top = foundation[foundation.length - 1];
      const cardEl = createCard(top, null, null);
      cardEl.classList.add("foundation-top");
      slot.appendChild(cardEl);
    }

    slot.onclick = () => onTargetClick({ type: "foundation", index: foundationIndex });
    root.appendChild(slot);
  });
}

// CARD
function createCard(card, colIndex, index) {
  const el = document.createElement("div");
  el.className = "card";

  if (colIndex !== null && colIndex !== undefined) el.dataset.col = String(colIndex);
  if (index !== null && index !== undefined) el.dataset.index = String(index);

  if (card.faceUp) el.classList.add("face-up");
  if (card.id) el.dataset.cardId = String(card.id);
  el.setAttribute("aria-label", card.faceUp ? `Карта ${card.value}` : "Закрытая карта");

  const img = document.createElement("img");
  img.src = card.faceUp ? card.img : "cards/back.png";
  img.alt = "";
  el.appendChild(img);

  if (card.faceUp) {
    const v = document.createElement("div");
    v.className = "value";
    v.textContent = String(card.value);
    el.appendChild(v);

    const isTableauCard =
      colIndex !== null &&
      colIndex !== undefined &&
      index !== null &&
      index !== undefined;

    if (isTableauCard) {
      el.onpointerdown = onCardPointerDown;
      el.onclick = onCardClick;
      el.onmouseenter = () => showPreview(card);
      el.onmouseleave = clearPreview;
    }
  }

  return el;
}

// PREVIEW
function showPreview(card, options = {}) {
  const box = document.getElementById("preview-card");
  if (!card || !card.faceUp) return;

  box.innerHTML = "";
  box.classList.remove("show", "drag-preview");

  const img = document.createElement("img");
  img.src = card.img;
  img.alt = "";
  box.appendChild(img);

  if (options.dragging) box.classList.add("drag-preview");

  requestAnimationFrame(() => box.classList.add("show"));
}

function clearPreview() {
  const box = document.getElementById("preview-card");
  box.classList.remove("show", "drag-preview");
}

// SELECTION / HIGHLIGHTS
function renderSelection() {
  document
    .querySelectorAll(".card.selected, .card.in-selected-stack")
    .forEach(el => el.classList.remove("selected", "in-selected-stack"));

  document
    .querySelectorAll(".column.highlight")
    .forEach(el => el.classList.remove("highlight"));

  const selected = window.inputState?.selected;
  if (!selected) return;

  const { col, index } = selected;
  const stack = game.getMovableStack(col, index);
  if (!stack) return;

  const cards = Array.from(
    document.querySelectorAll(`#tableau .column[data-col="${col}"] .card`)
  );
  cards.forEach((cardEl, i) => {
    if (i === index) cardEl.classList.add("selected");
    if (i > index) cardEl.classList.add("in-selected-stack");
  });

  const base = stack[0];
  game.tableau.forEach((_, toCol) => {
    if (game.canMoveToTableau(base, toCol)) {
      const colEl = document.querySelector(`#tableau .column[data-col="${toCol}"]`);
      if (colEl) colEl.classList.add("highlight");
    }
  });

  if (index === game.tableau[col].length - 1) {
    const last = stack[stack.length - 1];
    game.foundations.forEach((_, fIndex) => {
      if (game.canMoveToFoundation(last, fIndex)) {
        const slot = document.querySelector(
          `#foundations .foundation-slot[data-foundation="${fIndex}"]`
        );
        if (slot) slot.classList.add("highlight");
      }
    });
  }
}

// Light animations (flip + drop feedback)
function applyLightAnimations() {
  const cssEscape =
    window.CSS && typeof window.CSS.escape === "function"
      ? window.CSS.escape
      : s => String(s);

  const prev = (window._prevFaceUpCardIds ??= new Set());
  const next = new Set();

  game.tableau.forEach(col => {
    col.forEach(card => {
      if (card.faceUp && card.id) next.add(card.id);
    });
  });

  next.forEach(id => {
    if (prev.has(id)) return;
    document
      .querySelectorAll(`.card[data-card-id="${cssEscape(id)}"]`)
      .forEach(el => {
        el.classList.remove("flip-in");
        void el.offsetWidth;
        el.classList.add("flip-in");
      });
  });

  window._prevFaceUpCardIds = next;

  if (game.lastMove?.cardId) {
    const id = game.lastMove.cardId;
    const els = document.querySelectorAll(
      `.card[data-card-id="${cssEscape(id)}"]`
    );
    els.forEach(el => {
      el.classList.remove("drop-ok");
      void el.offsetWidth;
      el.classList.add("drop-ok");
    });
    game.lastMove = null;
  }
}
