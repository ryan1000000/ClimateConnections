const targetWord = 'test';

const WORD_LENGTH_MAX = 10;
const GUESSES_MAX = 6;
const FLIP_ANIMATION_DURATION = 750;
const DANCE_ANIMATION_DURATION = 500;

let gameEnded = false;

const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const offsetFromDate = new Date(2023, 9, 24);
const msOffset = Date.now() - offsetFromDate;
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24);
const targetWord = targetWords[dayOffset % targetWords.length]; // Rotate daily through targetWords

startInteraction();
setupBoard(targetWord);

function startInteraction() {
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key);
    return;
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess();
    return;
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey();
    return;
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess();
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey();
    return;
  }

  if (e.key.match(/^[a-z]$/i)) {
    pressKey(e.key);
    return;
  }
}

function pressKey(key) {
  if (gameEnded) return;

  const activeTiles = getActiveTiles();
  const activeWordLength = targetWord.replace(/ /g, "").length;

  if (activeTiles.length >= activeWordLength) return;

  const nextTile = guessGrid.querySelector(":not([data-letter]):not(.inactive)");
  if (!nextTile) return;

  nextTile.dataset.letter = key.toLowerCase();
  nextTile.textContent = key;
  nextTile.dataset.state = "active";
}

function deleteKey() {
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  if (!lastTile) return;

  lastTile.textContent = "";
  delete lastTile.dataset.state;
  delete lastTile.dataset.letter;
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  const activeWordLength = targetWord.replace(/ /g, "").length;

  if (activeTiles.length !== activeWordLength) {
    showAlert(`The word needs to be ${activeWordLength} letters long.`);
    shakeTiles(activeTiles);
    return;
  }

  const guess = activeTiles.reduce((word, tile) => word + tile.dataset.letter, "").toLowerCase();

  stopInteraction();
  activeTiles.forEach((tile, index, array) =>
    flipTile(tile, index, array, guess)
  );
}

function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter.toLowerCase();
  const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);

  setTimeout(() => {
    tile.classList.add("flip");
  }, index * FLIP_ANIMATION_DURATION / 2);

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");

      if (targetWord[index].toLowerCase() === letter) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "wrong-location";
        key.classList.add("wrong-location");
      } else {
        tile.dataset.state = "wrong";
        key.classList.add("wrong");
      }

      if (index === array.length - 1) {
        startInteraction();
        checkWinLose(guess, array);
      }
    },
    { once: true }
  );
}

function checkWinLose(guess, tiles) {
  if (guess === targetWord.replace(/ /g, "")) {
    showAlert("You got it!");
    danceTiles(tiles);
    gameEnded = true;
    return;
  }

  const remainingRows = [...guessGrid.querySelectorAll(".guess-row")].filter(
    (row) => row.querySelector(":not([data-letter])")
  );

  if (remainingRows.length === 0) {
    showAlert(`Game over! The word was "${targetWord}".`);
    gameEnded = true;
  }
}

function showAlert(message, duration = 2000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alertContainer.append(alert);

  setTimeout(() => {
    alert.remove();
  }, duration);
}

function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}

function danceTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("dance");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("dance");
      },
      { once: true }
    );
  });
}

function setupBoard(targetWord) {
  const wordLength = targetWord.replace(/ /g, "").length;

  guessGrid.innerHTML = ""; // Clear existing tiles

  for (let i = 0; i < GUESSES_MAX; i++) {
    const row = document.createElement("div");
    row.classList.add("guess-row");

    for (let j = 0; j < WORD_LENGTH_MAX; j++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");

      if (j >= wordLength || targetWord[j] === " ") {
        tile.classList.add("inactive");
        tile.style.backgroundColor = "darkgrey";
      }

      row.appendChild(tile);
    }
    guessGrid.appendChild(row);
  }
}
