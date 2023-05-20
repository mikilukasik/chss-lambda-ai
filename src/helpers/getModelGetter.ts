import * as tf from "@tensorflow/tfjs-node";

const modelGetters: { [key: string]: () => Promise<tf.LayersModel> } = {};

export const getModelGetter = (modelPath: string) => {
  if (modelGetters[modelPath]) return modelGetters[modelPath];

  let loadedModel: tf.LayersModel | null = null;
  let loadFailed: any = false;

  const modelAwaiters: ((
    value: tf.LayersModel | PromiseLike<tf.LayersModel>
  ) => void)[] = [];
  const modelRejectors: ((err: any) => void)[] = [];

  const modelLoadErrorCatcher = (err: any) => {
    const errWithStack = new Error(`Failed to load model: ${err.message}`);
    console.error(errWithStack);

    loadFailed = err;
    while (modelRejectors.length)
      (modelRejectors.pop() || ((_) => {}))(errWithStack);
    modelAwaiters.length = 0;
  };

  tf.loadLayersModel("file://" + modelPath)
    .then((model) => {
      console.log(`${modelPath} loaded.`);
      loadedModel = model;
      while (modelAwaiters.length) (modelAwaiters.pop() || ((_) => {}))(model);
      modelRejectors.length = 0;
    })
    .catch(modelLoadErrorCatcher);

  modelGetters[modelPath] = async () =>
    new Promise(async (res, rej) => {
      if (loadFailed) return rej(loadFailed);
      if (loadedModel) return res(loadedModel);
      modelAwaiters.push(res);
      modelRejectors.push(rej);
    });

  return modelGetters[modelPath];
};
