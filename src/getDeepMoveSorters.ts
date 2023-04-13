import tf from "@tensorflow/tfjs-node";
import { getModelGetter } from "./getModelGetter.js";
import { predict } from "../chss-module-engine/src/engine_new/tfHelpers/predict.js";

const modelPath = `tfjs_model/model.json`;
const getModel = getModelGetter(modelPath);

export const getDeepMoveSorters = (moveSorters: { cutoff?: number }[]) => {
  return moveSorters.map(
    ({ cutoff }: { cutoff?: number }) =>
      async ({
        board,
        moves,
        lmf,
        lmt,
      }: {
        board: Uint8Array;
        moves: Int16Array;
        lmf: number[];
        lmt: number[];
      }) => {
        const model = await getModel();

        let { sortedMoves } = await predict({
          board,
          lmf,
          lmt,
          model,
          tf,
          nextMoves: moves,
        });

        if (cutoff) {
          const cutoffValue = sortedMoves[0].score * cutoff;
          sortedMoves = sortedMoves.filter((sm) => sm.score > cutoffValue);
        }

        return new Int16Array(sortedMoves.map((sm) => sm.move));
      }
  );
};
