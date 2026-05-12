// ===============================
// UI entry point
// ===============================

function preloadAllTextures() {
  if (window._assetsPreloadPromise) return window._assetsPreloadPromise;

  const urls = ["cards/back.png"];
  for (let suit = 0; suit < 12; suit++) {
    urls.push(`cards/T/${suit}.png`);
    for (let value = 1; value <= 10; value++) {
      urls.push(`cards/${suit}/${value}.png`);
    }
  }

  const preloaded = [];
  window._assetsPreloadPromise = Promise.all(
    urls.map(
      url =>
        new Promise(resolve => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = url;
          preloaded.push(img);
        })
    )
  ).then(() => {
    // Держим ссылки, чтобы кэш не очищался между рестартами.
    window._preloadedTextures = preloaded;
  });

  return window._assetsPreloadPromise;
}

function getSelectedPresetKey() {
  const select = document.getElementById("difficultySelect");
  return select?.value || "normal";
}

async function restartFromPreset() {
  await preloadAllTextures();

  const key = getSelectedPresetKey();
  const preset = window.DIFFICULTY_PRESETS?.[key] ?? window.DIFFICULTY_PRESETS.normal;
  inputState.clearSelection();
  hideWinOverlay();
  window._prevFaceUpCardIds = new Set();
  game.initGame(preset);
  render();
}

function showWinOverlay() {
  document.getElementById("win-overlay")?.classList.add("show");
}

function hideWinOverlay() {
  document.getElementById("win-overlay")?.classList.remove("show");
}

game.onWin = showWinOverlay;

document.getElementById("undoBtn").onclick = () => {
  hideWinOverlay();
  inputState.clearSelection();
  game.undo();
  render();
};

document.getElementById("restartBtn").onclick = restartFromPreset;
document.getElementById("difficultySelect").onchange = restartFromPreset;
document.getElementById("winRestartBtn").onclick = restartFromPreset;

render();

preloadAllTextures().then(() => {
  // Повторный рендер после прогрева текстур.
  render();
});
