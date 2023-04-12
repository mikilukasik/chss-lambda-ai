import { getMovedBoard } from "../chss-module-engine/src/engine_new/utils/getMovedBoard.js";
import { getUpdatedLmfLmt } from "../chss-module-engine/src/engine_new/utils/getUpdatedLmfLmt.js";
import { minimax } from "../chss-module-engine/src/engine_new/minimax/minimaxTopLevelNoWasm.js";

export const getMinimaxVals = async ({
  modelPrediction: { sortedMoves },
  board,
  depth = 5,
  lmf,
  lmt,
}: {
  modelPrediction: {
    winningMoveString: string;
    winningMove: number;
    sortedMoves: { move: number; moveString: string; score: number }[];
  };
  board: Uint8Array;
  depth?: number;
  lmf: number[];
  lmt: number[];
}) => {
  let winningMove;
  let winningMoveString;

  let value = board[64] ? -999999 : 999999;

  for (const { move, moveString, score } of sortedMoves) {
    const movedBoard = getMovedBoard(move, board);
    const nextLm = getUpdatedLmfLmt({ move, lmf, lmt });

    const nmVal = await minimax(
      movedBoard,
      depth - 1,
      board[64] ? value : -999999,
      board[64] ? 999999 : value,
      board[64] ? score : -score,
      [],
      nextLm.lmf,
      nextLm.lmt,
      false // todo: wantsToDraw
    );

    if ((board[64] && nmVal > value) || (!board[64] && nmVal < value)) {
      value = nmVal;
      winningMove = move;
      winningMoveString = moveString;
    }
  }

  return { value, winningMove, winningMoveString };
};
