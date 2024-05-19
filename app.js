const Api = require("./lib/RestApi");
// Import express
const express = require("express");
const { init } = require("./lib/shoonyaHelpers");
const { getDayWiseAlgos, deleteAlgos } = require("./lib/QuantiplyApis");
const { getPreviousDay, getCurrentDay } = require("./helpers");
const app = express();
const api = new Api({});

// Define a port
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Example function
async function initialiseApp(req, res, api) {
  const result = await init(api);
  const prevDay = getPreviousDay();
  const currentDay = getCurrentDay();
  await deleteAlgos(prevDay);
  res.send(result);
}

// Route to trigger the function
app.get("/init", (req, res) => {
  initialiseApp(req, res, api);
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
