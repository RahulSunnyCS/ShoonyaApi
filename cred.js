const speakeasy = require("speakeasy");
module.exports.getAuthparams = () => {
  const {
    FV_USER_ID: userid,
    FV_PASSWORD: password,
    FV_SECRET: twoFA,
    FV_API_SECRET: api_secret,
    FV_VENDOR_CODE: vendor_code,
    FV_IMEI: imei,
  } = process.env || {};
  let authparams = {
    userid,
    password,
    twoFA,
    vendor_code,
    api_secret,
    imei,
  };
  const totpToken = speakeasy.totp({
    secret: authparams.twoFA,
    encoding: "base32",
  });
  authparams.twoFA = totpToken;
  return authparams;
};
