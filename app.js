require("dotenv").config();
const Api = require("./lib/RestApi");
const { loginShoonya, getPositions } = require("./helper");

api = new Api({});

const init = async () => {
  await loginShoonya();
  getPositions();
};

init();
