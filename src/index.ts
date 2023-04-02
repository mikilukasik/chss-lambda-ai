import { fen2intArray } from "../chss-module-engine/src/engine_new/transformers/fen2intArray.js";
import { move2moveString } from "../chss-module-engine/src/engine_new/transformers/move2moveString.js";
import { hex2toNumArr } from "../chss-module-engine/src/engine_new/transformers/hex2toNumArr.js";
import { generateLegalMoves } from "../chss-module-engine/src/engine_new/moveGenerators/generateLegalMoves.js";
import { predict } from "../chss-module-engine/src/engine_new/tfHelpers/predict.js";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import tf from "@tensorflow/tfjs-node";

const modelPath = `tfjs_model/model.json`;

let loadedModel: tf.LayersModel | null = null;
let loadFailed = false;

const modelAwaiters: ((
  value: tf.LayersModel | PromiseLike<tf.LayersModel>
) => void)[] = [];
const modelRejectors: ((err: any) => void)[] = [];

const getModel = async () =>
  new Promise(async (res, rej) => {
    if (loadFailed) return rej(loadFailed);
    if (loadedModel) return res(loadedModel);
    modelAwaiters.push(res);
    modelRejectors.push(rej);
  });

const modelLoadErrorCatcher = (err: any) => {
  console.log("failed to load model.");
  console.error(err);

  loadFailed = err;
  while (modelRejectors.length) (modelRejectors.pop() || ((_) => {}))(err);
  modelAwaiters.length = 0;
};

(async () => {
  return tf.loadLayersModel("file://" + modelPath).then((model) => {
    console.log("model loaded.");
    loadedModel = model;
    while (modelAwaiters.length) (modelAwaiters.pop() || ((_) => {}))(model);
    modelRejectors.length = 0;
  });
})().catch(modelLoadErrorCatcher);

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const {
      fen,
      lmf: lmfStr,
      lmt: lmtStr,
    } = event.queryStringParameters as {
      fen: string;
      lmf: string;
      lmt: string;
    };

    const board = fen2intArray(fen);
    const nextMoves = generateLegalMoves(board);

    if (!nextMoves.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          winningMoveString: null,
          noValidMoves: true,
          success: true,
        }),
      };
    }

    if (nextMoves.length === 1) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          winningMoveString: move2moveString(nextMoves[0]),
          onlyMove: true,
          success: true,
        }),
      };
    }

    const lmf = hex2toNumArr(lmfStr);
    const lmt = hex2toNumArr(lmtStr);

    const model = await getModel();

    const { winningMoveString } = await predict({ board, lmf, lmt, model, tf });

    return {
      statusCode: 200,
      body: JSON.stringify({
        winningMoveString,
        success: true,
      }),
    };
  } catch (error: any) {
    console.error("Error during prediction:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `An error occurred while making a prediction: ${error.message}`,
      }),
    };
  }
};
