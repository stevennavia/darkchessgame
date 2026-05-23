"use client";

import React, { useState } from "react";

interface WaitingRoomProps {
  roomId: string;
  playerCount: number;
  onCancel: () => void;
}

export function WaitingRoom({ roomId, playerCount, onCancel }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = roomId;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="lobby-container">
      <div className="lobby-bg-overlay" />

      <div className="lobby-content">
        <div className="lobby-logo-wrapper">
          <img src="/assets/ui/logo.png" alt="Dark Chess" className="lobby-logo" />
        </div>

        <div className="lobby-card waiting-card">
          <div className="waiting-header">
            <span className="waiting-icon">🏰</span>
            <h2 className="waiting-title">Chamber of Awakening</h2>
            <p className="waiting-subtitle">A cursed ritual chamber has been prepared</p>
          </div>

          <div className="room-code-section">
            <p className="room-code-label">SHARE THIS INCANTATION</p>
            <div className="room-code-display">
              <span className="room-code-text">{roomId}</span>
              <button onClick={handleCopy} className="btn-copy">
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
            <p className="room-code-hint">Send this code to a challenger</p>
          </div>

          <div className="waiting-status">
            <div className="waiting-players">
              <div className="wp-row">
                <span className="wp-dot filled" />
                <span className="wp-name">You</span>
              </div>
              <div className={`wp-row ${playerCount > 1 ? "joined" : ""}`}>
                <span className={`wp-dot ${playerCount > 1 ? "filled" : "empty"}`} />
                <span className="wp-name">
                  {playerCount > 1 ? "Challenger has arrived!" : "Awaiting challenger..."}
                </span>
              </div>
            </div>

            {playerCount < 2 && (
              <div className="waiting-spinner">
                <div className="wr-spinner" />
              </div>
            )}

            {playerCount >= 2 && (
              <div className="waiting-ready">
                <p className="ready-text">⚔ A challenger approaches! Preparing the curse...</p>
              </div>
            )}
          </div>

          <button onClick={onCancel} className="btn-cancel-waiting">
            ◄ Dissipate the chamber
          </button>
        </div>
      </div>
    </div>
  );
}
