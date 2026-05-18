# AGENTS.md - Dark Chess Game

## Commands

### Run locally
```bash
# Terminal 1 - server (Colyseus)
cd server && npm run dev

# Terminal 2 - client (Next.js)
cd client && npm run dev
```

### Build
```bash
# Server
cd server && npm run build

# Client
cd client && npm run build
```

## Architecture

- **client/** - Next.js 14 App Router + TypeScript + Tailwind CSS
- **server/** - Node.js/Express + Colyseus (WebSocket multiplayer)

## Key Files

- `server/src/index.ts` - Server entry point (port 2567)
- `server/src/rooms/ChessRoom.ts` - Game room logic with chess.js validation
- `client/src/app/page.tsx` - Home page (Lobby + Game)
- `client/src/app/game/[roomId]/page.tsx` - Game room page
- `client/src/components/GameCanvas.tsx` - Game orchestrator (AI + multiplayer)
- `client/src/components/Board.tsx` - 2D chessboard
- `client/src/ai/stockfishWorker.ts` - Stockfish WASM + fallback AI
- `client/src/store/gameStore.ts` - Zustand state

## AI Difficulty Levels

- **Easy**: Stockfish Skill 1 / UCI_Elo 800 → fallback: random moves
- **Medium**: Stockfish Skill 8 / UCI_Elo 1600 → fallback: greedy captures
- **Hard**: Stockfish Skill 20 (full) → fallback: minimax depth 3

## Environment

- Client expects `NEXT_PUBLIC_COLYSEUS_ENDPOINT` (defaults to ws://localhost:2567)
- Server listens on `PORT` (defaults to 2567)
