require("dotenv").config();
const Api = require("./lib/RestApi");
const QuantApi = require("./lib/quantiplySessions");
const express = require("express");
const { init } = require("./lib/shoonyaHelpers");
const { getDayWiseAlgos, deleteAlgos } = require("./lib/QuantiplyApis");
const { getAllEntries, addTrade, updateItem } = require("./lib/dynamoDBApis");
const { getPreviousDay, getCurrentDay } = require("./helpers");
const app = express();
const dotenv = require("dotenv");
const cron = require("node-cron");
const AWS = require("aws-sdk");
const fs = require("fs");
const bodyParser = require("body-parser");
const fetchAndProcessData = require("./jobs/fetchAndProcessData");
const { loginAngelOne, loginShoonya } = require("./helper");

// Load environment variables from .env file
dotenv.config();
const api = new Api({});
const quantApi = new QuantApi({});

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const docClient = new AWS.DynamoDB.DocumentClient();

// Define a port
const port = process.env.PORT || 8000;

// Middleware to parse JSON
app.use(express.json());
app.use(bodyParser.json());

async function initialiseApp(req, res, api, quantApi) {
  const result = await init(api, quantApi);
  res.send(result);
}

app.post("/add-trade", async (req, res) => {
  const { dateid, date, day, gain, brokerage, otherExpense, profit, dd } =
    req.body;
  const item = {
    dateid,
    date,
    gain,
    brokerage,
    otherExpense,
    profit,
    dd,
    day,
  };
  const params = {
    TableName: "daily-trade-book",
    Item: item,
  };
  await addTrade(params, docClient, res);
});

// Route to get all entries from the DynamoDB table
app.get("/get-all-trades", async (req, res) => {
  try {
    const trades = await getAllEntries("daily-trade-book");
    res.json(trades);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to update an entry in the "daily-trade-book" DynamoDB table
app.put("/update-trade", async (req, res) => {
  const { id, ...attributes } = req.body;
  if (!id) {
    return res.status(400).json({ message: "ID is required" });
  }
  try {
    const result = await updateItem("daily-trade-book", id, attributes);
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to trigger the function
app.get("/init", async (req, res) => {
  const response = await loginShoonya();
  res.send(response);
});
// Route to trigger smart-api
app.get("/smart-api",async (req, res)=>{
  const result = await loginAngelOne();
  res.send({result})
})
// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

cron.schedule("58 18 * * 1-5", () => {
  console.log("Running the init task at 8:30 AM on a weekday");
  init(api, quantApi).then((data) => {
    console.log("Init task completed", data);
  });
});
// Schedule the cron job to start at 9:15 AM and then run every 2 minutes until 3:30 PM
cron.schedule("*/2 9-14 * * 1-5", () => {
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  if (currentHour === 14 && currentMinute === 28) {
    console.log("Stopping the cron job at 3:28 PM");
    return cron.destroy();
  } else if (
    currentHour >= 9 &&
    (currentHour > 9 || currentMinute >= 15) &&
    currentHour < 14
  ) {
    console.log(
      "Running the fetch and process data task every 2 minutes on a weekday starting from 9:15 AM"
    );
    // fetchAndProcessData();
  }
});
