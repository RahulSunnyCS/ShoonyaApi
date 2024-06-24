const { getTotp } = require("./helpers");

module.exports.getAuthparams = () => {
  const {
    FV_USER_ID: userid,
    FV_PASSWORD: password,
    FV_TWO_FA: twoFA,
    FV_API_SECRET: api_secret,
    FV_VENDOR_CODE: vendor_code,
    FV_IMEI: imei,
  } = process.env || {};
  let authparams = {
    userid,
    password,
    vendor_code,
    api_secret,
    imei,
    twoFA: getTotp(twoFA)
  };
  return authparams;
};
