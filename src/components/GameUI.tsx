"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { multiplayer } from "@/network/multiplayer";
import { GamePhase, PlayerColor, MoveRecord } from "@/types";

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

interface CapturedInfo {
  type: string;
  color: "w" | "b";
}

function getCapturedByMe(moves: MoveRecord[], myColor: PlayerColor): { mine: CapturedInfo[]; theirs: CapturedInfo[] } {
  const mine: CapturedInfo[] = [];
  const theirs: CapturedInfo[] = [];
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (!m.captured) continue;
    const moveByWhite = i % 2 === 0;
    const capturedColor = moveByWhite ? "b" : "w";
    const capturedByMe = myColor === PlayerColor.WHITE ? moveByWhite : !moveByWhite;
    const info: CapturedInfo = { type: m.captured.toUpperCase(), color: capturedColor };
    if (capturedByMe) mine.push(info);
    else theirs.push(info);
  }
  return { mine, theirs };
}

const ORDER = ["Q", "R", "B", "N", "P"];

function CapturedDisplay({ pieces }: { pieces: CapturedInfo[] }) {
  const sorted = [...pieces].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  return (
    <div className="captured-row">
      {sorted.map((p, i) => (
        <img
          key={i}
          src={`/assets/pieces/${p.color}${p.type}.png`}
          alt=""
          className="captured-icon"
        />
      ))}
    </div>
  );
}

export function GameUI({ onBackToMenu }: { onBackToMenu?: () => void }) {
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
    onBackToMenu?.();
  };

  const handleCopyRoomId = () => {
    const rid = multiplayer.getRoomId();
    if (rid) navigator.clipboard.writeText(rid);
  };

  const handleOfferDraw = () => { multiplayer.offerDraw(); };
  const handleResign = () => { multiplayer.resign(); };

  const captured = getCapturedByMe(moves, myColor || PlayerColor.WHITE);
  const elapsed = startTime > 0 ? now - startTime : 0;
  const isPlaying = phase === GamePhase.PLAYING || phase === GamePhase.CHECK;

  if (!gameStarted) return null;

  return (
    <div className="game-ui-overlay">
      <div className="top-bar">
        <div className="top-left">
          <button onClick={handleBackToMenu} className="ui-btn back-btn">
            ◄ Back to Lobby
          </button>
        </div>
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
          <span className="lp-section-title">Last Move</span>
          <span className="lp-san">{lastMoveSan || "—"}</span>
        </div>

        <div className="lp-divider" />

        <div className="lp-section">
          <span className="lp-section-title">Move</span>
          <span className="lp-move-num">{Math.ceil(moves.length / 2)}</span>
        </div>

        <div className="lp-divider" />

        <div className="lp-section">
          <span className="lp-section-title">Time</span>
          <span className="lp-timer">{formatTime(elapsed)}</span>
        </div>

        <div className="lp-divider" />

        <div className="lp-section lp-section-grow">
          <span className="lp-section-title">History</span>
          <div className="lp-history">
            {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => {
              const w = moves[i * 2];
              const b = moves[i * 2 + 1];
              return (
                <div key={i} className="lp-history-row">
                  <span className="lp-history-num">{i + 1}.</span>
                  <span className={`lp-history-move ${w && moves.length - 1 === i * 2 ? "last" : ""}`}>{w?.san || ""}</span>
                  <span className={`lp-history-move ${b && moves.length - 1 === i * 2 + 1 ? "last" : ""}`}>{b?.san || ""}</span>
                </div>
              );
            })}
            {moves.length === 0 && <span className="lp-empty">—</span>}
          </div>
        </div>

        <div className="lp-divider" />

        <div className="lp-section">
          <span className="lp-section-title">My Captures</span>
          {captured.mine.length > 0 ? (
            <CapturedDisplay pieces={captured.mine} />
          ) : (
            <span className="lp-empty">—</span>
          )}
        </div>

        <div className="lp-divider" />

        <div className="lp-section">
          <span className="lp-section-title">{isAIGame ? "AI Captures" : "Opponent Captures"}</span>
          {captured.theirs.length > 0 ? (
            <CapturedDisplay pieces={captured.theirs} />
          ) : (
            <span className="lp-empty">—</span>
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
