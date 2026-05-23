# AGENTS.md - Dark Chess Game

## Commands

### Run locally
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start production
```bash
npm start
```

## Architecture

- **web/** - Next.js 14 App Router + TypeScript + Tailwind CSS
- **src/** (root) - Node.js/Express + Colyseus + Next.js integration

The server programmatically integrates Next.js via `next({ dir: "./web" })`.
Next.js handles HTTP routes, Colyseus handles WebSocket multiplayer.

## Deploy (Render)

Single Web Service:

| Field | Value |
|---|---|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

No separate Vercel deployment needed.

## Key Files

- `src/index.ts` - Server entry (Colyseus + Next.js integration)
- `src/rooms/ChessRoom.ts` - Game room logic
- `web/src/app/page.tsx` - Home page (Lobby + Game)
- `web/src/components/GameCanvas.tsx` - Game orchestrator
- `web/src/components/Board.tsx` - Chessboard
- `web/src/network/multiplayer.ts` - Colyseus client

## AI Difficulty Levels

- **Mortal**: Stockfish Skill 1 / random fallback
- **Forsaken**: Stockfish Skill 8 / greedy captures fallback
- **Nightmare**: Stockfish Skill 20 / minimax depth 3 fallback

## Environment

- Server listens on `PORT` (default 2567)
- Client connects to the same origin (no separate env var needed)
