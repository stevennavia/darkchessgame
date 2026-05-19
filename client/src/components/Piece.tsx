"use client";

import React, { useRef, useEffect, useState } from "react";

interface PieceProps {
  type: string;
  color: "w" | "b";
  isSelected: boolean;
  shake?: boolean;
}

export function Piece({ type, color, isSelected, shake }: PieceProps) {
  const [useFallback, setUseFallback] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const imageSrc = `/assets/pieces/${color}${type}.png`;

  useEffect(() => {
    if (!useFallback) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);

    if (isSelected) {
      ctx.shadowColor = "rgba(201, 168, 76, 0.6)";
      ctx.shadowBlur = 15;
    }

    const fillColor = color === "w" ? "#e8e8e8" : "#2a2a2a";
    const outlineColor = color === "w" ? "#666" : "#555";
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.2;

    const sc = size / 60;
    const cx = 30 * sc;
    const cy = 30 * sc;

    switch (type) {
      case "P":
        ctx.beginPath();
        ctx.arc(cx, 20 * sc, 7 * sc, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24 * sc, 26 * sc);
        ctx.lineTo(36 * sc, 26 * sc);
        ctx.quadraticCurveTo(38 * sc, 32 * sc, 36 * sc, 34 * sc);
        ctx.lineTo(24 * sc, 34 * sc);
        ctx.quadraticCurveTo(22 * sc, 32 * sc, 24 * sc, 26 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 36 * sc);
        ctx.lineTo(38 * sc, 36 * sc);
        ctx.lineTo(35 * sc, 48 * sc);
        ctx.lineTo(25 * sc, 48 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "N":
        ctx.beginPath();
        ctx.moveTo(28 * sc, 12 * sc);
        ctx.quadraticCurveTo(38 * sc, 10 * sc, 40 * sc, 18 * sc);
        ctx.quadraticCurveTo(42 * sc, 26 * sc, 36 * sc, 30 * sc);
        ctx.quadraticCurveTo(40 * sc, 34 * sc, 38 * sc, 40 * sc);
        ctx.lineTo(22 * sc, 40 * sc);
        ctx.quadraticCurveTo(20 * sc, 34 * sc, 24 * sc, 30 * sc);
        ctx.quadraticCurveTo(18 * sc, 26 * sc, 20 * sc, 18 * sc);
        ctx.quadraticCurveTo(22 * sc, 12 * sc, 28 * sc, 12 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 42 * sc);
        ctx.lineTo(38 * sc, 42 * sc);
        ctx.lineTo(35 * sc, 48 * sc);
        ctx.lineTo(25 * sc, 48 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "B":
        ctx.beginPath();
        ctx.arc(cx, 16 * sc, 5 * sc, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, 10 * sc);
        ctx.lineTo(cx, 4 * sc);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, 4 * sc, 2 * sc, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 22 * sc);
        ctx.quadraticCurveTo(cx, 18 * sc, 38 * sc, 22 * sc);
        ctx.quadraticCurveTo(40 * sc, 32 * sc, 36 * sc, 42 * sc);
        ctx.lineTo(24 * sc, 42 * sc);
        ctx.quadraticCurveTo(20 * sc, 32 * sc, 22 * sc, 22 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 44 * sc);
        ctx.lineTo(38 * sc, 44 * sc);
        ctx.lineTo(35 * sc, 50 * sc);
        ctx.lineTo(25 * sc, 50 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "R":
        ctx.fillRect(22 * sc, 8 * sc, 16 * sc, 4 * sc);
        ctx.fillRect(20 * sc, 12 * sc, 20 * sc, 4 * sc);
        ctx.beginPath();
        ctx.moveTo(21 * sc, 16 * sc);
        ctx.lineTo(21 * sc, 34 * sc);
        ctx.lineTo(18 * sc, 38 * sc);
        ctx.lineTo(18 * sc, 48 * sc);
        ctx.lineTo(42 * sc, 48 * sc);
        ctx.lineTo(42 * sc, 38 * sc);
        ctx.lineTo(39 * sc, 34 * sc);
        ctx.lineTo(39 * sc, 16 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "Q":
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const tipX = cx + Math.cos(angle) * 10 * sc;
          const tipY = 14 * sc + Math.sin(angle) * 10 * sc;
          ctx.beginPath();
          ctx.arc(tipX, tipY, 2.5 * sc, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx, 16 * sc);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, 16 * sc, 4 * sc, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 22 * sc);
        ctx.quadraticCurveTo(cx, 18 * sc, 38 * sc, 22 * sc);
        ctx.quadraticCurveTo(40 * sc, 32 * sc, 36 * sc, 42 * sc);
        ctx.lineTo(24 * sc, 42 * sc);
        ctx.quadraticCurveTo(20 * sc, 32 * sc, 22 * sc, 22 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 44 * sc);
        ctx.lineTo(38 * sc, 44 * sc);
        ctx.lineTo(35 * sc, 50 * sc);
        ctx.lineTo(25 * sc, 50 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "K":
        ctx.beginPath();
        ctx.arc(cx, 16 * sc, 4 * sc, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, 10 * sc);
        ctx.lineTo(cx, 2 * sc);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(25 * sc, 6 * sc);
        ctx.lineTo(35 * sc, 6 * sc);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 22 * sc);
        ctx.quadraticCurveTo(cx, 18 * sc, 38 * sc, 22 * sc);
        ctx.quadraticCurveTo(40 * sc, 32 * sc, 36 * sc, 42 * sc);
        ctx.lineTo(24 * sc, 42 * sc);
        ctx.quadraticCurveTo(20 * sc, 32 * sc, 22 * sc, 22 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22 * sc, 44 * sc);
        ctx.lineTo(38 * sc, 44 * sc);
        ctx.lineTo(35 * sc, 50 * sc);
        ctx.lineTo(25 * sc, 50 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
    }

    ctx.restore();
  }, [type, color, isSelected, useFallback]);

  const className = `chess-piece ${isSelected ? "selected" : ""} ${shake ? "piece-shake" : ""}`;

  if (useFallback) {
    return <canvas ref={canvasRef} width={92} height={92} className={className} />;
  }

  return (
    <img
      src={imageSrc}
      alt={`${color === "w" ? "White" : "Black"} ${type}`}
      className={className}
      onError={() => setUseFallback(true)}
    />
  );
}
