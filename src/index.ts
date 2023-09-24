import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { GetMovePayload, getMoveHandler } from "./handlers/getMoveHandler";
import {
  PlayFullGamePayload,
  playFullGameHandler,
} from "./handlers/playFullGameHandler";

const handlers = {
  getMove: getMoveHandler,
  playFullGame: playFullGameHandler,
};

const getResponse = async ({
  command,
  data,
}:
  | {
      command: "getMove";
      data: GetMovePayload;
    }
  | {
      command: "playFullGame";
      data: PlayFullGamePayload;
    }) => handlers[command](data as any);

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const payload = JSON.parse(event.body || "{}");

    if (Array.isArray(payload)) {
      const promises = payload.map((p) => getResponse(p));
      const responses = await Promise.all(promises);

      return {
        statusCode: 200,
        body: JSON.stringify(responses),
      };
    }

    return getResponse(payload);
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `An error occurred while making a prediction: ${e.message}`,
      }),
    };
  }
};
