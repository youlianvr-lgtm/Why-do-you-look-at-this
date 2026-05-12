// Controller — пользовательский ввод (tap + pointer drag)

window.inputState = {
  selected: null,
  dragging: null,
  suppressNextClickUntil: 0,

  clearSelection() {
    this.selected = null;
  },

  setSelection(col, index) {
    this.selected = { col, index };
  }
};

function onCardClick(e) {
  e.stopPropagation();
  if (Date.now() < inputState.suppressNextClickUntil) return;

  const cardEl = e.currentTarget;
  const col = Number(cardEl.dataset.col);
  const index = Number(cardEl.dataset.index);

  if (!Number.isFinite(col) || !Number.isFinite(index)) return;

  if (inputState.selected && inputState.selected.col === col && inputState.selected.index === index) {
    inputState.clearSelection();
    render();
    return;
  }

  const stack = game.getMovableStack(col, index);
  if (!stack) return;

  inputState.setSelection(col, index);
  render();
}

function onTargetClick(target) {
  if (!inputState.selected) return;

  const moved = attemptMove(inputState.selected, target);
  if (moved) inputState.clearSelection();
  render();
}

function attemptMove(selected, target) {
  if (!selected) return false;

  if (target.type === "tableau") {
    return game.moveStack(selected.col, selected.index, target.col);
  }

  if (target.type === "foundation") {
    const fromCol = selected.col;
    const isTopCard = selected.index === game.tableau[fromCol].length - 1;
    if (!isTopCard) return false;
    return game.moveToFoundation(fromCol, target.index);
  }

  return false;
}

// Pointer-based drag (mouse + touch)
function onCardPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return;

  const cardEl = e.currentTarget;
  const col = Number(cardEl.dataset.col);
  const index = Number(cardEl.dataset.index);
  if (!Number.isFinite(col) || !Number.isFinite(index)) return;

  const stack = game.getMovableStack(col, index);
  if (!stack) return;

  const startX = e.clientX;
  const startY = e.clientY;

  inputState.dragging = {
    pointerId: e.pointerId,
    from: { col, index },
    startX,
    startY,
    lastX: startX,
    lastY: startY,
    active: false,
    ghost: null,
    sourceEl: cardEl
  };

  try {
    cardEl.setPointerCapture(e.pointerId);
  } catch {
  }

  cardEl.onpointermove = onCardPointerMove;
  cardEl.onpointerup = onCardPointerUp;
  cardEl.onpointercancel = onCardPointerCancel;
}

function onCardPointerMove(e) {
  const drag = inputState.dragging;
  if (!drag || drag.pointerId !== e.pointerId) return;

  drag.lastX = e.clientX;
  drag.lastY = e.clientY;

  const dx = drag.lastX - drag.startX;
  const dy = drag.lastY - drag.startY;
  const dist = Math.hypot(dx, dy);

  if (!drag.active && dist < 8) return;

  if (!drag.active) {
    drag.active = true;
    inputState.setSelection(drag.from.col, drag.from.index);
    renderSelection();
    inputState.suppressNextClickUntil = Date.now() + 600;
    drag.sourceEl.classList.add("drag-source");
    drag.ghost = createDragGhost(drag.sourceEl);
    document.body.appendChild(drag.ghost);

    const card = game.tableau[drag.from.col]?.[drag.from.index];
    if (card?.faceUp) showPreview(card, { dragging: true });
  }

  if (drag.ghost) positionGhost(drag.ghost, drag.lastX, drag.lastY);
}

function onCardPointerUp(e) {
  const drag = inputState.dragging;
  if (!drag || drag.pointerId !== e.pointerId) return;

  cleanupDragHandlers(drag.sourceEl);

  if (drag.active) {
    const target = detectDropTarget(e.clientX, e.clientY);
    if (target) {
      const moved = attemptMove(drag.from, target);
      if (moved) inputState.clearSelection();
    }
    clearPreview();
    render();
  }

  inputState.dragging = null;
}

function onCardPointerCancel(e) {
  const drag = inputState.dragging;
  if (!drag || drag.pointerId !== e.pointerId) return;
  cleanupDragHandlers(drag.sourceEl);
  clearPreview();
  inputState.dragging = null;
  render();
}

function cleanupDragHandlers(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove("drag-source");

  cardEl.onpointermove = null;
  cardEl.onpointerup = null;
  cardEl.onpointercancel = null;

  const drag = inputState.dragging;
  if (drag?.ghost && drag.ghost.isConnected) drag.ghost.remove();
}

function createDragGhost(sourceEl) {
  const ghost = sourceEl.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.pointerEvents = "none";
  ghost.style.position = "fixed";
  ghost.style.left = "0px";
  ghost.style.top = "0px";
  ghost.style.transform = "translate(-9999px, -9999px)";
  return ghost;
}

function positionGhost(ghost, x, y) {
  const rect = ghost.getBoundingClientRect();
  const offsetX = rect.width / 2;
  const offsetY = rect.height / 2;
  ghost.style.transform = `translate(${Math.round(x - offsetX)}px, ${Math.round(
    y - offsetY
  )}px)`;
}

function detectDropTarget(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  const foundation = el.closest?.(".foundation-slot");
  if (foundation && foundation.dataset.foundation !== undefined) {
    return { type: "foundation", index: Number(foundation.dataset.foundation) };
  }

  const col = el.closest?.("#tableau .column");
  if (col && col.dataset.col !== undefined) {
    return { type: "tableau", col: Number(col.dataset.col) };
  }

  return null;
}

document.addEventListener(
  "click",
  e => {
    if (Date.now() < inputState.suppressNextClickUntil) return;

    const t = e.target;
    if (t.closest?.(".card")) return;
    if (t.closest?.("#tableau .column")) return;
    if (t.closest?.(".foundation-slot")) return;
    if (t.closest?.("#controls")) return;
    if (t.closest?.("#win-overlay")) return;

    if (inputState.selected) {
      inputState.clearSelection();
      render();
    }
  },
  true
);
