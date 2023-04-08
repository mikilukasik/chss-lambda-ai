const tableNames = ["games", "users", "fens"];

async function createTable(tableName: string, dynamoDb: AWS.DynamoDB) {
  const params = {
    TableName: tableName,
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  };
  await dynamoDb.createTable(params).promise();
  console.log(`Created table ${tableName}`);
}

export async function checkAndCreateTables(dynamoDb: AWS.DynamoDB) {
  try {
    const existingTables = await dynamoDb.listTables().promise();
    const existingTableNames = existingTables.TableNames || [];

    if (!existingTableNames.includes("nextUpdateIds")) {
      await createTable("nextUpdateIds", dynamoDb);
    }

    for (const tableName of tableNames) {
      if (!existingTableNames.includes(tableName)) {
        await createTable(tableName, dynamoDb);
        await dynamoDb
          .putItem({
            TableName: "nextUpdateIds",
            Item: { id: { S: tableName }, nextUpdateId: { N: "0" } },
          })
          .promise();
      }
    }
  } catch (err) {
    console.error("Error checking/creating tables:", err);
  }
}
