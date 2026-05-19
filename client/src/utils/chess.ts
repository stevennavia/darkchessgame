import { PiecePosition } from "@/types";

export function fenToPieces(fen: string): PiecePosition[] {
  const pieces: PiecePosition[] = [];
  const boardPart = fen.split(" ")[0];
  let row = 0;
  let col = 0;

  for (const char of boardPart) {
    if (char === "/") {
      row++;
      col = 0;
    } else {
      const num = parseInt(char);
      if (!isNaN(num)) {
        col += num;
      } else {
        const isWhite = char === char.toUpperCase();
        const file = String.fromCharCode(97 + col);
        const rank = String(8 - row);
        pieces.push({
          type: char.toUpperCase(),
          color: isWhite ? "w" : "b",
          square: `${file}${rank}`,
        });
        col++;
      }
    }
  }

  return pieces;
}

export function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

export function findKingSquare(fen: string, color: "w" | "b"): string | null {
  const board = fen.split(" ")[0];
  const target = color === "w" ? "K" : "k";
  let row = 0, col = 0;
  for (const char of board) {
    if (char === "/") { row++; col = 0; continue; }
    const num = parseInt(char);
    if (!isNaN(num)) { col += num; continue; }
    if (char === target) {
      return `${String.fromCharCode(97 + col)}${8 - row}`;
    }
    col++;
  }
  return null;
}

export function getAdjacentSquares(square: string): string[] {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  const result: string[] = [];

  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = file + df;
      const nr = rank + dr;
      if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
      result.push(`${String.fromCharCode(97 + nf)}${nr + 1}`);
    }
  }

  return result;
}
