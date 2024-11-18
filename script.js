const targetWords = [
  "climate",
  "data",
  "earth",
  "the climate",
  "science"
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
const targetWord = targetWords[dayOffset % targetWords.length];

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
  const wordLength = targetWord.replace(/ /g, "").length;

  if (activeTiles.length >= wordLength) return;

  const nextTile = guessGrid.querySelector(":not([data-letter]):not(.inactive)");
  if (!nextTile) return;

  nextTile.dataset.letter = key.toLowerCase();
  nextTile.textContent = key.toUpperCase();
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

  // Delay the start of the flip based on the index for sequential flipping
  setTimeout(() => {
    tile.classList.add("flip");
  }, index * FLIP_ANIMATION_DURATION / 2);

  // Handle the flip transition
  tile.addEventListener(
    "transitionend",
    (e) => {
      // Ensure this handles only the transform transition
      if (e.propertyName !== "transform") return;

      tile.classList.remove("flip");

      // Set the tile's state and appearance based on the guess
      if (targetWord[index].toLowerCase() === letter) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
        tile.style.backgroundColor = "hsl(155, 67%, 45%)"; // Correct color
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "wrong-location";
        key.classList.add("wrong-location");
        tile.style.backgroundColor = "hsl(49, 51%, 47%)"; // Wrong location color
      } else {
        tile.dataset.state = "wrong";
        key.classList.add("wrong");
        tile.style.backgroundColor = "hsl(240, 2%, 23%)"; // Wrong color
      }

      // Only proceed to the game logic check after the last tile flips
      if (index === array.length - 1) {
        startInteraction(); // Allow interaction again
        checkWinLose(guess, array);
      }
    },
    { once: true } // Ensure the listener runs only once
  );
}



function checkWinLose(guess, tiles) {
  if (guess === targetWord.replace(/ /g, "")) {
    showAlert("You got it!");
    danceTiles(tiles);
    gameEnded = true;
    showScoreOverlay();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
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
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, index * DANCE_ANIMATION_DURATION / 5);
  });
}

function setupBoard(targetWord) {
  guessGrid.innerHTML = "";
  for (let i = 0; i < GUESSES_MAX; i++) {
    for (let j = 0; j < WORD_LENGTH_MAX; j++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");

      if (j >= targetWord.replace(/ /g, "").length || targetWord[j] === " ") {
        tile.classList.add("inactive");
        tile.style.backgroundColor = "darkgrey";
      }

      guessGrid.appendChild(tile);
    }
  }
}

function showScoreOverlay() {
  const scoreModal = document.getElementById("scoreModal");
  if (scoreModal) {
    scoreModal.style.display = "block";
  }
}

statsLink.onclick = function () {
  statsOverlay.style.display = "block";
};

closeStats.onclick = function () {
  statsOverlay.style.display = "none";
};
