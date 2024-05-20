const Api = require("./lib/RestApi");
// Import express
const express = require("express");
const { init } = require("./lib/shoonyaHelpers");
const { getDayWiseAlgos, deleteAlgos } = require("./lib/QuantiplyApis");
const { getPreviousDay, getCurrentDay } = require("./helpers");
const app = express();
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();
const api = new Api({});

// Define a port
const port = process.env.PORT || 8000;

// Middleware to parse JSON
app.use(express.json());

async function initialiseApp(req, res, api) {
  const result = await init(api);
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
