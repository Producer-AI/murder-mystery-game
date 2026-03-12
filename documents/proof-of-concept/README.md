# murder-mystery-game

Murder mystery game for amanda's bday
# 🐍 The Snake Game — A Social Deduction Party Game

A mobile-first web app for a Lunar New Year–themed social deduction party game inspired by Netflix's *The Mole*. One player is secretly assigned as **the Snake** and must sabotage without being detected. Everyone else competes through quiz rounds to identify the Snake and earn points. The highest scorer at the end is crowned the **🐎 Fire Horse 🐎**.

Built for 12–16 players. Designed to be played in-person across multiple venues over the course of a single evening.

---

## How It Works

### The Setup
- A host (game master) configures the game: players, questions, correct answers, point weights, and the secret Snake identity.
- Players receive a link to the app before the event. They check in with their name and see a locked waiting screen until game night.

### Game Night
1. **Host unlocks the game** and starts Round 1.
2. **Host reads each question aloud** (questions are about the Snake's identity — what they're wearing, biographical details, behavioral observations, etc.).
3. **Players type answers on their phones** — the app shows only the question number and a blank input field.
4. **Host closes the round and triggers scoring** — the backend fuzzy-matches answers against the correct answers, applies point weights, and generates a leaderboard.
5. **The lowest scorer is eliminated** each round (just like *The Mole*'s quiz elimination).
6. **Repeat** across 3 rounds / venues.
7. **Finale** — the Snake is unmasked, the winner is revealed.

### The Snake
- The Snake is secretly assigned before the event and plays along with everyone else.
- The Snake takes the quiz like a normal player but **cannot be eliminated and cannot win**.
- The Snake's score appears on the public leaderboard — no one can tell from the scoreboard alone who they are.
- The Snake also carries a **trigger word**: every time they lure someone into saying it in conversation, the target loses points (tracked separately by the host).

### The Twist
At the end of the final round, every player submits one bonus answer: **"Who is the Snake?"** — a correct guess earns major bonus points, just like *The Mole*'s identity quiz.

---

## Screens

| Screen | Description |
|--------|-------------|
| **Landing** | Pre-event entry point. Themed branding, event date, "Enter" CTA. |
| **Check-in** | Player name registration. |
| **Waiting** | Locked state with event intel (dress code, location). Pulse animation. |
| **Quiz** | Per-round answer submission. Question number + blank field. Progress dots. |
| **Results** | Post-round leaderboard. Rank, round score, cumulative score, questions correct. |
| **Eliminated** | Full red screen shown to bitten players. They can still spectate. |
| **Finale** | Snake identity reveal + winner announcement with Fire Horse title. |
| **Player Card** | Individual dossier: stats, round breakdowns, snake suspicion level. |

---

## Tech Stack

- **React** (single-file component, designed for Claude Artifacts)
- **Tailwind CSS** utility classes for styling
- **`window.storage` API** for cross-session persistence (Artifacts built-in key-value store)
- No backend server — uses shared storage with a polling model for state sync

### Storage Schema

```
game:state          → { phase, current_round, total_rounds }     (shared: true)
game:players        → [{ name, is_eliminated, cumulative_score }] (shared: true)
game:leaderboard:N  → [{ name, round_score, cumulative }]        (shared: true)
game:config         → { snake_name, rounds: [{ questions }] }    (shared: false)
answer:round_N:name → [{ question_number, answer }]              (shared: true)
```

---

## Game Configuration

### Questions
Each question has:
- `question_text` — host reference only, not displayed to players
- `correct_answer` — the expected answer
- `alternate_answers` — acceptable variants (e.g., "red", "crimson", "dark red")
- `weight` — point value (harder questions = higher weight)

### Answer Matching
- Case-insensitive
- Whitespace trimmed
- Common filler words stripped ("a", "the")
- Checks against correct answer + all alternates
- Levenshtein distance tolerance for typos (1–2 edit distance)

---

## Running Locally

This was designed to run as a Claude Artifact (single React component with built-in storage). To run it in a standard React environment:

1. Clone the repo
2. Copy the component into your React project
3. Replace `window.storage` calls with your preferred persistence layer (Firebase, Supabase, localStorage, etc.)
4. Serve over HTTPS so players can access on their phones via local network or deployed URL

---

## Design System

The visual language is **Lunar New Year meets spy thriller**:

- **Palette**: Cream (`#FAF6F1`), crimson (`#8B2020`), gold (`#D4A574`), deep black (`#1A0A0A`)
- **Typography**: Monospaced (`Courier New`) for body, serif (`Georgia`) for display/numbers
- **Texture**: Subtle radial gradients, corner ornaments, thin ruled lines
- **Modes**: Cream background for pre-game screens, dark mode for game-night screens, red for eliminations

---

## Roadmap / Nice-to-Haves

- [ ] Admin panel for real-time game control
- [ ] Sound effects (snake hiss on elimination, horse gallop on winner reveal)
- [ ] Confetti / particle animation on finale
- [ ] Snake bite counter (manual host input for trigger word tracking)
- [ ] Per-question timer with countdown
- [ ] Push notifications when a new round starts
- [ ] Spectator mode polish for eliminated players
- [ ] "Who is the Snake?" bonus question with weighted 

---

*Trust no one. Watch your tongue. 🧧*
