const climateDictionary = {
  
  "climate data": "DPO can hook you up.",
  "clean energy": "Detergent power user?",
  "bomb cyclone": "Intense intensification?",
  "carbon tax": "Is MB taking a holiday?",
  "heat wave": "Persistent percentile?",
  "dewpoint": "It's a wet kind of cold.",
  "coral reef": "Don't bleach?",
  "snow storm": "Oh, the weather outside is frightful!",
  "drizzle": "Miniature hydrometeor.",
  "baseline": "Is this the new normal?",
  "engagement": "What do YOU think?",
  "lapse rate": "Feeling stable today.",
  "extreme heat": "Radical temps!",
  "low carbon": "clean growth?",
  "fire risk": "Don't let the FWI team hear you say this.",
  "data viewer": "Oldschool CCCS Product.",
  "air quality": "Mask up!",
  "arctic ice": "early breakups are hard.",
  "flash flood": "Pluvial possibility.",
  "heat dome": "Put a lid on it!",
  "analogue app": "What will my climate look like?",
  "flood map": "Ya, ya, we know.",
  "wind power": "This blows!",
  "fossil fuel": "drill baby, drill!",
  "sea level": "Remember, it's all relative.",

};


const WORD_LENGTH_MAX = 12;
const GUESSES_MAX = 6;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;

let gameEnded = false;

const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const statsLink = document.querySelector("#seeStats");
const statsOverlay = document.querySelector("#statsOverlay");
const closeStats = statsOverlay.querySelector(".close");
const dailyStatsList = document.querySelector("#dailyStats");
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwv8MZFfU3ki7BjhU5MQK4C_JBPQIRlKJKUzVg0xKkE72EEy86k8G4iokk7j9y1IIUlsg/exec'; 
const offsetFromDate = new Date(2024, 10, 25);
const msOffset = Date.now() - offsetFromDate;

console.log(Date.now());
console.log(offsetFromDate);
console.log(msOffset);

const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24);
const wordList = Object.keys(climateDictionary);
const targetWord = wordList[dayOffset % wordList.length];
const targetClue = climateDictionary[targetWord];

const playerNameInput = document.getElementById("playerNameInput");
const modal = document.getElementById("scoreModal");

startInteraction();
setupBoard(targetWord);

// Show the clue at the start of the game
// TURNING OFF FOR NOW, I THINK IT MAKES THINGS TOO EASY...
showPersistentAlert(targetClue);

function setupBoard(targetWord) {
  guessGrid.innerHTML = ""; // Clear existing tiles
  let charIndex = 0; // Tracks the position in the targetWord

  for (let i = 0; i < GUESSES_MAX; i++) {
    for (let j = 0; j < WORD_LENGTH_MAX; j++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.textContent = "";
      tile.style.backgroundColor = "";

      // Mark inactive tiles if:
      // 1. We've passed all characters in the target word.
      // 2. The current character is a space.
      if (charIndex >= targetWord.length || targetWord[charIndex] === " ") {
        tile.classList.add("inactive");
        tile.style.backgroundColor = "#2e2d2d";

        if (charIndex < targetWord.length && targetWord[charIndex] === " ") {
          charIndex++; // Skip over the space in the targetWord
        }
      } else {
        charIndex++; // Move to the next character in the targetWord
      }

      guessGrid.appendChild(tile);
    }
    charIndex = 0; // Reset for the next row
  }
}

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
  const cleanedTargetWord = targetWord.replace(/ /g, "").toLowerCase(); // Remove spaces and normalize case
  const targetLetterCounts = {};

  // Count the frequency of each letter in the target word
  for (const letter of cleanedTargetWord) {
    if (!targetLetterCounts[letter]) {
      targetLetterCounts[letter] = 0;
    }
    targetLetterCounts[letter]++;
  }

  // First pass: Identify and mark correct (green) tiles
  const resultStates = tiles.map((tile, index) => {
    const guessedLetter = tile.dataset.letter?.toLowerCase();
    const targetLetter = cleanedTargetWord[index];

    if (guessedLetter === targetLetter) {
      targetLetterCounts[guessedLetter]--; // Deduct from counts
      return "correct"; // Mark as green
    }
    return null; // Not determined yet
  });

  // Second pass: Mark wrong-location (yellow) and incorrect (grey) tiles
  tiles.forEach((tile, index) => {
    const guessedLetter = tile.dataset.letter?.toLowerCase();
    if (resultStates[index] === "correct") {
      // Already marked as correct
      resultStates[index] = {
        state: "correct",
        color: "hsl(155, 67%, 45%)", // Green
      };
      return;
    }

    if (guessedLetter && targetLetterCounts[guessedLetter] > 0) {
      // Mark as wrong-location (yellow)
      resultStates[index] = {
        state: "wrong-location",
        color: "hsl(49, 51%, 47%)", // Yellow
      };
      targetLetterCounts[guessedLetter]--; // Deduct from counts
    } else {
      // Mark as incorrect (grey)
      resultStates[index] = {
        state: "wrong",
        color: "hsl(240, 2%, 23%)", // Grey
      };
    }
  });

  // Apply animations and delayed visual updates
  tiles.forEach((tile, index) => {
    const { state, color } = resultStates[index];

    setTimeout(() => {
      tile.classList.add("flip");

      setTimeout(() => {
        // Update the tile's state and color at the halfway point of the flip
        tile.dataset.state = state;
        tile.style.backgroundColor = color;

        tile.classList.remove("flip");

        // Check win/lose after the last tile is revealed
        if (index === tiles.length - 1) {
          checkWinLose(guess, tiles);
        }
      }, FLIP_ANIMATION_DURATION / 2);
    }, index * FLIP_ANIMATION_DURATION); // Sequential delay
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

  const remainingGuesses = guessGrid.querySelectorAll(":not([data-letter])").length / WORD_LENGTH_MAX;
  if (remainingGuesses === 0) {
    showAlert(`Game over! The word was "${targetWord}".`);
    gameEnded = true;
    return;
  }

  startInteraction();
}

function shakeTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("shake");
      setTimeout(() => {
        tile.classList.remove("shake");
      }, 500);
    }, index * 100);
  });
}

function showScoreOverlay() {
  const scoreModal = document.getElementById("scoreModal");
  if (scoreModal) {
    scoreModal.style.display = "block";
  }
}

function submitScore() {
  const playerName = playerNameInput.value;
  const score = getScore();
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfD3lvoGvcDx16P-pQd_2HpZEHEesnsCC3aHNe_NNXnQxqNTQ/formResponse";

  const formData = new FormData();
  formData.append("entry.1698848551", playerName);
  formData.append("entry.1512423051", score);

  fetch(formURL, {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  })
    .then(() => {
      modal.style.display = "none";
      setTimeout(() => statsLink.onclick(), 1000);
    })
    .catch((error) => console.error("Error:", error));
}

function getScore() {
  const wordLength = targetWord.replace(/ /g, "").length;
  const totalPlayableTiles = GUESSES_MAX * wordLength;
  const usedTiles = guessGrid.querySelectorAll("[data-letter]").length;
  return GUESSES_MAX - (totalPlayableTiles - usedTiles) / wordLength;
}

statsLink.onclick = function () {
  statsOverlay.style.display = "block";

  fetch(GAS_URL)
    .then((response) => response.json())
    .then((data) => {
      const statsData = JSON.parse(data.body);

      document.querySelector(".loading-message").style.display = "none";

      dailyStatsList.innerHTML = "";
      statsData.slice(0, 100).forEach((row) => {
        const li = document.createElement("li");
        li.textContent = `${row[1]}: ${row[2]}`;
        dailyStatsList.appendChild(li);
      });
    })
    .catch((error) => console.error("Error fetching stats:", error));
};

closeStats.onclick = function () {
  statsOverlay.style.display = "none";
  document.querySelector(".loading-message").style.display = "block";
};

function showPersistentAlert(message) {
  alertContainer.innerHTML = ""; // Clear existing alerts
  const alert = document.createElement("div");
  alert.className = "alert persistent";
  alert.textContent = `Today's theme: ${message}`;
  alertContainer.appendChild(alert);

  setTimeout(() => alert.remove(), 5000);
}

function showAlert(message) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.className = "alert";
  alertContainer.appendChild(alert);

  setTimeout(() => alert.remove(), 3000);
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      setTimeout(() => tile.classList.remove("dance"), DANCE_ANIMATION_DURATION);
    }, index * 100);
  });
}

document.getElementById("modal-close").onclick = function () {
  modal.style.display = "none";
};

document.getElementById("submitScoreBtn").onclick = function () {
  submitScore();
  modal.style.display = "none";
};
