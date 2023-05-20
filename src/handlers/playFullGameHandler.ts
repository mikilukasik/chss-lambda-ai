import { getPrediction } from "../helpers/getPrediction";
import { EngineConfig } from "../types/EngineConfig";

import { getMovedBoard } from "../../chss-module-engine/src/engine_new/utils/getMovedBoard";
import { getUpdatedLmfLmt } from "../../chss-module-engine/src/engine_new/utils/getUpdatedLmfLmt";
import { board2fen } from "../../chss-module-engine/src/engine_new/transformers/board2fen";
import { fen2intArray } from "../../chss-module-engine/src/engine_new/transformers/fen2intArray";
import { isCheck } from "../../chss-module-engine/src/engine_new/utils/isCheck";
import { getBoardPieceBalance } from "../../chss-module-engine/src/engine_new/utils/getBoardPieceBalance";

const MAX_MOVES_WITH_NO_HIT_OR_PAWN_MOVE = 50;

export type PlayFullGamePayload = {
  startingFen: string;
  startingLmf: number[];
  startingLmt: number[];
  lightEngineConfig: EngineConfig;
  darkEngineConfig: EngineConfig;
  startingMoveIndex: number;
};

const getResult = ({
  noValidMoves,
  wNext,
  fen,
  lightEngineConfig,
  darkEngineConfig,
  balance,
  moveCount,
}: {
  noValidMoves?: boolean;
  wNext: boolean;
  fen: string;
  lightEngineConfig: EngineConfig;
  darkEngineConfig: EngineConfig;
  balance: number;
  moveCount: number;
}) => {
  if (noValidMoves) {
    if (isCheck(fen2intArray(fen))) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          winner: wNext ? "dark" : "light",
          winnerConfig: wNext ? darkEngineConfig : lightEngineConfig,
          balance,
          moveCount,
          lastFen: fen,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        winner: null,
        stall: true,
        balance,
        moveCount,
        lastFen: fen,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      winner: null,
      balance,
      moveCount,
      lastFen: fen,
    }),
  };
};

export const playFullGameHandler = async (data: PlayFullGamePayload) => {
  try {
    const {
      startingFen,
      lightEngineConfig,
      darkEngineConfig,
      startingLmf,
      startingLmt,
      startingMoveIndex = 0,
    } = data;

    let fen = startingFen;
    let lmf = startingLmf;
    let lmt = startingLmt;
    let moveIndex = startingMoveIndex;
    let movesSinceLastHitOrPAwnMove = 0;
    let previousBalance = 0;

    while (true) {
      const wNext = fen.indexOf(" w ") > -1;

      const { winningMove, noValidMoves, minimaxTime } = (await getPrediction({
        fen,
        lmf,
        lmt,
        engineConfig: wNext ? lightEngineConfig : darkEngineConfig,
        moveIndex,
      })) as any;

      if (
        noValidMoves ||
        !winningMove ||
        movesSinceLastHitOrPAwnMove >= MAX_MOVES_WITH_NO_HIT_OR_PAWN_MOVE
      )
        return getResult({
          noValidMoves,
          wNext,
          fen,
          lightEngineConfig,
          darkEngineConfig,
          balance: previousBalance,
          moveCount: moveIndex,
        });

      const board = fen2intArray(fen);
      const movedBoard = getMovedBoard(winningMove, board);
      fen = board2fen(movedBoard);

      ({ lmf, lmt } = getUpdatedLmfLmt({
        lmf,
        lmt,
        move: winningMove,
      }));

      moveIndex += 1;

      movesSinceLastHitOrPAwnMove += 1;
      const balance = getBoardPieceBalance(movedBoard);

      if (balance !== previousBalance) {
        movesSinceLastHitOrPAwnMove = 0;
        previousBalance = balance;
        continue;
      }

      const wasPawnMove = (board[winningMove >>> 10] & 7) === 1;
      if (wasPawnMove) movesSinceLastHitOrPAwnMove = 0;
    }
  } catch (error: any) {
    console.error("Error playing full game:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `An error occurred while playing full game: ${error.message}`,
      }),
    };
  }
};
