const speakeasy = require("speakeasy");
const Api = require("./lib/RestApi");

api = new Api({});
const {
  FV_USER_ID,
  FV_PASSWORD,
  FV_TWO_FA,
  FV_API_SECRET,
  FV_VENDOR_CODE,
  FV_IMEI,
} = process.env;
const authparams = {
  userid: FV_USER_ID,
  password: FV_PASSWORD,
  twoFA: FV_TWO_FA,
  vendor_code: FV_VENDOR_CODE,
  api_secret: FV_API_SECRET,
  imei: FV_IMEI,
};

module.exports.loginShoonya = async () => {
  try {
    // Generate TOTP based on the secret
    const totpToken = speakeasy.totp({
      secret: process.env.FV_SECRET,
      encoding: "base32",
    });

    authparams.twoFA = totpToken;
    await api.login(authparams);
    console.log("login successful to Shoonya");
  } catch (err) {
    console.error("login to Shoonya failed", err);
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
