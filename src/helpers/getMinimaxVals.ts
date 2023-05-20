import { minimaxWorkerPool } from "../workers/getMinimaxWorkerPool";

export const getMinimaxVals = async ({
  modelPrediction: { sortedMoves: _sortedMoves },
  moveSorters,
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
  moveSorters: { cutoff?: number }[];
  board: Uint8Array;
  depth?: number;
  lmf: number[];
  lmt: number[];
}) => {
  let winningMove;
  let winningMoveString;
  let value = board[64] ? -999999 : 999999;

  let sortedMoves = _sortedMoves;
  // if (moveSorters[0].cutoff) {
  //   const cutoffValue = sortedMoves[0].score * moveSorters[0].cutoff;
  //   console.log({ sortedMoves, cutoffValue });
  //   sortedMoves = sortedMoves.filter((sm) => sm.score > cutoffValue);
  // }

  const minimaxPayloads = sortedMoves.map((sm) => ({
    ...sm,
    value,
    board,
    lmf,
    lmt,
    depth,
  }));

  const workerPromises = minimaxPayloads.map((payload) =>
    minimaxWorkerPool
      .doOnAvailable("minimax", payload)
      .then((nmVal: number) => {
        if ((board[64] && nmVal > value) || (!board[64] && nmVal < value)) {
          value = nmVal;
          minimaxPayloads.forEach((mp) => (mp.value = nmVal));
          winningMove = payload.move;
          winningMoveString = payload.moveString;
        }
      })
  );

  await Promise.all(workerPromises);

  return { value, winningMove, winningMoveString };
};
