const climateDictionary = {
  dewpoint: "Saturation threshold",
  clean_energy: "Byproduct-free",
  carbon_tax: "Market incentive",
  global_warming: "Radiative imbalance",
  heatwave: "Temperature anomaly",
  icebergs: "Drifting ice",
  supportive: "Resilience-building",
  coral_reefs: "Marine bleaching",
  blizzard: "Visibility collapse",
  drizzle: "Light hydrometeor",
  dataset: "Empirical backbone",
  solar_flare: "Magnetic ejection",
  spatial_map: "Geographic variability",
  baseline: "Reference period",
  freezing: "Phase transition",
  engagement: "Stakeholder alignment",
  emissions: "Quantified outputs",
  sunlight: "Energy source",
  extreme_heat: "Wet-bulb",
  just_transition: "Equitable shift",
  energy_grid: "Infrastructure balance",
  knowledge: "Adaptation asset",
  regional: "Localized scope",
  water_crisis: "Scarcity challenge",
  graphical: "Visual aid",
  wildfire_ash: "Particulate residue",
  wildfire: "Ignition-driven",
  data_viewer: "Exploration tool",
  historical: "Precedent baseline",
  air_quality: "Aerosol metric",
  snowstorm: "Frozen turbulence",
  cyclone: "Rotational system",
  arctic_ice: "Polar reservoir",
  downpour: "Convective rainfall",
  adaptation: "Systemic adjustment",
  heat_domes: "Pressure trap",
  data_portal: "Access point",
  analogues: "Comparative periods",
  drought: "Moisture deficit",
  risk_map: "Vulnerability visualization",
  wind_power: "Kinetic energy",
  dashboard: "Consolidated interface",
  snow_melt: "Seasonal runoff",
  fossil_fuel: "Carbon source",
  climate_data: "Empirical evidence",
  methane_gas: "Short-lived",
  sea_level: "Thermal expansion",
  flood_risk: "Inundation potential",
  client_focus: "Service tailoring",
  resources: "Mobilized assets",
  frostbite: "Tissue freezing",
  ocean_heat: "Energy storage",
  hailstorm: "Ice spheroids",
  tornado: "Rotating column",
  thunder: "Acoustic channel",
  windy_day: "Kinetic transfer",
  rainfall: "Hydrological input",
  outreach: "Science translation",
  renewable: "Cyclic source",
  raincloud: "Condensation",
  chinook: "Warming wind",
  projection: "Future trend"
};

const WORD_LENGTH_MAX = 12;
const GUESSES_MAX = 6;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;

let gameEnded = false;

// DOM Elements
const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const statsLink = document.querySelector("#seeStats");
const statsOverlay = document.querySelector("#statsOverlay");
const closeStats = statsOverlay.querySelector(".close");
const dailyStatsList = document.querySelector("#dailyStats");

// Select target word and clue
const wordList = Object.keys(climateDictionary);
const clues = Object.values(climateDictionary);
const offsetFromDate = new Date(2023, 9, 24);
const msOffset = Date.now() - offsetFromDate;
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24);
const targetWord = wordList[dayOffset % wordList.length]; // Rotate daily
const targetClue = climateDictionary[targetWord];

const playerNameInput = document.getElementById("playerNameInput");
const modal = document.getElementById("scoreModal");

startInteraction();
setupBoard(targetWord);

// Show clue at the start of the game
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

  for (const letter of cleanedTargetWord) {
    const lowercaseLetter = letter.toLowerCase();
    if (!targetLetterCounts[lowercaseLetter]) {
      targetLetterCounts[lowercaseLetter] = 0;
    }
    targetLetterCounts[lowercaseLetter]++;
  }

  tiles.forEach((tile, index) => {
    const guessedLetter = tile.dataset.letter?.toLowerCase();
    const cleanIndex = [...targetWord].filter((char, i) => char !== " ").slice(0, index + 1).length - 1;
    const targetLetter = cleanedTargetWord[cleanIndex]?.toLowerCase();

    setTimeout(() => {
      tile.classList.add("flip");

      setTimeout(() => {
        if (guessedLetter === targetLetter) {
          tile.dataset.state = "correct";
          tile.style.backgroundColor = "hsl(155, 67%, 45%)"; // Green
          const key = keyboard.querySelector(`[data-key="${guessedLetter.toUpperCase()}"]`);
          if (key) key.classList.add("correct");
          targetLetterCounts[guessedLetter]--;
        } else if (targetLetterCounts[guessedLetter] > 0) {
          tile.dataset.state = "wrong-location";
          tile.style.backgroundColor = "hsl(49, 51%, 47%)"; // Yellow
          const key = keyboard.querySelector(`[data-key="${guessedLetter.toUpperCase()}"]`);
          if (key) key.classList.add("wrong-location");
          targetLetterCounts[guessedLetter]--;
        } else {
          tile.dataset.state = "wrong";
          tile.style.backgroundColor = "hsl(240, 2%, 23%)"; // Grey
          const key = keyboard.querySelector(`[data-key="${guessedLetter.toUpperCase()}"]`);
          if (key) key.classList.add("wrong");
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

function showPersistentAlert(message) {
  alertContainer.innerHTML = ""; // Clear previous alerts
  const alert = document.createElement("div");
  alert.className = "alert persistent";
  alert.textContent = message;

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.onclick = () => alert.remove();
  alert.appendChild(closeButton);

  alertContainer.appendChild(alert);
}

function showAlert(message) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.className = "alert";
  alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 3000);
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      setTimeout(() => {
        tile.classList.remove("dance");
      }, DANCE_ANIMATION_DURATION);
    }, index * 100);
  });
}

document.getElementById("modal-close").onclick = function () {
  const scoreModal = document.getElementById("scoreModal");
  scoreModal.style.display = "none";
};
