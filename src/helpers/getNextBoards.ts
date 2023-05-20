import { getMovedBoard } from "../../chss-module-engine/src/engine_new/utils/getMovedBoard";
import { getUpdatedLmfLmt } from "../../chss-module-engine/src/engine_new/utils/getUpdatedLmfLmt";

export const getNextBoards = ({
  board,
  lmf,
  lmt,
  nextMoves,
}: {
  board: Uint8Array;
  lmf: number[];
  lmt: number[];
  nextMoves: Int16Array;
}): {
  move: number;
  board: Uint8Array;
  lmf: number[];
  lmt: number[];
}[] =>
  Array.from(nextMoves).map((move) => ({
    move,
    board: getMovedBoard(move, board),
    ...getUpdatedLmfLmt({ move, lmf, lmt }),
  }));
