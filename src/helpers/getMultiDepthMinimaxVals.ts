import { getMinimaxVals } from "./getMinimaxVals";

interface MultiDepthMinimaxOptions {
  startingDepth: number;
  maxDepth: number;
  timeout: number;
  modelPrediction: {
    sortedMoves: { move: number; moveString: string; score: number }[];
    winningMoveString: string;
    winningMove: number;
  };
  moveSorters: { cutoff?: number }[];
  board: Uint8Array;
  lmf: number[];
  lmt: number[];
}

export const getMultiDepthMinimaxVals = ({
  startingDepth,
  maxDepth,
  timeout,
  ...options
}: MultiDepthMinimaxOptions): Promise<{
  value: number;
  winningMove: number;
  winningMoveString: string;
  depth: number;
}> =>
  new Promise((resolve) => {
    const timeoutAt = Date.now() + timeout;

    let deepestResult:
      | {
          value: number;
          winningMove: number;
          winningMoveString: string;
          depth: number;
        }
      | undefined;
    let currentDepth = startingDepth;
    let timeoutId: NodeJS.Timeout;
    let timedOutFlag = { timedOut: false };

    const runMinimax = async (): Promise<void> => {
      deepestResult = await getMinimaxVals({
        ...options,
        depth: currentDepth,
        timedOutFlag,
      });

      if (timedOutFlag.timedOut || Date.now() >= timeoutAt) {
        clearTimeout(timeoutId);
        timedOutFlag.timedOut = true;
        return resolve(deepestResult!);
      }

      currentDepth++;
      await runMinimax();
    };

    timeoutId = setTimeout(() => {
      if (!deepestResult) return;

      timedOutFlag.timedOut = true;
      return resolve(deepestResult!);
    }, timeout);

    runMinimax();
  });
