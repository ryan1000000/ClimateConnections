const targetWords = [
  "climate",     // 7 letters
  "data",        // 4 letters
  "earth",       // 5 letters
  "the climate", // 10 characters including space
  "science"      // 7 letters
];

const WORD_LENGTH_MAX = 10;
const GUESSES_MAX = 6;
const FLIP_ANIMATION_DURATION = 750;
const DANCE_ANIMATION_DURATION = 500;

let gameEnded = false;

const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const statsLink = document.querySelector("#seeStats");
const statsOverlay = document.querySelector("#statsOverlay");
const closeStats = statsOverlay.querySelector(".close");
const offsetFromDate = new Date(2023, 9, 24);
const msOffset = Date.now() - offsetFromDate;
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24);
const targetWord = targetWords[dayOffset % targetWords.length]; // Rotate daily through targetWords

startInteraction();
setupBoard(targetWord);

// Interaction Handlers
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

// Key Press Handling
function pressKey(key) {
  if (gameEnded) return;

  const activeTiles = getActiveTiles();
  const wordLength = targetWord.replace(/ /g, "").length;

  if (activeTiles.length >= wordLength) return;

  const nextTile = guessGrid.querySelector(":not([data-letter]):not(.inactive)");
  if (!nextTile) return;

  nextTile.dataset.letter = key.toLowerCase();
  nextTile.textContent = key.toUpperCase(); // Uppercase for consistency
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

// Guess Submission
function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  const wordLength = targetWord.replace(/ /g, "").length;

  if (activeTiles.length !== wordLength) {
    showAlert(`The word needs to be ${wordLength} letters long.`);
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
    gameEnded = true; // End the game only if the word is guessed correctly
    return;
  }

  // Check if the maximum number of guesses has been reached
  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    showAlert(`Game over! The word was "${targetWord}".`);
    gameEnded = true; // End the game if no guesses are left
  }
}

// Utility Functions
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

// Setup Board
function setupBoard(targetWord) {
  guessGrid.innerHTML = ""; // Clear existing tiles

  for (let i = 0; i < GUESSES_MAX; i++) {
    for (let j = 0; j < WORD_LENGTH_MAX; j++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");

      // Mark inactive tiles if they exceed the target word length or represent spaces
      if (j >= targetWord.replace(/ /g, "").length || targetWord[j] === " ") {
        tile.classList.add("inactive");
        tile.style.backgroundColor = "darkgrey";
      }

      guessGrid.appendChild(tile);
    }
  }
}

// Stats Overlay Handling
statsLink.onclick = function () {
  statsOverlay.style.display = "block";
};

closeStats.onclick = function () {
  statsOverlay.style.display = "none";
};
