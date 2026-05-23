# AGENTS.md - Dark Chess Game

## Commands

### Run locally
```bash
# Terminal 1 - server (Colyseus) — at repo root
npm run dev

# Terminal 2 - client (Next.js)
cd web && npm run dev
```

### Build
```bash
# Server — at repo root
npm run build

# Client (Next.js)
cd web && npm run build
```

## Architecture

- **web/** - Next.js 14 App Router + TypeScript + Tailwind CSS
- **src/** (root) - Node.js/Express + Colyseus (WebSocket multiplayer)

## Key Files

- `src/index.ts` - Server entry point (port 2567)
- `src/rooms/ChessRoom.ts` - Game room logic with chess.js validation
- `web/src/app/page.tsx` - Home page (Lobby + Game)
- `web/src/app/game/[roomId]/page.tsx` - Game room page
- `web/src/components/GameCanvas.tsx` - Game orchestrator (AI + multiplayer)
- `web/src/components/Board.tsx` - 2D chessboard
- `web/src/ai/stockfishWorker.ts` - Stockfish WASM + fallback AI
- `web/src/store/gameStore.ts` - Zustand state

## AI Difficulty Levels

- **Easy**: Stockfish Skill 1 / UCI_Elo 800 → fallback: random moves
- **Medium**: Stockfish Skill 8 / UCI_Elo 1600 → fallback: greedy captures
- **Hard**: Stockfish Skill 20 (full) → fallback: minimax depth 3

## Environment

- Client expects `NEXT_PUBLIC_COLYSEUS_ENDPOINT` (defaults to ws://localhost:2567)
- Server listens on `PORT` (defaults to 2567)
