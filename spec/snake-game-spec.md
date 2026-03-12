# 🐍 The Snake Game — App Spec & Build Prompt

## What This Is

A mobile-first web app for a social deduction party game (12–16 players). One player is secretly “the Snake.” At different points in the night, the host (Amanda) reads quiz questions aloud about the Snake’s identity, and players submit answers on their phones. After each quiz round, scores are tallied, a leaderboard is shown, and the lowest scorer is eliminated. The last player standing with the highest cumulative score wins.

-----

## User Roles

### Host (Amanda)

- Pre-game: Configures players, designates the Snake, sets up questions/answers/weights
- During game: Controls game flow — unlocks the game, advances rounds, triggers scoring, eliminates players
- Has a separate admin view (password-protected or hidden route)

### Player (Guests)

- Pre-game: Opens the app, sees a “locked” landing screen with event instructions and atmosphere
- During game: Submits answers to quiz questions, views their score and the leaderboard after each round

-----

## Game Flow

### Phase 1: Pre-Game (Days Before)

- Players receive a link to the app
- They see a themed landing page with:
  - Event name / branding (Year of the Fire Horse 🐍🐎🧧)
  - Brief instructions explaining the game concept
  - A “locked” state — something like a countdown or a sealed envelope animation
  - A field to enter their name (this registers them as a player)
- Once they enter their name, they’re “checked in” and see a waiting screen
- The game cannot be started until the host unlocks it

### Phase 2: Game Night — Round Start

- Host presses “Start Round [X]” from admin panel
- Players’ screens update — they see the round number and a simple answer input field
- The host reads each question aloud to the group
- On the player’s phone, they see: “Question 1” (no question text — host reads it) and a text input + submit button
- After submitting, the answer is locked and they move to the next question field
- Players can see how many questions are in the round and their progress (e.g., “3 of 7”)

### Phase 3: Scoring

- Host presses “Score Round” from admin panel
- Backend compares each player’s answers to the correct answers
- Scoring logic:
  - Each question has a correct answer and a point weight (some questions worth more)
  - Answers should be fuzzy-matched (not exact string match — handle typos, capitalization, abbreviations)
  - Each player gets a round score and a cumulative score
- Results screen shows:
  - Leaderboard ranked by cumulative score
  - Each player’s round score breakdown (which questions they got right/wrong)
  - The eliminated player highlighted (lowest round score; tiebreaker = lowest cumulative score)

### Phase 4: Elimination

- Host presses “Eliminate” — the lowest scorer is marked as eliminated
- Eliminated players can still see the leaderboard but can no longer submit answers
- Remaining players see updated active player count
- Host advances to next round or ends the game

### Phase 5: Finale

- After the final round, the app reveals:
  - Final leaderboard with cumulative scores
  - The winner (🐎 Fire Horse 🐎)
  - The Snake’s identity reveal (dramatic animation — unmask moment)

-----

## Admin Panel (Host View)

Accessed via a hidden route or password. The admin panel should allow:

### Setup (Before Event)

- **Player list**: See all registered players, ability to remove duplicates or test entries
- **Snake assignment**: Designate which player is the Snake (Snake still plays the quiz but their score doesn’t count for elimination — they can never be eliminated and they can never win, just like The Mole)
- **Questions per round**: For each round, enter:
  - Question text (for host reference only — not shown to players)
  - Correct answer
  - Point weight (e.g., 1, 2, 3 — harder questions worth more)
  - Acceptable alternate answers (optional — e.g., “red” and “crimson” both count)
- **Game unlock time**: Optional — auto-unlock at a set time, or manual unlock button

### During Event

- **Start Round**: Opens the current round for player submissions
- **Close Round**: Stops accepting submissions (in case stragglers are slow)
- **Score Round**: Triggers scoring and displays results
- **Eliminate Player**: Marks the lowest scorer as eliminated
- **Override**: Ability to manually adjust scores or un-eliminate someone if needed
- **Live view**: See who has submitted and who hasn’t in real-time

-----

## Data Model

### Player

- name (string)
- is_snake (boolean)
- is_eliminated (boolean)
- is_checked_in (boolean)
- scores_by_round (array of round scores)
- cumulative_score (number)

### Question

- round_number (number)
- question_number (number)
- question_text (string — host reference only)
- correct_answer (string)
- alternate_answers (array of strings)
- weight (number — point value)

### Answer

- player_name (string)
- round_number (number)
- question_number (number)
- submitted_answer (string)
- is_correct (boolean)
- points_earned (number)

### Game State

- current_phase: “locked” | “waiting” | “round_active” | “round_closed” | “scoring” | “results” | “finale”
- current_round (number)
- total_rounds (number)

-----

## UI / Design Notes

### Vibe

- Dark, moody, atmospheric — think black + deep red + gold accents
- Lunar New Year meets spy thriller
- Snake and horse imagery/emojis used throughout
- Typography should feel dramatic, not cutesy

### Landing Page (Locked State)

- Full-screen dark background
- Event title with a subtle animation (maybe a snake slithering or fire flickering)
- “Enter your name to check in” input
- After check-in: “The game hasn’t started yet. Stay alert.” with a subtle pulse or breathing animation
- Consider: a countdown timer if the host sets an unlock time

### Quiz Screen (Active Round)

- Clean, minimal — just the question number, input field, and submit button
- Progress indicator (“Question 3 of 7”)
- After submitting: answer locks, field goes dim, next question appears
- After all questions submitted: “Answers locked. Waiting for results…” screen

### Results / Leaderboard Screen

- Ranked list with player names, round scores, cumulative scores
- Top scorer highlighted in gold
- Eliminated player highlighted in red with a “bitten” / snake animation
- Snake’s score should be visible but marked differently (they’re playing along but can’t win)
  - Actually: DON’T mark the Snake differently on the public leaderboard — no one should know who the Snake is until the finale. The Snake’s score appears normal. Only on the admin panel is the Snake flagged.

### Finale Screen

- Big reveal moment
- Winner announced with Fire Horse animation 🐎
- Snake identity revealed with dramatic unmask
- Final scoreboard

-----

## Technical Constraints (Claude Artifacts)

Since this is being built in Claude Artifacts (React):

- **Single-file React component** — everything in one .jsx file
- **Use React state** (useState, useReducer) — NO localStorage or sessionStorage
- **Use `window.storage` API** for persistence across sessions (this is Artifacts’ built-in key-value store):
  - `await window.storage.set(key, value, shared?)` — store data
  - `await window.storage.get(key, shared?)` — retrieve data
  - `await window.storage.list(prefix?, shared?)` — list keys
  - `await window.storage.delete(key, shared?)` — remove data
  - Use `shared: true` for data all players need to see (game state, leaderboard)
  - Use `shared: false` for admin-only data (correct answers, Snake identity)
- **Tailwind CSS** for styling (core utility classes only)
- **No external API calls** — all logic is client-side with storage
- **Available libraries**: lucide-react for icons, recharts for any charts

### Architecture Approach

Since there’s no real backend, the app uses a **shared storage polling model**:

- Admin writes game state, questions, and scores to shared storage
- Player clients poll shared storage on an interval (every 2–3 seconds) to detect state changes
- Player submissions are written to shared storage with their name as part of the key
- Admin reads all submissions from storage to calculate scores

### Key Storage Schema

```
game:state → { phase, current_round, total_rounds, unlock_time }  (shared: true)
game:players → [{ name, is_eliminated, cumulative_score }]  (shared: true)
game:leaderboard:round_1 → [{ name, round_score, cumulative, questions_correct }]  (shared: true)
game:config → { snake_name, rounds: [{ questions: [...] }] }  (shared: false — admin only)
answer:round_1:player_name → [{ question_number, answer }]  (shared: true)
admin:auth → password hash or simple passphrase  (shared: false)
```

-----

## Answer Matching Logic

Since players are typing free-text answers on their phones, matching needs to be forgiving:

- Case-insensitive comparison
- Trim whitespace
- Strip common filler words (“a”, “the”, “um”)
- Check against both the correct answer and alternate answers
- Consider: Levenshtein distance for typo tolerance (e.g., “grene” → “green” within 1-2 edits = correct)
- For multiple-choice-style questions, could switch to tap-to-select buttons instead of free text (host decides per question in setup)

-----

## Nice-to-Haves (If Feasible)

- **Sound effects**: Subtle hiss sound on elimination, horse gallop sound on winner reveal
- **Confetti / particle animation** on the finale screen
- **Snake bite counter**: If you’re tracking the trigger word game separately, a running tally of how many people the Snake has bitten (manually entered by host)
- **“Who is the Snake?” bonus question**: At the end of the final round, everyone gets one bonus question: “Who do you think the Snake is?” — correct guess = big bonus points (just like The Mole’s quiz)
- **Spectator mode**: Eliminated players can still see the leaderboard and watch the drama unfold
- **Timer per question**: Optional countdown clock that the host can trigger (adds pressure)
- **Dark/moody transition animations** between phases

-----

## Sample Questions (For Reference)

These are the types of questions Amanda would read aloud — all about observing and identifying the Snake:

- “What color is the Snake wearing tonight?”
- “The Snake’s birthday is in which month?”
- “True or false: the Snake has traveled to Asia.”
- “The Snake arrived at tonight’s event: alone, with one friend, or with a group?”
- “Which drink did the Snake order first tonight?”
- “The Snake’s phone case is what color?”
- “How many letters are in the Snake’s first name?”

Questions get harder and more specific as rounds progress, with higher point weights.

-----

## Summary

**Must-haves:**

1. Player check-in with name registration
1. Locked landing page that unlocks when host starts the game
1. Per-round quiz submission (blank fields, host reads questions aloud)
1. Automated scoring with weighted questions and fuzzy matching
1. Leaderboard display after each round
1. Elimination of lowest scorer each round
1. Admin panel for full game control
1. Finale reveal with winner + Snake identity
1. Snake plays along but is immune from elimination and cannot win

**Architecture:**

- Single React component in Claude Artifacts
- Persistent storage via `window.storage` API
- Polling model for real-time-ish state sync
- Mobile-first responsive design
- Dark, atmospheric, Lunar New Year × spy thriller aesthetic