(() => {
  "use strict";

  const WORD_BANK = [
    { word: "BUTTERFLY", category: "Animals", group: "animals" },
    { word: "CHAMELEON", category: "Animals", group: "animals" },
    { word: "DOLPHIN", category: "Animals", group: "animals" },
    { word: "ELEPHANT", category: "Animals", group: "animals" },
    { word: "HEDGEHOG", category: "Animals", group: "animals" },
    { word: "PENGUIN", category: "Animals", group: "animals" },
    { word: "LIGHTNING", category: "Nature", group: "nature" },
    { word: "MOUNTAIN", category: "Nature", group: "nature" },
    { word: "SEASHELL", category: "Nature", group: "nature" },
    { word: "SUNFLOWER", category: "Nature", group: "nature" },
    { word: "WATERFALL", category: "Nature", group: "nature" },
    { word: "ALGORITHM", category: "Technology", group: "technology" },
    { word: "BROWSER", category: "Technology", group: "technology" },
    { word: "DATABASE", category: "Technology", group: "technology" },
    { word: "KEYBOARD", category: "Technology", group: "technology" },
    { word: "SOFTWARE", category: "Technology", group: "technology" },
    { word: "AVOCADO", category: "Food", group: "food" },
    { word: "BLUEBERRY", category: "Food", group: "food" },
    { word: "CHOCOLATE", category: "Food", group: "food" },
    { word: "PINEAPPLE", category: "Food", group: "food" },
    { word: "SPAGHETTI", category: "Food", group: "food" },
    { word: "AIRPLANE", category: "Travel", group: "travel" },
    { word: "BACKPACK", category: "Travel", group: "travel" },
    { word: "LIGHTHOUSE", category: "Travel", group: "travel" },
    { word: "PASSPORT", category: "Travel", group: "travel" },
    { word: "SUITCASE", category: "Travel", group: "travel" }
  ];
  const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const STATS_KEY = "typora.hangman.stats";
  const MAX_MISTAKES = 6;

  class HangmanGame {
    constructor(word, maxMistakes = MAX_MISTAKES) {
      if (typeof word !== "string" || !/^[A-Z]+$/i.test(word)) {
        throw new TypeError("A Hangman word must contain only letters.");
      }
      if (!Number.isInteger(maxMistakes) || maxMistakes < 1) {
        throw new RangeError("The maximum number of mistakes must be a positive integer.");
      }

      this.word = word.toUpperCase();
      this.maxMistakes = maxMistakes;
      this.guessedLetters = new Set();
      this.status = "playing";
    }

    get mistakes() {
      return [...this.guessedLetters].filter((letter) => !this.word.includes(letter)).length;
    }

    get remainingGuesses() {
      return this.maxMistakes - this.mistakes;
    }

    guess(letter) {
      if (this.status !== "playing" || typeof letter !== "string" || !/^[A-Z]$/i.test(letter)) {
        return null;
      }

      const normalizedLetter = letter.toUpperCase();
      if (this.guessedLetters.has(normalizedLetter)) return null;
      this.guessedLetters.add(normalizedLetter);

      const correct = this.word.includes(normalizedLetter);
      if ([...this.word].every((character) => this.guessedLetters.has(character))) {
        this.status = "won";
      } else if (this.mistakes >= this.maxMistakes) {
        this.status = "lost";
      }

      return { correct, status: this.status };
    }

    hasGuessed(letter) {
      return this.guessedLetters.has(letter.toUpperCase());
    }
  }

  class HangmanStats {
    constructor() {
      this.data = { played: 0, wins: 0, streak: 0, bestStreak: 0 };
      this.notice = "";
      this.load();
    }

    load() {
      try {
        const saved = window.localStorage.getItem(STATS_KEY);
        if (!saved) return;

        const stats = JSON.parse(saved);
        const isValid = stats
          && ["played", "wins", "streak", "bestStreak"].every(
            (key) => Number.isInteger(stats[key]) && stats[key] >= 0
          )
          && stats.wins <= stats.played
          && stats.streak <= stats.wins
          && stats.bestStreak >= stats.streak;
        if (!isValid) {
          this.notice = "Saved stats were invalid, so a fresh scorecard is being used.";
          return;
        }
        this.data = stats;
      } catch {
        this.notice = "Stats could not be loaded from this browser.";
      }
    }

    recordRound(won) {
      this.data.played += 1;
      if (won) {
        this.data.wins += 1;
        this.data.streak += 1;
        this.data.bestStreak = Math.max(this.data.bestStreak, this.data.streak);
      } else {
        this.data.streak = 0;
      }

      try {
        window.localStorage.setItem(STATS_KEY, JSON.stringify(this.data));
      } catch {
        this.notice = "Stats are updated for this visit but could not be saved on this device.";
      }
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { HangmanGame, WORD_BANK };
  }

  if (typeof document === "undefined") return;

  class HangmanUI {
    constructor() {
      this.elements = {
        category: document.querySelector("#category-select"),
        categoryName: document.querySelector("#category-name"),
        mistakes: document.querySelector("#mistakes-count"),
        drawingParts: [...document.querySelectorAll(".hangman-part")],
        word: document.querySelector("#word-display"),
        message: document.querySelector("#round-message"),
        keyboard: document.querySelector("#letter-keyboard"),
        newGame: document.querySelector("#new-game-button"),
        roundsPlayed: document.querySelector("#rounds-played"),
        winRate: document.querySelector("#win-rate"),
        bestStreak: document.querySelector("#best-streak"),
        statsNote: document.querySelector("#stats-note")
      };
      this.stats = new HangmanStats();
      this.game = null;
      this.currentEntry = null;
      this.roundRecorded = false;

      this.buildKeyboard();
      this.elements.keyboard.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-letter]");
        if (button) this.makeGuess(button.dataset.letter);
      });
      this.elements.category.addEventListener("change", () => this.newGame());
      this.elements.newGame.addEventListener("click", () => this.newGame());
      document.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target.closest?.("input, select, textarea, [contenteditable='true']")) return;
        if (/^[a-z]$/i.test(event.key)) this.makeGuess(event.key);
      });

      this.renderStats();
      this.newGame();
    }

    buildKeyboard() {
      for (const letters of KEYBOARD_ROWS) {
        const row = document.createElement("div");
        row.className = "keyboard-row";
        for (const letter of letters) {
          const button = document.createElement("button");
          button.className = "letter-key";
          button.type = "button";
          button.dataset.letter = letter;
          button.textContent = letter;
          button.setAttribute("aria-label", `Guess ${letter}`);
          row.append(button);
        }
        this.elements.keyboard.append(row);
      }
    }

    newGame() {
      const group = this.elements.category.value;
      const candidates = WORD_BANK.filter((entry) => group === "all" || entry.group === group);
      const available = candidates.length > 1
        ? candidates.filter((entry) => entry.word !== this.currentEntry?.word)
        : candidates;
      this.currentEntry = available[Math.floor(Math.random() * available.length)];
      this.game = new HangmanGame(this.currentEntry.word);
      this.roundRecorded = false;
      this.elements.message.textContent = "Pick a letter to get started.";
      this.elements.message.className = "round-message";
      this.render();
    }

    makeGuess(letter) {
      const result = this.game.guess(letter);
      if (!result) return;

      if (result.status !== "playing" && !this.roundRecorded) {
        this.roundRecorded = true;
        this.stats.recordRound(result.status === "won");
        this.renderStats();
      }
      this.render(result);
    }

    render(result) {
      this.elements.categoryName.textContent = this.currentEntry.category;
      this.elements.mistakes.textContent = `${this.game.mistakes} / ${this.game.maxMistakes}`;
      this.elements.drawingParts.forEach((part, index) => {
        part.classList.toggle("is-visible", index < this.game.mistakes);
      });

      this.elements.word.replaceChildren();
      for (const letter of this.game.word) {
        const tile = document.createElement("span");
        const isRevealed = this.game.hasGuessed(letter) || this.game.status === "lost";
        tile.className = `word-letter${isRevealed ? " is-revealed" : ""}`;
        if (isRevealed) tile.textContent = letter;
        tile.setAttribute("aria-hidden", "true");
        this.elements.word.append(tile);
      }
      this.elements.word.setAttribute("aria-label", this.game.status === "lost"
        ? `The word was ${this.game.word}`
        : `Word with ${this.game.word.length} hidden letters`);

      this.elements.keyboard.querySelectorAll("button[data-letter]").forEach((button) => {
        const letter = button.dataset.letter;
        const guessed = this.game.hasGuessed(letter);
        button.disabled = guessed || this.game.status !== "playing";
        button.classList.toggle("is-correct", guessed && this.game.word.includes(letter));
        button.classList.toggle("is-incorrect", guessed && !this.game.word.includes(letter));
        button.setAttribute("aria-pressed", String(guessed));
      });

      if (this.game.status === "won") {
        this.elements.message.textContent = "You got it! Ready for another?";
        this.elements.message.className = "round-message is-win";
      } else if (this.game.status === "lost") {
        this.elements.message.textContent = `The word was ${this.game.word}. Try another?`;
        this.elements.message.className = "round-message is-loss";
      } else if (result) {
        if (result.correct) {
          const lastGuess = [...this.game.guessedLetters].at(-1);
          this.elements.message.textContent = `Nice! "${lastGuess}" is in the word.`;
        } else {
          const lastGuess = [...this.game.guessedLetters].at(-1);
          this.elements.message.textContent = `No "${lastGuess}" this time. ${this.game.remainingGuesses} ${this.game.remainingGuesses === 1 ? "guess" : "guesses"} left.`;
        }
        this.elements.message.className = "round-message";
      }
    }

    renderStats() {
      const { played, wins, bestStreak } = this.stats.data;
      this.elements.roundsPlayed.textContent = String(played);
      this.elements.winRate.textContent = played ? `${Math.round((wins / played) * 100)}%` : "—";
      this.elements.bestStreak.textContent = String(bestStreak);
      this.elements.statsNote.textContent = this.stats.notice || "Stats are saved on this device.";
    }
  }

  new HangmanUI();
})();
