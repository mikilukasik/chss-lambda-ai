import { fen2intArray } from "../chss-module-engine/src/engine_new/transformers/fen2intArray.js";
import { move2moveString } from "../chss-module-engine/src/engine_new/transformers/move2moveString.js";
import { generateLegalMoves } from "../chss-module-engine/src/engine_new/moveGenerators/generateLegalMoves.js";
import { predict } from "../chss-module-engine/src/engine_new/tfHelpers/predict.js";
import tf from "@tensorflow/tfjs-node";
import { getModelGetter } from "./getModelGetter.js";

const modelPath = `tfjs_model/model.json`;
const getModel = getModelGetter(modelPath);

export const getPrediction = async ({
  fen,
  lmf,
  lmt,
}: {
  fen: string;
  lmf: number[];
  lmt: number[];
}) => {
  const board = fen2intArray(fen);
  const nextMoves = generateLegalMoves(board);

  if (!nextMoves.length) {
    return {
      winningMoveString: null,
      noValidMoves: true,
      success: true,
    };
  }

  if (nextMoves.length === 1) {
    return {
      winningMoveString: move2moveString(nextMoves[0]),
      onlyMove: true,
      success: true,
    };
  }

  const started = Date.now();
  const model = await getModel();
  const gotModelAt = Date.now();

  const prediction = await predict({
    board,
    lmf,
    lmt,
    model,
    tf,
    nextMoves,
  });

  return {
    ...prediction,
    success: true,
    modelLoadTime: gotModelAt - started,
    predictTime: Date.now() - gotModelAt,
  };
};
