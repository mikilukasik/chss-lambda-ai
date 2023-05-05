import { getPrediction } from "../helpers/getPrediction.js";
import { updateDb } from "../ddb/updateDb.js";
import os from "os";

export const getMoveHandler = async (data: {
  fen: string;
  lmf: number[];
  lmt: number[];
  gameId: string;
  moveIndex: number;
  engineConfig: { moveSorters?: { cutoff?: number }[]; depth?: number };
  dbUpdate: Record<string, { add: Record<string, any>[] }>;
}) => {
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
