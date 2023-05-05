import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getMoveHandler } from "./handlers/getMoveHandler.js";

const handlers = {
  getMove: getMoveHandler,
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { command, data } = JSON.parse(event.body || "{}") as {
    command: "getMove";
    data: {
      fen: string;
      lmf: number[];
      lmt: number[];
      gameId: string;
      moveIndex: number;
      engineConfig: { moveSorters?: { cutoff?: number }[]; depth?: number };
      dbUpdate: Record<string, { add: Record<string, any>[] }>;
    };
  };

  const response = await handlers[command](data);

  return response;
};
