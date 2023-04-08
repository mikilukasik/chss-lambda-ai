export const getNextUpdateId = async (
  tableName: string,
  dynamoDb: AWS.DynamoDB
): Promise<number> => {
  const params = {
    TableName: "nextUpdateIds",
    Key: { id: { S: tableName } },
    UpdateExpression: "SET #nextUpdateId = #nextUpdateId + :incr",
    ExpressionAttributeNames: { "#nextUpdateId": "nextUpdateId" },
    ExpressionAttributeValues: { ":incr": { N: "1" } },
    ReturnValues: "UPDATED_NEW",
  };

  const response = await dynamoDb.updateItem(params).promise();

  return Number(response.Attributes!.nextUpdateId.N);
};
