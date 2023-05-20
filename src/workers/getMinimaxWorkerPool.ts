import os from "os";
import path from "path";
import { Worker } from "worker_threads";
import { WorkerPool } from "../../chss-shared/workerApi/workerPool";

const WORKER_FILENAME = "minimaxWorker";
const MAX_WORKERS = 2;

const workerSource = path.resolve(__dirname, WORKER_FILENAME);
const workerCount = Math.min(os.cpus().length, MAX_WORKERS);

export const minimaxWorkerPool = new WorkerPool({
  WorkerClass: Worker,
  workerCount,
  workerSource,
});
