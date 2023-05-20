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

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const { command, data } = JSON.parse(event.body || "{}") as
      | {
          command: "getMove";
          data: GetMovePayload;
        }
      | {
          command: "playFullGame";
          data: PlayFullGamePayload;
        };

    const response = await handlers[command](data as any);

    return response;
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `An error occurred while making a prediction: ${e.message}`,
      }),
    };
  }
};
