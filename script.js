const climateDictionary = {
  "dewpoint": "It's a wet kind of cold.",
  "clean energy": "Power so fresh it could star in a detergent commercial.",
  "carbon tax": "Paying for your carbon sins.",
  "global warming": "A long-term increase in Earth's average temperature.",
  "heatwave": "When temperatures overstay their welcome.",
  "icebergs": "Floating ice mountains with hidden depths.",
  "supportive": "Essential for resilience and success.",
  "coral reefs": "The rainforests of the sea.",
  "blizzard": "Whiteout conditions that demand hot cocoa.",
  "drizzle": "Light rain, heavy on annoyance.",
  "dataset": "A structured collection of information.",
  "solar flare": "The sun’s way of throwing a tantrum.",
  "spatial map": "Mapping where things happen and why.",
  "baseline": "The starting line for comparison.",
  "freezing": "When water hits 0°C and gets solid.",
  "engagement": "Collaboration that sparks action.",
  "emissions": "What’s coming out of that exhaust pipe?",
  "sunlight": "Free energy, courtesy of the sun.",
  "extreme heat": "Not your average sunny day.",
  "just transition": "Equity in the shift to a low-carbon economy.",
  "energy grid": "The system that powers your home.",
  "knowledge": "The key to climate action.",
  "regional": "Think locally, adapt regionally.",
  "water crisis": "When demand outpaces supply.",
  "graphical": "Data, but make it visual.",
  "wildfire ash": "The residue of a forest's fury.",
  "wildfire": "A fast-spreading blaze fueled by nature.",
  "data viewer": "Your gateway to climate insights.",
  "historical": "Looking back to plan ahead.",
  "air quality": "How clean is the air you're breathing?",
  "snowstorm": "Heavy snow, strong winds—winter’s chaos.",
  "cyclone": "A storm system with a spin.",
  "arctic ice": "A shrinking polar lifeline.",
  "downpour": "Rain that refuses to hold back.",
  "adaptation": "Adjusting to survive and thrive.",
  "heat domes": "When the atmosphere traps heat like a lid.",
  "data portal": "All your data needs in one place.",
  "analogues": "Comparing past climates to today’s challenges.",
  "drought": "When the rain just doesn’t show up.",
  "risk map": "Identifying hazards before they strike.",
  "wind power": "Turning breezes into electricity.",
  "dashboard": "A control center for climate insights.",
  "snow melt": "What feeds rivers in the spring.",
  "fossil fuel": "Ancient energy with modern problems.",
  "climate data": "Numbers that drive decisions.",
  "methane gas": "A short-lived but potent greenhouse gas.",
  "sea level": "When the ocean starts knocking at the door.",
  "flood risk": "A measure of rising waters.",
  "client focus": "Putting people at the center.",
  "resources": "The tools needed for action.",
  "frostbite": "When the cold bites back.",
  "ocean heat": "Warming waters with global consequences.",
  "hailstorm": "Ice falling from the sky—because why not?",
  "tornado": "A rotating column of chaos.",
  "thunder": "Nature’s way of making noise.",
  "windy day": "When your umbrella doesn’t stand a chance.",
  "rainfall": "Water that falls from the sky—pretty straightforward.",
  "outreach": "Making climate science accessible to all.",
  "renewable": "Energy that doesn’t run out.",
  "raincloud": "Nature’s version of a mood indicator.",
  "chinook": "A warm wind that melts snow fast.",
  "projection": "A forecast for what’s to come."
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
const offsetFromDate = new Date(2023, 9, 24);
const msOffset = Date.now() - offsetFromDate;
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24);
const wordList = Object.keys(climateDictionary);
const targetWord = wordList[dayOffset % wordList.length];
const targetClue = climateDictionary[targetWord];

const playerNameInput = document.getElementById("playerNameInput");
const modal = document.getElementById("scoreModal");

startInteraction();
setupBoard(targetWord);

// Show the clue at the start of the game
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
  const cleanedTargetWord = targetWord.replace(/ /g, ""); // Remove spaces for comparison
  const targetLetterCounts = {};

  // Count the frequency of each letter in the target word
  for (const letter of cleanedTargetWord) {
    const lowercaseLetter = letter.toLowerCase();
    if (!targetLetterCounts[lowercaseLetter]) {
      targetLetterCounts[lowercaseLetter] = 0;
    }
    targetLetterCounts[lowercaseLetter]++;
  }

  tiles.forEach((tile, index) => {
    const guessedLetter = tile.dataset.letter?.toLowerCase();
    const targetLetter = cleanedTargetWord[index]?.toLowerCase();

    setTimeout(() => {
      tile.classList.add("flip");

      setTimeout(() => {
        if (guessedLetter === targetLetter) {
          tile.dataset.state = "correct";
          tile.style.backgroundColor = "hsl(155, 67%, 45%)";
        } else if (targetLetterCounts[guessedLetter] > 0) {
          tile.dataset.state = "wrong-location";
          tile.style.backgroundColor = "hsl(49, 51%, 47%)";
          targetLetterCounts[guessedLetter]--;
        } else {
          tile.dataset.state = "wrong";
          tile.style.backgroundColor = "hsl(240, 2%, 23%)";
        }

        tile.classList.remove("flip");

        if (index === tiles.length - 1) {
          checkWinLose(guess, tiles);
        }
      }, FLIP_ANIMATION_DURATION / 2);
    }, index * FLIP_ANIMATION_DURATION);
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
