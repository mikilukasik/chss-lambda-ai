import { fen2intArray } from "../chss-module-engine/src/engine_new/transformers/fen2intArray.js";
import { move2moveString } from "../chss-module-engine/src/engine_new/transformers/move2moveString.js";
import { generateLegalMoves } from "../chss-module-engine/src/engine_new/moveGenerators/generateLegalMoves.js";
import { predict } from "../chss-module-engine/src/engine_new/tfHelpers/predict.js";
import tf from "@tensorflow/tfjs-node";
import { getModelGetter } from "./getModelGetter.js";
import { getMinimaxVals } from "./getMinimaxVals.js";

type EngineConfig = {
  moveSorters?: { cutoff?: number }[];
  depth?: number;
};

const modelPath = `tfjs_model/model.json`;
const getModel = getModelGetter(modelPath);

const MIN_DEPTH = 3;
const MAX_DEPTH = 6;
const OPENING_MAX_DEPTH = 4;

const getActualDepth = ({
  engineConfig: { depth = 5 },
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
  const { moveSorters = [], depth = 5 } = engineConfig;

  const actualDepth = getActualDepth({ engineConfig, moveIndex });
  const board = fen2intArray(fen);
  const nextMoves = generateLegalMoves(board);

  if (!nextMoves.length) {
    return {
      winningMove: null,
      winningMoveString: null,
      noValidMoves: true,
      success: true,
    };
  }

  if (nextMoves.length === 1) {
    return {
      winningMove: nextMoves[0],
      winningMoveString: move2moveString(nextMoves[0]),
      onlyMove: true,
      success: true,
    };
  }

  const started = Date.now();
  const model = await getModel();
  const gotModelAt = Date.now();

  const modelPrediction = await predict({
    board,
    lmf,
    lmt,
    model,
    tf,
    nextMoves,
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
    modelLoadTime: gotModelAt - started,
    modelPredictTime: gotModelPredictionAt - gotModelAt,
    minimaxTime: Date.now() - gotModelPredictionAt,
    ...minimaxVals,
    winningMoveIndex,
    winningMoveScoreRatio:
      modelPrediction.sortedMoves[winningMoveIndex].score /
      modelPrediction.sortedMoves[0].score,
    depth,
    actualDepth,
  };
};
