"use client";

import React, { useState } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { Lobby } from "@/components/Lobby";
import { GameUI } from "@/components/GameUI";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleGameStart = () => setGameStarted(true);
  const handleBackToMenu = () => setGameStarted(false);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-dark-900">
      <GameCanvas />
      {!gameStarted && <Lobby onGameStart={handleGameStart} />}
      <GameUI onBackToMenu={handleBackToMenu} />
    </main>
  );
}
