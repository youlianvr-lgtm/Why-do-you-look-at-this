// Game — ядро логики

class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.tableau = [];
    this.foundations = [];
    this.foundationSuits = [];
    this.history = [];
    this.onWin = null;
    this.lastMove = null;

    this.config = {
      suitsCount: 4,
      cardsPerSuit: 10,
      columnsCount: 6
    };
  }

  setConfig(next) {
    const suitsCount = Math.max(1, Math.min(12, Number(next?.suitsCount ?? 4)));
    const cardsPerSuit = Math.max(
      1,
      Math.min(10, Number(next?.cardsPerSuit ?? 10))
    );

    const totalCards = suitsCount * cardsPerSuit;
    const columnsCountRaw = Number(next?.columnsCount);
    const columnsCount =
      Number.isFinite(columnsCountRaw) && columnsCountRaw > 0
        ? Math.floor(columnsCountRaw)
        : Math.min(8, Math.max(6, Math.ceil(totalCards / 7)));

    this.config = { suitsCount, cardsPerSuit, columnsCount };
  }

  initGame(config) {
    this.reset();
    this.setConfig(config);

    const totalSuitsAvailable = 12;
    const values = Array.from({ length: this.config.cardsPerSuit }, (_, i) => i + 1);

    const suits = this.pickRandomSuits(totalSuitsAvailable, this.config.suitsCount);
    this.tableau = this.createSolvableTableau(suits, values, this.config.columnsCount);

    suits.forEach(suit => {
      this.foundations.push([]);
      this.foundationSuits.push(suit);
    });
  }

  // Победа
  checkWin() {
    const allComplete = this.foundations.every(
      f => f.length === this.config.cardsPerSuit
    );
    if (allComplete && typeof this.onWin === "function") this.onWin();
  }

  isFoundationComplete(index) {
    return this.foundations[index].length === this.config.cardsPerSuit;
  }

  // Служебные методы
  pickRandomSuits(total, count) {
    const suits = [];
    while (suits.length < count) {
      const r = Math.floor(Math.random() * total);
      if (!suits.includes(r)) suits.push(r);
    }
    return suits;
  }


  createSolvableTableau(suits, values, columnsCount) {
    const tableau = Array.from({ length: columnsCount }, () => []);

    // Стартуем из заведомо решенной позиции (по мастям),
    // затем перемешиваем ТОЛЬКО легальными ходами.
    const shuffledSuits = [...suits];
    this.shuffle(shuffledSuits);

    shuffledSuits.forEach((suit, idx) => {
      const colIndex = idx % columnsCount;
      for (let v = values.length; v >= 1; v--) {
        tableau[colIndex].push({
          id: `${suit}:${v}`,
          suit,
          value: v,
          faceUp: true,
          img: `cards/${suit}/${v}.png`
        });
      }
    });

    const mixes = Math.max(120, suits.length * values.length * 8);

    for (let step = 0; step < mixes; step++) {
      const candidates = [];

      for (let fromCol = 0; fromCol < columnsCount; fromCol++) {
        const col = tableau[fromCol];
        if (!col.length) continue;

        for (let startIndex = 0; startIndex < col.length; startIndex++) {
          const stack = col.slice(startIndex);
          const validStack = stack.every(
            (card, i) => i === 0 || stack[i - 1].value === card.value + 1
          );
          if (!validStack) continue;

          const base = stack[0];
          const targets = [];

          for (let toCol = 0; toCol < columnsCount; toCol++) {
            if (toCol === fromCol) continue;
            const target = tableau[toCol];

            if (!target.length) {
              targets.push(toCol);
              continue;
            }

            const top = target[target.length - 1];
            if (top.value === base.value + 1) targets.push(toCol);
          }

          if (targets.length) candidates.push({ fromCol, startIndex, targets });
        }
      }

      if (!candidates.length) break;

      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const toCol = pick.targets[Math.floor(Math.random() * pick.targets.length)];
      const moving = tableau[pick.fromCol].splice(pick.startIndex);
      tableau[toCol].push(...moving);
    }

    // Скрываем карты: открыта только верхняя карта каждой колонки.
    tableau.forEach(col => {
      col.forEach(card => {
        card.faceUp = false;
      });
      if (col.length) col[col.length - 1].faceUp = true;
    });

    return tableau;
  }

  createDeck(suits, values) {
    const deck = [];
    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({
          id: `${suit}:${value}`,
          suit,
          value,
          faceUp: false,
          img: `cards/${suit}/${value}.png`
        });
      });
    });
    this.shuffle(deck);
    return deck;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // История
  saveState() {
    this.history.push(
      JSON.stringify({
        tableau: this.tableau,
        foundations: this.foundations,
        foundationSuits: this.foundationSuits,
        config: this.config
      })
    );
  }

  undo() {
    if (!this.history.length) return;
    const state = JSON.parse(this.history.pop());
    this.tableau = state.tableau;
    this.foundations = state.foundations;
    this.foundationSuits = state.foundationSuits ?? this.foundationSuits;
    this.config = state.config ?? this.config;
  }

  // Перемещения
  getMovableStack(fromCol, startIndex) {
    const col = this.tableau[fromCol];
    const stack = col.slice(startIndex);
    if (!stack.length) return null;
    if (!stack[0].faceUp) return null;

    for (let i = 0; i < stack.length; i++) {
      if (!stack[i].faceUp) return null;
      if (i > 0 && stack[i - 1].value !== stack[i].value + 1) return null;
    }
    return stack;
  }

  canMoveToTableau(card, colIndex) {
    const col = this.tableau[colIndex];
    if (!col.length) return true;
    const top = col[col.length - 1];
    return top.faceUp && top.value === card.value + 1;
  }

  moveStack(fromCol, startIndex, toCol) {
    if (fromCol === toCol) return false;

    const from = this.tableau[fromCol];
    const to = this.tableau[toCol];
    const stack = this.getMovableStack(fromCol, startIndex);
    if (!stack) return false;
    if (!this.canMoveToTableau(stack[0], toCol)) return false;

    this.saveState();
    this.tableau[toCol] = to.concat(stack);
    this.tableau[fromCol] = from.slice(0, startIndex);

    if (this.tableau[fromCol].length)
      this.tableau[fromCol][this.tableau[fromCol].length - 1].faceUp = true;

    this.lastMove = { type: "tableau", toCol, cardId: stack[0]?.id ?? null };
    this.checkWin();
    return true;
  }

  canMoveToFoundation(card, index) {
    const f = this.foundations[index];
    if (card.suit !== this.foundationSuits[index]) return false;
    if (f.length === 0) return card.value === 1;
    return f[f.length - 1].value + 1 === card.value;
  }

  moveToFoundation(fromCol, index) {
    const from = this.tableau[fromCol];
    if (!from.length) return false;

    const card = from[from.length - 1];
    if (!card.faceUp) return false;
    if (!this.canMoveToFoundation(card, index)) return false;

    this.saveState();
    from.pop();
    this.foundations[index].push(card);

    if (from.length) from[from.length - 1].faceUp = true;

    this.lastMove = { type: "foundation", index, cardId: card?.id ?? null };
    this.checkWin();
    return true;
  }
}

window.DIFFICULTY_PRESETS = {
  easy: { suitsCount: 2, cardsPerSuit: 4 },
  normal: { suitsCount: 4, cardsPerSuit: 7 },
  hard: { suitsCount: 4, cardsPerSuit: 10 }
};

window.game = new Game();
game.initGame(window.DIFFICULTY_PRESETS.normal);
