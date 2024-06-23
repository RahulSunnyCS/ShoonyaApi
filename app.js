require("dotenv").config();
const Api = require("./lib/RestApi");
const QuantApi = require("./lib/quantiplySessions");
const express = require("express");
const { init } = require("./lib/shoonyaHelpers");
const { getDayWiseAlgos, deleteAlgos } = require("./lib/QuantiplyApis");
const { getPreviousDay, getCurrentDay } = require("./helpers");
const app = express();
const dotenv = require("dotenv");
const cron = require("node-cron");
const fetchAndProcessData = require("./jobs/fetchAndProcessData");

// Load environment variables from .env file
dotenv.config();
const api = new Api({});
const quantApi = new QuantApi({});

// Define a port
const port = process.env.PORT || 8000;

// Middleware to parse JSON
app.use(express.json());

async function initialiseApp(req, res, api, quantApi) {
  const result = await init(api, quantApi);
  res.send(result);
}

// Route to trigger the function
app.get("/init", (req, res) => {
  initialiseApp(req, res, api, quantApi);
});

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
