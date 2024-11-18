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
const dailyStatsList = document.querySelector("#dailyStats");
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzp0n5VH41_LINlDye0P9p5S6udnmUmPgazMWZBw6r2HtL2-0DBor7NoVLJpmXx3yLu9A/exec'; 
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
  flipTiles(activeTiles, guess);
}

function flipTiles(tiles, guess) {
  tiles.forEach((tile, index) => {
    const letter = tile.dataset.letter.toLowerCase();
    const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);

    setTimeout(() => {
      tile.classList.add("flip");

      setTimeout(() => {
        if (targetWord[index].toLowerCase() === letter) {
          tile.dataset.state = "correct";
          key.classList.add("correct");
          tile.style.backgroundColor = "hsl(155, 67%, 45%)";
        } else if (targetWord.includes(letter)) {
          tile.dataset.state = "wrong-location";
          key.classList.add("wrong-location");
          tile.style.backgroundColor = "hsl(49, 51%, 47%)";
        } else {
          tile.dataset.state = "wrong";
          key.classList.add("wrong");
          tile.style.backgroundColor = "hsl(240, 2%, 23%)";
        }

        tile.classList.remove("flip");

        if (index === tiles.length - 1) {
          checkWinLose(guess, tiles);
        }
      }, FLIP_ANIMATION_DURATION / 2);
    }, index * FLIP_ANIMATION_DURATION / 2);
  });
}

function checkWinLose(guess, tiles) {
  if (guess === targetWord.replace(/ /g, "")) {
    showAlert("Congratulations! You guessed the word!");
    danceTiles(tiles);
    gameEnded = true;
    setTimeout(showScoreOverlay, 1500);
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
    tile.addEventListener("animationend", () => {
      tile.classList.remove("shake");
    }, { once: true });
  });
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener("animationend", () => {
        tile.classList.remove("dance");
      }, { once: true });
    }, index * DANCE_ANIMATION_DURATION / 5);
  });
}

function setupBoard(targetWord) {
  guessGrid.innerHTML = "";

  for (let i = 0; i < GUESSES_MAX; i++) {
    for (let j = 0; j < WORD_LENGTH_MAX; j++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.textContent = "";
      tile.style.backgroundColor = "";

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

  fetch(GAS_URL)
    .then((response) => response.json())
    .then((data) => {
      document.querySelector(".loading-message").style.display = "none";

      dailyStatsList.innerHTML = "";
      data.slice(0, 100).forEach((row) => {
        const li = document.createElement("li");
        li.textContent = `${row[1]}: ${row[2]}`; // Assuming name is in the second column and score in the third
        dailyStatsList.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error fetching stats:", error);
    });
};

closeStats.onclick = function () {
  statsOverlay.style.display = "none";
  document.querySelector(".loading-message").style.display = "block";
};

function submitScore() {
  const playerName = document.getElementById("playerNameInput").value;
  const score = getScore();
  const formURL = `https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse`; // Replace with your form's URL

  if (!playerName) {
    showAlert("Please enter your name before submitting.");
    return;
  }

  const formData = new FormData();
  formData.append("entry.YOUR_NAME_FIELD_ID", playerName); // Replace with actual field ID
  formData.append("entry.YOUR_SCORE_FIELD_ID", score);     // Replace with actual field ID

  fetch(formURL, {
    method: "POST",
    body: formData,
    mode: "no-cors"
  })
    .then(() => {
      showAlert("Score submitted successfully!");
      document.getElementById("scoreModal").style.display = "none";
    })
    .catch((error) => {
      console.error("Error submitting score:", error);
      showAlert("Failed to submit score. Please try again.");
    });
}

function getScore() {
  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])").length;
  const guessesMade = GUESSES_MAX - remainingTiles / WORD_LENGTH_MAX;
  return guessesMade;
}
