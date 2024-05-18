const Api = require("./lib/RestApi");
const speakeasy = require("speakeasy");

let { authparams } = require("./cred");
const { getPositions } = require("./helpers");

api = new Api({});
async function login(authparams) {
  try {
    const totpToken = speakeasy.totp({
      secret: authparams.twoFA,
      encoding: "base32",
    });
    authparams.twoFA = totpToken;
    await api.login(authparams);
    init();
  } catch (err) {
    console.error(err);
  }
}

async function init() {
  await api.get_holdings();
  setInterval(() => {
    api.searchscrip("NFO", "NIFTY DEC CE").then((reply) => {
      console.log(reply);
    });
  }, 20000);
}

login(authparams);
