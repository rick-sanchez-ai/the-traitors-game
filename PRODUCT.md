# The Traitors — Party Game App

## Concept
A hybrid in-person party game app inspired by "The Traitors" TV show. Players use their phones as personal devices while gathered together in the same room. The app acts as the host — managing roles, phases, voting, and dramatic reveals.

## Target
- 6-12 players, in-person at a gathering
- Phone browser (no app download — PWA/web app)
- One player creates a room, others join via code/QR

## Core Game Loop

### Setup Phase
1. One player creates a game room → gets a room code + QR
2. Other players join by entering code or scanning QR on their phones
3. Everyone enters their name (+ optional avatar/emoji)
4. Host player starts the game when all players have joined
5. App secretly assigns roles: Faithful or Traitor(s)
   - 6-8 players: 1 Traitor
   - 9-12 players: 2 Traitors
6. **Dramatic role reveal** on each player's phone (with animation + sound)

### Round Structure (repeats until game ends)

#### 🌙 Night Phase (~2 min)
- All players: "Close your eyes" screen with atmospheric music
- Traitors: See each other's names, chat privately, tap to select a victim
- Timer counts down — if Traitors don't pick, random victim
- **Murder reveal**: Dramatic animation showing who was eliminated
- Eliminated player sees "You have been murdered" on their phone

#### 🏆 Mission Phase (~5 min) [Optional per round]
- Mini-game that all surviving players participate in
- Winner earns a **Shield** (immunity from murder for one night)
- Adds to the prize pot (even if just for fun/bragging rights)
- Types: trivia, word games, speed tap, memory, drawing

#### 💬 Roundtable Phase (~5-10 min)
- Timer on everyone's screen
- Discussion happens IN PERSON (the app just tracks time)
- Optional: "accusation" button — formally accuse someone (shows on all screens)
- Atmospheric background music/tension sounds

#### 🗳️ Banishment Vote (~2 min)
- Everyone votes on their phone (secret ballot)
- Results revealed dramatically — one by one or all at once
- Banished player's role is revealed: FAITHFUL or TRAITOR
- If Faithful: sad reveal. If Traitor: celebration!

### End Conditions
- **Faithful win**: All Traitors are banished → remaining players split the pot
- **Traitors win**: Traitors equal or outnumber Faithful

## Visual & Audio Design

### Vibe
- Dark, mysterious, luxurious — like the show's Scottish castle aesthetic
- Deep purples, golds, dark greens, candlelight feels
- Elegant typography (serif for headers, clean sans for body)

### Animations
- Role reveal: dramatic card flip with particle effects
- Murder reveal: screen goes red, victim's name fades
- Banishment: voting results cascade in one by one
- Traitor caught: golden confetti explosion
- Night phase: flickering candle ambient animation

### Sound
- Night phase: eerie ambient music
- Roundtable: tension-building background
- Vote reveal: dramatic drum roll
- Murder: sinister chord
- Traitor caught: triumphant fanfare
- All sounds via Web Audio API (no external dependencies)

## Tech Stack
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + Framer Motion
- **Real-time**: WebSocket (Socket.IO or PartyKit)
- **State**: Server-side game state, client receives their view only
- **Hosting**: Can run locally or deploy to Vercel/Railway
- **No database needed**: All state in-memory per game session
- **PWA**: Add to home screen, full-screen mode

## Mini-Games (Missions)

1. **Trivia Blitz** — 5 rapid-fire questions, most correct wins
2. **Speed Tap** — Tap as fast as you can in 10 seconds
3. **Memory Match** — Flip cards to find pairs
4. **Word Scramble** — Unscramble a word fastest
5. **Drawing Guess** — One player draws, others guess (if time permits later)

## MVP Scope (Tonight's Build)
- [x] Room creation + join via code
- [x] Player lobby with names
- [x] Role assignment (Faithful/Traitor)
- [x] Dramatic role reveal animation
- [x] Night phase — Traitors select victim
- [x] Murder reveal
- [x] Roundtable timer
- [x] Banishment voting
- [x] Role reveal on banishment
- [x] Win condition detection
- [x] Beautiful dark/mysterious UI
- [x] Sound effects
- [x] Mobile-responsive (phone-first)

## Nice-to-Have (Post-MVP)
- Mini-game missions
- Shield mechanic
- Prize pot tracker
- Game history / replay
- Custom themes
- Spectator mode for eliminated players
- AI host voice narration
