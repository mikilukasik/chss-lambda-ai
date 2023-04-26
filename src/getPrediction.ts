import { fen2intArray } from "../chss-module-engine/src/engine_new/transformers/fen2intArray.js";
import { move2moveString } from "../chss-module-engine/src/engine_new/transformers/move2moveString.js";
import { generateLegalMoves } from "../chss-module-engine/src/engine_new/moveGenerators/generateLegalMoves.js";
import {
  predictMove,
  getWinnerPredictor,
} from "../chss-module-engine/src/engine_new/tfHelpers/predict.js";
import tf from "@tensorflow/tfjs-node";
import { getModelGetter } from "./getModelGetter.js";
import { getMinimaxVals } from "./getMinimaxVals.js";
import { EngineConfig } from "./types/EngineConfig.js";
import { getNextBoards } from "./getNextBoards.js";

const moveModelPath = `models/move_predictor/tfjs/model.json`;
const getMoveModel = getModelGetter(moveModelPath);

const winnerModelPath = `models/winner_predictor/tfjs/model.json`;
const getWinnerModel = getModelGetter(winnerModelPath);

const MIN_DEPTH = 3;
const MAX_DEPTH = 6;
const OPENING_MAX_DEPTH = 4;
const DEFAULT_DEPTH = 5;
const DEFAULT_MOVE_SCORE_RATIO = 4;
const DEFAULT_WINNER_SCORE_RATIO = 0.3;

const getActualDepth = ({
  engineConfig: { depth = DEFAULT_DEPTH },
  moveIndex,
}: {
  engineConfig: EngineConfig;
  moveIndex: number;
}) => {
  let desiredDepth = Math.max(Math.min(depth, MAX_DEPTH), MIN_DEPTH);
  if (moveIndex < 8) return Math.min(desiredDepth, OPENING_MAX_DEPTH);
  return desiredDepth;
};

export const getPrediction = async ({
  fen,
  lmf,
  lmt,
  engineConfig,
  moveIndex,
}: {
  fen: string;
  lmf: number[];
  lmt: number[];
  moveIndex: number;
  engineConfig: EngineConfig;
}) => {
  const {
    moveSorters = [],
    depth = 5,
    moveScoreRario = DEFAULT_MOVE_SCORE_RATIO,
    winnerScoreRario = DEFAULT_WINNER_SCORE_RATIO,
  } = engineConfig;

  const started = Date.now();

  const actualDepth = getActualDepth({ engineConfig, moveIndex });
  const board = fen2intArray(fen);
  const nextMoves = generateLegalMoves(board);

  const winnerModel = await getWinnerModel();
  const winnerPredictor = getWinnerPredictor({ tf, model: winnerModel });

  const { winnerValue: originalWinningValue } = await winnerPredictor({
    board,
    lmf,
    lmt,
  });

  if (!nextMoves.length) {
    return {
      winningMove: null,
      winningMoveString: null,
      noValidMoves: true,
      success: true,
      originalWinningValue,
    };
  }

  if (nextMoves.length === 1) {
    return {
      winningMove: nextMoves[0],
      winningMoveString: move2moveString(nextMoves[0]),
      onlyMove: true,
      success: true,
      originalWinningValue,
    };
  }

  const moveModel = await getMoveModel();

  const gotModelsAt = Date.now();

  const nextBoards = getNextBoards({ board, lmf, lmt, nextMoves });

  const modelPrediction = await predictMove({
    board,
    lmf,
    lmt,
    moveModel,
    winnerModel,
    tf,
    nextBoards,
    moveScoreRario,
    winnerScoreRario,
  });

  const gotModelPredictionAt = Date.now();

  const minimaxVals = await getMinimaxVals({
    modelPrediction,
    board,
    lmf,
    lmt,
    depth: actualDepth,
    moveSorters,
  });

  const winningMoveIndex = modelPrediction.sortedMoves.findIndex(
    ({ move }) => move === minimaxVals.winningMove
  );

  return {
    ...modelPrediction,
    success: true,
    modelLoadTime: gotModelsAt - started,
    modelPredictTime: gotModelPredictionAt - gotModelsAt,
    minimaxTime: Date.now() - gotModelPredictionAt,
    ...minimaxVals,
    winningMoveIndex,
    winningMoveScoreRatio:
      modelPrediction.sortedMoves[winningMoveIndex].score /
      modelPrediction.sortedMoves[0].score,
    depth,
    actualDepth,
    originalWinningValue,
  };
};
