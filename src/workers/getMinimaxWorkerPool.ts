import os from "os";
import path from "path";
import { Worker } from "worker_threads";
import { WorkerPool } from "../../chss-shared/workerApi/workerPool.js";

const WORKER_FILENAME = "minimaxWorker.js";
const MAX_WORKERS = 2;

const workerSource = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  WORKER_FILENAME
);
const workerCount = Math.min(os.cpus().length, MAX_WORKERS);

export const minimaxWorkerPool = new WorkerPool({
  WorkerClass: Worker,
  workerCount,
  workerSource,
});
