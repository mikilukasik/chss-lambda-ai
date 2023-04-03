import { fen2intArray } from "../chss-module-engine/src/engine_new/transformers/fen2intArray.js";
import { move2moveString } from "../chss-module-engine/src/engine_new/transformers/move2moveString.js";
import { hex2toNumArr } from "../chss-module-engine/src/engine_new/transformers/hex2toNumArr.js";
import { generateLegalMoves } from "../chss-module-engine/src/engine_new/moveGenerators/generateLegalMoves.js";
import { predict } from "../chss-module-engine/src/engine_new/tfHelpers/predict.js";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import tf from "@tensorflow/tfjs-node";
import { getModelGetter } from "./getModelGetter.js";

const modelPath = `tfjs_model/model.json`;
const getModel = getModelGetter(modelPath);

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
      statusCode: 200,
      body: JSON.stringify({
        ...prediction,
        success: true,
        modelLoadTime: gotModelAt - started,
        predictTime: Date.now() - gotModelAt,
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
