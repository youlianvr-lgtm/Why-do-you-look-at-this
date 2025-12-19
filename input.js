// ===============================
// Controller — пользовательский ввод
// ===============================

let selected = null;

// ===============================
// BUTTONS
// ===============================
document.getElementById("undoBtn").onclick = () => {
  game.undo();
  render();
};

document.getElementById("restartBtn").onclick = () => {
  game.initGame();
  render();
};

// ===============================
// DRAG & DROP
// ===============================
function dragStart(e) {
  const cardEl = e.target;

  selected = {
    col: +cardEl.dataset.col,
    index: +cardEl.dataset.index
  };

  cardEl.classList.add("dragging");
  highlightTargets();
}

function clearDragging() {
  document
    .querySelectorAll('.card.dragging')
    .forEach(c => c.classList.remove('dragging'));
}

function dropOnColumn(e, col) {
  e.preventDefault();
  clearDragging();
  if (!selected) return;

  game.moveStack(selected.col, selected.index, col);
  selected = null;
  render();
}

function dropOnFoundation(e, index) {
  e.preventDefault();
  clearDragging();
  if (!selected) return;

  const fromCol = game.tableau[selected.col];
  const card = fromCol[fromCol.length - 1];

  if (
    selected.index === fromCol.length - 1 &&
    game.canMoveToFoundation(card, index)
  ) {
    game.saveState();
    fromCol.pop();
    game.foundations[index].push(card);

    if (fromCol.length)
      fromCol[fromCol.length - 1].faceUp = true;
  }

  selected = null;
  render();
}
