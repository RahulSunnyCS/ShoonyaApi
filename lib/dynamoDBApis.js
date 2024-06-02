module.exports.getAllEntries = async (tableName) => {
  const params = {
    TableName: tableName,
  };

  try {
    const data = await docClient.scan(params).promise();
    const sortedData = data.Items.sort((a, b) => a.id - b.id);
    return sortedData;
  } catch (err) {
    console.error(
      `Unable to scan the ${tableName} table. Error JSON:`,
      JSON.stringify(err, null, 2)
    );
    throw err;
  }
};

module.exports.updateItem = async (tableName, id, attributes) => {
  // Initialize the expressions
  let UpdateExpression = "SET";
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};

  // Construct the UpdateExpression, ExpressionAttributeNames, and ExpressionAttributeValues dynamically
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      // Only include attributes that are defined
      const attributeKey = `#${key}`;
      const attributeValue = `:${key}`;

      // Append to the UpdateExpression
      UpdateExpression += ` ${attributeKey} = ${attributeValue},`;

      // Add to the ExpressionAttributeNames and ExpressionAttributeValues
      ExpressionAttributeNames[attributeKey] = key;
      ExpressionAttributeValues[attributeValue] = value;
    }
  }

  // Remove the trailing comma from UpdateExpression
  UpdateExpression = UpdateExpression.slice(0, -1);

  // Check if there are attributes to update
  if (Object.keys(ExpressionAttributeValues).length === 0) {
    throw new Error("No attributes provided for update");
  }

  const params = {
    TableName: tableName,
    Key: { id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };

  try {
    // Perform the update operation
    await docClient.update(params).promise();
    return { message: "Item updated successfully" };
  } catch (err) {
    console.error(
      `Unable to update item. Error JSON:`,
      JSON.stringify(err, null, 2)
    );
    throw err;
  }
};

// Route to add a new entry to the DynamoDB table
module.exports.addTrade = async (params, docClient, res) => {
  try {
    await docClient.put(params).promise();
    res.json({ message: "Trade added successfully" });
  } catch (err) {
    console.error(
      "Unable to add trade. Error JSON:",
      JSON.stringify(err, null, 2)
    );
    res.status(500).send(err);
  }
};
