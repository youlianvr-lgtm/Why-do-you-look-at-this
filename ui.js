// ===============================
// UI entry point
// ===============================

function getSelectedPresetKey() {
  const select = document.getElementById("difficultySelect");
  return select?.value || "normal";
}

function restartFromPreset() {
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
