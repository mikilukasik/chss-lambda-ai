import { parentPort } from "worker_threads";
import { WorkerApi } from "../../chss-shared/workerApi/workerApi";

import { getMovedBoard } from "../../chss-module-engine/src/engine_new/utils/getMovedBoard";
import { getUpdatedLmfLmt } from "../../chss-module-engine/src/engine_new/utils/getUpdatedLmfLmt";
import { minimax } from "../../chss-module-engine/src/engine_new/minimax/minimaxTopLevelNoWasm";

const workerApi = new WorkerApi({ parentPort });

workerApi.on(
  "minimax",
  async ({
    move,
    board,
    lmf,
    lmt,
    depth,
    value,
    score,
  }: {
    move: number;
    board: Uint8Array;
    lmf: number[];
    lmt: number[];
    depth: number;
    value: number;
    score: number;
  }) => {
    const movedBoard = getMovedBoard(move, board);
    const nextLm = getUpdatedLmfLmt({ move, lmf, lmt });

    return minimax(
      movedBoard,
      depth - 1,
      board[64] ? value : -999999,
      board[64] ? 999999 : value,
      board[64] ? score : -score,
      nextLm.lmf,
      nextLm.lmt,
      false // todo: wantsToDraw
    );
  }
);
