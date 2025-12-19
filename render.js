// ===============================
// Renderer — отображение состояния игры
// Не содержит игровой логики
// ===============================

function render() {
  renderTableau();
  renderFoundations();
  clearHighlights();
}

// ===============================
// TABLEAU
// ===============================
function renderTableau() {
  const el = document.getElementById("tableau");
  el.innerHTML = "";

  game.tableau.forEach((column, colIndex) => {
    const col = document.createElement("div");
    col.className = "column";

    column.forEach((card, index) => {
      const cardEl = createCard(card);
      cardEl.dataset.col = colIndex;
      cardEl.dataset.index = index;

      if (card.faceUp) {
        cardEl.draggable = true;
        cardEl.ondragstart = dragStart;
      }

      col.appendChild(cardEl);
    });

    col.ondragover = e => e.preventDefault();
    col.ondrop = e => dropOnColumn(e, colIndex);

    el.appendChild(col);
  });
}

// ===============================
// FOUNDATIONS (текстуры + подсветка)
// ===============================
function renderFoundations() {
  const cols = document.querySelectorAll(".foundation-column");
  cols.forEach(c => c.innerHTML = "");

  game.foundations.forEach((foundation, i) => {
    const slot = document.createElement("div");
    slot.className = "column foundation-slot"; // foundation-slot для подсветки

    // если фундамент собран полностью — подсветка
    if (game.isFoundationComplete(i)) {
      slot.classList.add("complete");
    }

    const suit = game.foundationSuits[i];

    if (foundation.length === 0) {
      // текстура масти для пустого фундамента
      const tex = document.createElement("div");
      tex.className = "foundation-texture";
      tex.style.backgroundImage = `url('cards/T/${suit}.png')`;
      tex.style.backgroundSize = "cover"; // чтобы текстура занимала всю ячейку
      tex.style.width = "100%";
      tex.style.height = "100%";
      slot.appendChild(tex);
    } else {
      // верхняя карта
      slot.appendChild(createCard(foundation[foundation.length - 1]));
    }

    slot.ondragover = e => e.preventDefault();
    slot.ondrop = e => dropOnFoundation(e, i);

    cols[i < 2 ? 0 : 1].appendChild(slot);
  });
}



// ===============================
// CARD
// ===============================
function createCard(card) {
  const el = document.createElement("div");
  el.className = "card";

  if (card.faceUp) el.classList.add("face-up");

  const img = document.createElement("img");
  img.src = card.faceUp ? card.img : "cards/back.png";
  el.appendChild(img);

  if (card.faceUp) {
    const v = document.createElement("div");
    v.className = "value";
    v.textContent = card.value;
    el.appendChild(v);

    el.onmouseenter = () => showPreview(card);
    el.onmouseleave = clearPreview;
  }

  return el;
}

// ===============================
// PREVIEW
// ===============================
function showPreview(card) {
  const box = document.getElementById("preview-card");

  if (!card || !card.faceUp) return;

  box.innerHTML = "";
  box.classList.remove("show");

  const img = document.createElement("img");
  img.src = card.img;
  box.appendChild(img);

  // даём браузеру применить DOM, затем включаем анимацию
  requestAnimationFrame(() => {
    box.classList.add("show");
  });
}

function clearPreview() {
  const box = document.getElementById("preview-card");
  box.classList.remove("show");
}


// ===============================
// HIGHLIGHTS
// ===============================
function highlightTargets() {
  clearHighlights();
  if (!selected) return;

  const fromCol = game.tableau[selected.col];
  const stack = fromCol.slice(selected.index);
  const baseCard = stack[0];

  game.tableau.forEach((_, i) => {
    if (game.canMoveToTableau(baseCard, i)) {
      document.querySelectorAll("#tableau .column")[i]
        .classList.add("highlight");
    }
  });

  const lastCard = stack[stack.length - 1];
  game.foundations.forEach((_, i) => {
    if (
      selected.index === fromCol.length - 1 &&
      game.canMoveToFoundation(lastCard, i)
    ) {
      const colIndex = i < 2 ? 0 : 1;
      const slot = document
        .querySelectorAll(".foundation-column")[colIndex]
        .children[i % 2];
      if (slot) slot.classList.add("highlight");
    }
  });
}

function clearHighlights() {
  document.querySelectorAll(".column")
    .forEach(c => c.classList.remove("highlight"));
}
