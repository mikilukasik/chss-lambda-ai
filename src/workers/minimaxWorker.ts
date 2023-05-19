import { parentPort } from "worker_threads";
import { WorkerApi } from "../../chss-shared/workerApi/workerApi.js";

import { getMovedBoard } from "../../chss-module-engine/src/engine_new/utils/getMovedBoard.js";
import { getUpdatedLmfLmt } from "../../chss-module-engine/src/engine_new/utils/getUpdatedLmfLmt.js";
import { minimax } from "../../chss-module-engine/src/engine_new/minimax/minimaxTopLevelNoWasm.js";

const workerApi = new WorkerApi({ parentPort });

workerApi.on(
  "minimax",
  async ({ move, board, lmf, lmt, depth, value, score }) => {
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
