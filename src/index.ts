import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getPrediction } from "./getPrediction.js";
import { updateDb } from "./ddb/updateDb.js";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const { fen, lmf, lmt, dbUpdate } = JSON.parse(event.body || "{}") as {
      fen: string;
      lmf: number[];
      lmt: number[];
      dbUpdate: Record<string, { add: Record<string, any>[] }>;
    };

    const [predictResponse, dbUpdateResponse] = await Promise.all([
      getPrediction({ fen, lmf, lmt }),
      updateDb({ update: dbUpdate }),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ ...predictResponse, ...dbUpdateResponse }),
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
