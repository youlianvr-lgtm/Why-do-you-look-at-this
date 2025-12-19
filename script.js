// ===============================
// Game — ядро логики
// ===============================

class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.tableau = [];
    this.foundations = [];
    this.foundationSuits = [];
    this.history = [];
    this.onWin = null; // callback победы (UI)
  }

  initGame() {
    this.reset();

    const TOTAL_SUITS = 12;
    const SELECTED_SUITS = 4;
    const VALUES = [1,2,3,4,5,6,7,8,9,10];
    const COLUMNS = 6;

    const suits = this.pickRandomSuits(TOTAL_SUITS, SELECTED_SUITS);
    const deck = this.createSolvableDeck(suits, VALUES);

    this.tableau = Array.from({ length: COLUMNS }, () => []);
    deck.forEach((card, i) => this.tableau[i % COLUMNS].push(card));

    this.tableau.forEach(col => {
      if (col.length) col[col.length - 1].faceUp = true;
    });

    suits.forEach(suit => {
      this.foundations.push([]);
      this.foundationSuits.push(suit);
    });
  }

  // ===============================
  // ПРОВЕРКА ПОБЕДЫ
  // ===============================
  checkWin() {
    const allComplete = this.foundations.every(f => f.length === 10);
    if (allComplete && typeof this.onWin === 'function') {
      this.onWin();
    }
  }

  isFoundationComplete(index) {
    return this.foundations[index].length === 10;
  }

  // ===============================
  // СЛУЖЕБНЫЕ МЕТОДЫ
  // ===============================
  pickRandomSuits(total, count) {
    const suits = [];
    while (suits.length < count) {
      const r = Math.floor(Math.random() * total);
      if (!suits.includes(r)) suits.push(r);
    }
    return suits;
  }

  createSolvableDeck(suits, values) {
    const deck = [];
    suits.forEach(suit => {
      const seq = values.map(value => ({
        suit,
        value,
        faceUp: false,
        img: `cards/${suit}/${value}.png`
      }));
      this.shuffle(seq);
      deck.push(...seq);
    });
    return this.interleave(deck, suits.length);
  }

  interleave(deck, suitCount) {
    const result = [];
    const groups = Array.from({ length: suitCount }, () => []);
    deck.forEach(card => groups[card.suit % suitCount].push(card));
    while (groups.some(g => g.length)) {
      groups.forEach(g => g.length && result.push(g.pop()));
    }
    return result;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // ===============================
  // ПЕРЕМЕЩЕНИЯ
  // ===============================
  saveState() {
    this.history.push(JSON.stringify({
      tableau: this.tableau,
      foundations: this.foundations
    }));
  }

  undo() {
    if (!this.history.length) return;
    const state = JSON.parse(this.history.pop());
    this.tableau = state.tableau;
    this.foundations = state.foundations;
  }

  canMoveToTableau(card, colIndex) {
    const col = this.tableau[colIndex];
    if (!col.length) return true;
    const top = col[col.length - 1];
    return top.faceUp && top.value === card.value + 1;
  }

  moveStack(fromCol, startIndex, toCol) {
    const from = this.tableau[fromCol];
    const to = this.tableau[toCol];
    const stack = from.slice(startIndex);
    if (!this.canMoveToTableau(stack[0], toCol)) return;

    this.saveState();
    this.tableau[toCol] = to.concat(stack);
    this.tableau[fromCol] = from.slice(0, startIndex);

    if (this.tableau[fromCol].length)
      this.tableau[fromCol][this.tableau[fromCol].length - 1].faceUp = true;
  }

  canMoveToFoundation(card, index) {
    const f = this.foundations[index];
    if (card.suit !== this.foundationSuits[index]) return false;
    if (f.length === 0) return card.value === 1;
    return f[f.length - 1].value + 1 === card.value;
  }
}

window.game = new Game();
game.initGame();
