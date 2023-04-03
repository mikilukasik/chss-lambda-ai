import tf, { LayersModel } from "@tensorflow/tfjs-node";

const modelGetters: { [key: string]: () => Promise<LayersModel> } = {};

export const getModelGetter = (modelPath: string) => {
  if (modelGetters[modelPath]) return modelGetters[modelPath];

  let loadedModel: tf.LayersModel | null = null;
  let loadFailed = false;

  const modelAwaiters: ((
    value: tf.LayersModel | PromiseLike<tf.LayersModel>
  ) => void)[] = [];
  const modelRejectors: ((err: any) => void)[] = [];

  const modelLoadErrorCatcher = (err: any) => {
    console.log("failed to load model.");
    console.error(err);

    loadFailed = err;
    while (modelRejectors.length) (modelRejectors.pop() || ((_) => {}))(err);
    modelAwaiters.length = 0;
  };

  tf.loadLayersModel("file://" + modelPath)
    .then((model) => {
      console.log("model loaded.");
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
