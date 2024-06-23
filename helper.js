const speakeasy = require("speakeasy");
const Api = require("./lib/RestApi");
let { SmartAPI, WebSocket, WebSocketV2 } = require("smartapi-javascript");

const {
  FV_USER_ID,
  FV_PASSWORD,
  FV_API_SECRET,
  FV_VENDOR_CODE,
  FV_IMEI,
  AO_USER_ID,
  AO_PASSWORD,
  AO_API_SECRET,
} = process.env;
const authparams = {
  userid: FV_USER_ID,
  password: FV_PASSWORD,
  vendor_code: FV_VENDOR_CODE,
  api_secret: FV_API_SECRET,
  imei: FV_IMEI,
};
api = new Api({});
let smart_api = new SmartAPI({
  api_key: AO_API_SECRET,
});
module.exports.loginShoonya = async () => {
  try {
    // Generate TOTP based on the secret
    const totpToken = speakeasy.totp({
      secret: process.env.FV_TWO_FA,
      encoding: "base32",
    });

    authparams.twoFA = totpToken;
    const response = await api.login(authparams);
    console.log("login successful to Shoonya");
    return {
      message: "completed the login path",
      response,
    }
  } catch (err) {
    console.error("login to Shoonya failed", err);
  }
};

module.exports.loginAngelOne = async () => {
  try {
    // Generate TOTP based on the secret
    const totpToken = speakeasy.totp({
      secret: process.env.AO_TWO_FA,
      encoding: "base32",
    });
    const response = await smart_api
    .generateSession(AO_USER_ID, AO_PASSWORD, totpToken);
    const profile = await smart_api.getProfile();
    const history =	await smart_api.getCandleData({
			    "exchange": "NSE",
			    "symboltoken": "3045",
			    "interval": "ONE_MINUTE",
			    "fromdate": "2021-02-10 09:00",
			    "todate": "2021-02-10 15:20"
			})
    return {history}
  } catch (err) {
    console.error("login to Angel One failed", err);
  }
};

module.exports.getPositions = async () => {
  try {
    const response = await api.get_positions();
    console.log("getPosition response", response);
  } catch (err) {
    console.log("error in getPosition", err);
  }
};
