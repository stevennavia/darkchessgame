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
