"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { multiplayer } from "@/network/multiplayer";
import { GamePhase, PlayerColor, MoveRecord } from "@/types";

const PIECE_ICONS: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔",
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function getCaptured(moves: MoveRecord[]): { white: string[]; black: string[] } {
  const white: string[] = [];
  const black: string[] = [];
  for (const m of moves) {
    if (!m.captured) continue;
    const isWhite = m.captured === m.captured.toUpperCase();
    if (isWhite) white.push(m.captured.toUpperCase());
    else black.push(m.captured.toUpperCase());
  }
  return { white, black };
}

const ORDER = ["Q", "R", "B", "N", "P"];

function CapturedDisplay({ pieces }: { pieces: string[] }) {
  const sorted = [...pieces].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  return (
    <div className="captured-row">
      {sorted.map((p, i) => (
        <span key={i} className="captured-icon">{PIECE_ICONS[p] || "?"}</span>
      ))}
    </div>
  );
}

export function GameUI() {
  const {
    phase, turn, myColor, winner, moves, lastMoveSan,
    playerName, opponentName, isAIGame, isCheck,
    showDrawOffer, drawOfferedBy,
    setDrawOffer, gameStarted, reset, startTime,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [gameStarted]);

  const isGameOver = [
    GamePhase.CHECKMATE, GamePhase.STALEMATE, GamePhase.DRAW,
    GamePhase.RESIGNED, GamePhase.ABANDONED,
  ].includes(phase);

  const getResultText = () => {
    if (phase === GamePhase.CHECKMATE) return winner === myColor ? "Victory" : "Defeated";
    if (phase === GamePhase.STALEMATE) return "Stalemate";
    if (phase === GamePhase.DRAW) return "Draw";
    if (phase === GamePhase.RESIGNED) return winner === myColor ? "Opponent Resigned" : "You Resigned";
    if (phase === GamePhase.ABANDONED) return "Game Abandoned";
    return "";
  };

  const handleBackToMenu = () => {
    multiplayer.disconnect();
    reset();
  };

  const handleCopyRoomId = () => {
    const rid = multiplayer.getRoomId();
    if (rid) navigator.clipboard.writeText(rid);
  };

  const handleOfferDraw = () => { multiplayer.offerDraw(); };
  const handleResign = () => { multiplayer.resign(); };

  const captured = getCaptured(moves);
  const elapsed = startTime > 0 ? now - startTime : 0;
  const isPlaying = phase === GamePhase.PLAYING || phase === GamePhase.CHECK;

  if (!gameStarted) return null;

  return (
    <div className="game-ui-overlay">
      <div className="top-bar">
        <div className="top-right">
          {!isAIGame && multiplayer.getRoomId() && (
            <>
              <button onClick={handleCopyRoomId} className="ui-btn copy-btn">
                {multiplayer.getRoomId()?.slice(0, 6)}...
              </button>
              <button onClick={handleOfferDraw} className="ui-btn draw-btn">Draw</button>
              <button onClick={handleResign} className="ui-btn resign-btn">Resign</button>
            </>
          )}
        </div>
      </div>

      {showDrawOffer && (
        <div className="draw-dialog">
          <div className="draw-dialog-box">
            <p className="draw-text">{drawOfferedBy} offers a draw</p>
            <div className="draw-buttons">
              <button onClick={() => { multiplayer.respondToDraw(true); setDrawOffer(false); }} className="ui-btn draw-accept">Accept</button>
              <button onClick={() => { multiplayer.respondToDraw(false); setDrawOffer(false); }} className="ui-btn draw-decline">Decline</button>
            </div>
          </div>
        </div>
      )}

      <div className="left-panel">
        <div className={`lp-player ${turn === PlayerColor.WHITE && isPlaying ? "active" : ""}`}>
          <div className="lp-dot white" />
          <span className="lp-name">{playerName || "White"}</span>
          {turn === PlayerColor.WHITE && isPlaying && <span className="lp-arrow">◄</span>}
        </div>

        <div className="lp-vs">
          {isCheck && isPlaying ? <span className="lp-check">CHECK</span> : <span className="lp-vs-text">VS</span>}
        </div>

        <div className={`lp-player ${turn === PlayerColor.BLACK && isPlaying ? "active" : ""}`}>
          {turn === PlayerColor.BLACK && isPlaying && <span className="lp-arrow">►</span>}
          <span className="lp-name">{isAIGame ? "AI Bot" : opponentName || "Black"}</span>
          <div className="lp-dot black" />
        </div>

        <div className="lp-divider" />

        <div className="lp-section">
          <span className="lp-section-title">Captured</span>
          {captured.black.length > 0 && (
            <div className="lp-captured-group">
              <span className="lp-captured-label">W</span>
              <CapturedDisplay pieces={captured.black} />
            </div>
          )}
          {captured.white.length > 0 && (
            <div className="lp-captured-group">
              <span className="lp-captured-label">B</span>
              <CapturedDisplay pieces={captured.white} />
            </div>
          )}
          {captured.white.length === 0 && captured.black.length === 0 && (
            <span className="lp-empty">—</span>
          )}
        </div>

        <div className="lp-divider" />

        <div className="lp-section">
          <span className="lp-section-title">Time</span>
          <span className="lp-timer">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="bottom-info">
          {lastMoveSan && <span className="move-san">{lastMoveSan}</span>}
          {lastMoveSan && <div className="info-sep" />}
          <span className="move-count">Move {Math.ceil(moves.length / 2)}</span>
          <div className="info-sep" />
          <span className="game-timer">{formatTime(elapsed)}</span>
          {isAIGame && isCheck && isPlaying && (
            <>
              <div className="info-sep" />
              <span className="check-badge">CHECK</span>
            </>
          )}
        </div>
      </div>

      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2 className={`result-title ${winner === myColor ? "victory" : "defeat"}`}>
              {getResultText()}
            </h2>
            <p className="result-subtitle">
              {phase === GamePhase.CHECKMATE
                ? (winner === myColor ? "The kingdom prevails" : "Darkness consumes all")
                : "The ritual ends"}
            </p>
            <p className="result-time">{formatTime(elapsed)}</p>
            {!isAIGame && phase !== GamePhase.ABANDONED && (
              <button onClick={() => multiplayer.requestRematch()} className="ui-btn rematch-btn">Request Rematch</button>
            )}
            <button onClick={handleBackToMenu} className="ui-btn menu-btn">Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
