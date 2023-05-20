import { getPrediction } from "../helpers/getPrediction";
import { updateDb } from "../ddb/updateDb";
import os from "os";
import { EngineConfig } from "../types/EngineConfig";

export type GetMovePayload = {
  fen: string;
  lmf: number[];
  lmt: number[];
  gameId: string;
  moveIndex: number;
  engineConfig: EngineConfig;
  dbUpdate: Record<string, { add: Record<string, any>[] }>;
};

export const getMoveHandler = async (data: GetMovePayload) => {
  try {
    const {
      fen,
      lmf,
      lmt,
      gameId,
      moveIndex,
      dbUpdate,
      engineConfig = {},
    } = data;

    const [predictResponse, dbUpdateResponse] = await Promise.all([
      getPrediction({ fen, lmf, lmt, engineConfig, moveIndex }),
      updateDb({ update: dbUpdate }),
    ]);

    if (predictResponse.winningMove) {
      const moveUpdateResponse = await updateDb({
        update: {
          fens: {
            add: [
              {
                id: `${gameId}/${moveIndex}`,
                game: gameId,
                index: moveIndex,
                fen,
                move: predictResponse.winningMove,
                engineConfig: JSON.stringify(engineConfig),
                predictResponse: JSON.stringify(predictResponse),
              },
            ],
          },
        },
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...predictResponse,
          ...dbUpdateResponse,
          moveUpdateId: moveUpdateResponse.updateResult?.updateIds.fens,
          cpus: os.cpus().length,
        }),
      };
    }

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
