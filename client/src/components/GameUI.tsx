"use client";

import React, { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { multiplayer } from "@/network/multiplayer";
import { GamePhase, PlayerColor } from "@/types";
import { TurnIndicator } from "./TurnIndicator";

export function GameUI() {
  const {
    phase, turn, myColor, winner, moves, lastMoveSan,
    opponentName, playerName, showDrawOffer, drawOfferedBy,
    setDrawOffer, isAIGame, gameStarted, reset, roomId, setRoomId,
    setMyInfo, setConnectionStatus, connectionStatus,
  } = useGameStore();

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

  const handleOfferDraw = () => {
    multiplayer.offerDraw();
  };

  const handleResign = () => {
    multiplayer.resign();
  };

  if (!gameStarted) return null;

  return (
    <div className="game-ui-overlay">
      <div className="top-bar">
        <div className="top-left">
          <TurnIndicator />
        </div>
        <div className="top-right">
          {!isAIGame && multiplayer.getRoomId() && (
            <>
              <button onClick={handleCopyRoomId} className="ui-btn copy-btn" title="Copy room code">
                {multiplayer.getRoomId()?.slice(0, 6)}...
              </button>
              <button onClick={handleOfferDraw} className="ui-btn draw-btn" title="Offer draw">
                Draw
              </button>
              <button onClick={handleResign} className="ui-btn resign-btn" title="Resign">
                Resign
              </button>
            </>
          )}
        </div>
      </div>

      {showDrawOffer && (
        <div className="draw-dialog">
          <div className="draw-dialog-box">
            <p className="draw-text">{drawOfferedBy} offers a draw</p>
            <div className="draw-buttons">
              <button
                onClick={() => { multiplayer.respondToDraw(true); setDrawOffer(false); }}
                className="ui-btn draw-accept"
              >Accept</button>
              <button
                onClick={() => { multiplayer.respondToDraw(false); setDrawOffer(false); }}
                className="ui-btn draw-decline"
              >Decline</button>
            </div>
          </div>
        </div>
      )}

      <div className="bottom-bar">
        <div className="bottom-info">
          <div className="turn-info">
            <div className={`turn-dot ${turn === PlayerColor.WHITE ? "white-turn" : "black-turn"}`} />
            <span className="turn-label">{turn === myColor ? "Your turn" : "Opponent's turn"}</span>
          </div>
          {lastMoveSan && (
            <>
              <div className="info-separator" />
              <span className="move-san">{lastMoveSan}</span>
            </>
          )}
          <div className="info-separator" />
          <span className="move-count">Move {Math.ceil(moves.length / 2)}</span>
          {isAIGame && phase === GamePhase.CHECK && (
            <span className="check-indicator">CHECK</span>
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
            {!isAIGame && phase !== GamePhase.ABANDONED && (
              <button onClick={() => multiplayer.requestRematch()} className="ui-btn rematch-btn">
                Request Rematch
              </button>
            )}
            <button onClick={handleBackToMenu} className="ui-btn menu-btn">
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
