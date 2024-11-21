const targetWords = [
  "dewpoint",
  "clean energy",
  "carbon tax",
  "global warming",
  "heatwave",
  "icebergs",
  "supportive",
  "coral reefs",
  "blizzard",
  "drizzle",
  "dataset",
  "solar flare",
  "spatial map",
  "baseline",
  "freezing",
  "engagement",
  "emissions",
  "sunlight",
  "extreme heat",
  "just transition",
  "energy grid",
  "knowledge",
  "regional",
  "water crisis",
  "graphical",
  "wildfire ash",
  "wildfire",
  "data viewer",
  "historical",
  "air quality",
  "snowstorm",
  "cyclone",
  "arctic ice",
  "downpour",
  "adaptation",
  "heat domes",
  "data portal",
  "analogues",
  "drought",
  "risk map",
  "wind power",
  "dashboard",
  "snow melt",
  "fossil fuel",
  "climate data",
  "methane gas",
  "sea level",
  "flood risk",
  "client focus",
  "resources",
  "frostbite",
  "ocean heat",
  "hailstorm",
  "tornado",
  "thunder",
  "windy day",
  "rainfall",
  "outreach",
  "renewable",
  "raincloud",
  "chinook",
  "projection"
];


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
const offsetFromDate = new Date(2023, 9, 24);
const msOffset = Date.now() - offsetFromDate;
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24);
const targetWord = targetWords[dayOffset % targetWords.length]; // Rotate daily through targetWords

const playerNameInput = document.getElementById("playerNameInput");
const modal = document.getElementById("scoreModal"); // Correctly initialized

startInteraction();
setupBoard(targetWord);

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
  //const wordLength = guessGrid.querySelectorAll(":not(.inactive)").length / GUESSES_MAX;

  if (activeTiles.length !== wordLength) {
    showAlert(`The word needs to be ${wordLength} letters long.`);
    shakeTiles(activeTiles); // Shake tiles one at a time
    return;
  }

  const guess = activeTiles.reduce((word, tile) => word + tile.dataset.letter, "").toLowerCase();
  stopInteraction();
  flipTiles(activeTiles, guess);
}

function flipTiles(tiles, guess) {
  const targetLetterCounts = {};
  const cleanedTargetWord = targetWord.replace(/ /g, ""); // Remove spaces for comparison

  // Step 1: Count the frequency of each letter in the target word
  for (const letter of cleanedTargetWord) {
    const lowercaseLetter = letter.toLowerCase();
    if (!targetLetterCounts[lowercaseLetter]) {
      targetLetterCounts[lowercaseLetter] = 0;
    }
    targetLetterCounts[lowercaseLetter]++;
  }

  // Step 2: Process each tile with a delay for sequential flipping
  tiles.forEach((tile, index) => {
    const guessedLetter = tile.dataset.letter?.toLowerCase();
    const cleanIndex = [...targetWord].filter((char, i) => char !== " ").slice(0, index + 1).length - 1;
    const targetLetter = cleanedTargetWord[cleanIndex]?.toLowerCase();

    setTimeout(() => {
      // Add the flip class to start the animation
      tile.classList.add("flip");

      setTimeout(() => {
        // Determine the state of the tile after the flip
        if (guessedLetter === targetLetter) {
          tile.dataset.state = "correct";
          tile.style.backgroundColor = "hsl(155, 67%, 45%)"; // Green
          const key = keyboard.querySelector(`[data-key="${guessedLetter.toUpperCase()}"]`);
          if (key) key.classList.add("correct");
          targetLetterCounts[guessedLetter]--; // Decrement the count for this letter
        } else if (targetLetterCounts[guessedLetter] > 0) {
          tile.dataset.state = "wrong-location";
          tile.style.backgroundColor = "hsl(49, 51%, 47%)"; // Yellow
          const key = keyboard.querySelector(`[data-key="${guessedLetter.toUpperCase()}"]`);
          if (key) key.classList.add("wrong-location");
          targetLetterCounts[guessedLetter]--; // Decrement the count for this letter
        } else {
          tile.dataset.state = "wrong";
          tile.style.backgroundColor = "hsl(240, 2%, 23%)"; // Grey
          const key = keyboard.querySelector(`[data-key="${guessedLetter.toUpperCase()}"]`);
          if (key) key.classList.add("wrong");
        }

        // Remove the flip class after the animation ends
        tile.classList.remove("flip");

        // Step 4: Check for the end of the game after the last tile flips
        if (index === tiles.length - 1) {
          checkWinLose(guess, tiles);
        }
      }, FLIP_ANIMATION_DURATION / 2); // Animation midpoint
    }, index * FLIP_ANIMATION_DURATION); // Delay for each tile
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

  startInteraction(); // Allow next guess
}

function shakeTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("shake");
      setTimeout(() => {
        tile.classList.remove("shake");
      }, 500); // Duration of the shake animation for each tile
    }, index * 100); // Delay between each tile shake
  });
}

function showScoreOverlay() {
  const scoreModal = document.getElementById("scoreModal");
  if (scoreModal) {
    scoreModal.style.display = "block";
  }
}

function getScore() {
  const wordLength = targetWord.replace(/ /g, "").length; // Actual length of the target word
  const totalPlayableTiles = GUESSES_MAX * wordLength; // Total tiles in play
  const usedTiles = guessGrid.querySelectorAll("[data-letter]").length; // Tiles already used
  const remainingTiles = totalPlayableTiles - usedTiles; // Tiles not used
  const guessesMade = GUESSES_MAX - remainingTiles / wordLength; // Compute guesses made
  return guessesMade;
}

function submitScore() {
  const playerName = playerNameInput.value;
  const score = getScore();
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfD3lvoGvcDx16P-pQd_2HpZEHEesnsCC3aHNe_NNXnQxqNTQ/formResponse";

  // Create form data
  let formData = new FormData();
  formData.append("entry.1698848551", playerName);
  formData.append("entry.1512423051", score);

  // Make the HTTP POST request
  fetch(formURL, {
    method: 'POST',
    mode: 'no-cors', // required for a request to Google Forms
    body: formData
  })
    .then(response => {
      modal.style.display = "none"; // Close the modal
      setTimeout(() => {
        statsLink.onclick();
      }, 1000);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

statsLink.onclick = function () {
  statsOverlay.style.display = "block";

  fetch(GAS_URL)
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // Log the response for debugging

      // Parse the 'body' field to convert it from a string to an array
      const statsData = JSON.parse(data.body);

      console.log(statsData); // Log the parsed statsData array

      document.querySelector(".loading-message").style.display = "none";

      dailyStatsList.innerHTML = "";
      statsData.slice(0, 100).forEach((row) => {
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

function showAlert(message) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.className = "alert";
  alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 3000); // Remove the alert after 3 seconds
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      setTimeout(() => {
        tile.classList.remove("dance");
      }, DANCE_ANIMATION_DURATION);
    }, index * 100); // Add a delay between tiles
  });
}

document.getElementById("modal-close").onclick = function () {
  const scoreModal = document.getElementById("scoreModal");
  scoreModal.style.display = "none";
};

document.getElementById("submitScoreBtn").onclick = function () {
  submitScore(); // Call the score submission logic
  const scoreModal = document.getElementById("scoreModal");
  scoreModal.style.display = "none";
};
