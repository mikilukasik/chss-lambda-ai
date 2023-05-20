import AWS from "aws-sdk";
import { BatchWriteItemRequestMap } from "aws-sdk/clients/dynamodb";
import { checkAndCreateTables } from "./createTables";
import { getNextUpdateId } from "./getNextUpdateId";

const MAX_BATCH_SIZE = 25;

AWS.config.update({
  ...(process.env.AWS_REGION ? { region: process.env.AWS_REGION } : {}),
  ...(process.env.DDB_ENDPOINT ? { endpoint: process.env.DDB_ENDPOINT } : {}),
} as AWS.ConfigurationOptions & { endpoint: string });

const dynamoDb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
checkAndCreateTables(dynamoDb);

const getWithTypes = (obj: Record<string, any>) => {
  const result = {} as Record<
    string,
    { S?: string; BOOL?: boolean; N?: string }
  >;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      result[key] = { S: obj[key] };
      continue;
    }

    if (typeof obj[key] === "boolean") {
      result[key] = { BOOL: obj[key] };
      continue;
    }

    if (typeof obj[key] === "number") {
      result[key] = { N: obj[key].toString() };
      continue;
    }
  }

  return result;
};

export const updateDb = async ({
  update,
}: {
  update: Record<string, { add: Record<string, any>[] }>;
}): Promise<{
  updateResult: {
    UnprocessedItems: {};
    updateIds: Record<string, number>;
  } | null;
  error?: any;
}> => {
  const requests: BatchWriteItemRequestMap[] = [];
  const updateIds: { [key: string]: number } = {};

  for (const tableName of Object.keys(update)) {
    const { add } = update[tableName];
    if (!add || !add.length) continue;

    updateIds[tableName] = await getNextUpdateId(tableName, dynamoDb);

    const items = add.map((row) => {
      const { id, updateId, ...data } = row;
      return {
        PutRequest: {
          Item: getWithTypes({ id, ...data, updateId: updateIds[tableName] }),
        },
      };
    });

    for (let i = 0; i < items.length; i += MAX_BATCH_SIZE) {
      const batchItems = items.slice(i, i + MAX_BATCH_SIZE);
      const request: BatchWriteItemRequestMap = {};
      request[tableName] = batchItems;
      requests.push(request);
    }
  }

  const promises = requests.map((params) =>
    dynamoDb.batchWriteItem({ RequestItems: params }).promise()
  );

  try {
    const results = await Promise.all(promises);
    const updateResult = { UnprocessedItems: {}, updateIds };

    for (const result of results) {
      if (result.UnprocessedItems) {
        Object.assign(updateResult.UnprocessedItems, result.UnprocessedItems);
      }
    }

    return { updateResult };
  } catch (e) {
    return { updateResult: null, error: e };
  }
};
