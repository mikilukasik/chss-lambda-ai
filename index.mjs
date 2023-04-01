import { fen2intArray } from "./chss-module-engine/src/engine_new/transformers/fen2intArray.js";
import { predict } from "./chss-module-engine/src/engine_new/tfHelpers/predict.js";
import tf from "@tensorflow/tfjs-node";

const modelPath = `tfjs_model/model.json`;

let loadedModel = null;
let loadFailed = false;

const modelAwaiters = [];
const modelRejectors = [];

const getModel = async () =>
  new Promise(async (res, rej) => {
    if (loadFailed) return rej(loadFailed);
    if (loadedModel) return res(loadedModel);
    modelAwaiters.push(res);
    modelRejectors.push(rej);
  });

const modelLoadErrorCatcher = (err) => {
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

const hexToDec = (hex) => Number(`0x${hex}`);
const transformLmfLmt = (lmflmtStr) => {
  const result = [];
  for (let i = 0; i < 128; i += 2) {
    result.push(hexToDec(lmflmtStr.substring(i, i + 2)));
  }
  return result;
};

export const handler = async (event, context) => {
  try {
    const { fen, lmf: lmfStr, lmt: lmtStr } = event.queryStringParameters;

    const board = fen2intArray(fen);
    const lmf = transformLmfLmt(lmfStr);
    const lmt = transformLmfLmt(lmtStr);

    const model = await getModel();

    const { winningMoveString } = await predict({ board, lmf, lmt, model, tf });

    return {
      statusCode: 200,
      body: JSON.stringify({
        winningMoveString,
      }),
    };
  } catch (error) {
    console.error("Error during prediction:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `An error occurred while making a prediction: ${error.message}`,
      }),
    };
  }
};
