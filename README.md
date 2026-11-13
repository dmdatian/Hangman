# Hangman

A responsive Hangman game built with vanilla HTML, CSS, and JavaScript. The game rules and round state are encapsulated in the `HangmanGame` class, browser-only stats use `HangmanStats`, and `HangmanUI` manages rendering and input. Pick from five word categories, guess with the on-screen or physical keyboard, and track your win rate and best streak.

## Run locally

From this folder, run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to Vercel

1. Push this folder to a Git repository.
2. In Vercel, import the repository and set the project root to this `Hangman` folder.
3. Use the **Other** framework preset. No build command, install command, or environment variables are needed; serve the project root as the output directory.
4. Deploy. The game is available at the root of the deployed site.

This is a static game. It does not need a Render backend or Firebase: the word bank ships with the page, and game stats are stored in the player's browser.
