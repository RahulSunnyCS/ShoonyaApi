const speakeasy = require("speakeasy");

let { authparams } = require("../cred");
let { INDEX_DETAILS } = require("../constants");
const { getFormattedDate } = require("../helpers");
const axios = require("axios");

const getToday = () => new Date().toISOString().split("T")[0];

async function login(api, authparams) {
  try {
    const totpToken = speakeasy.totp({
      secret: authparams.twoFA,
      encoding: "base32",
    });
    authparams.twoFA = totpToken;
    await api.login(authparams);
  } catch (err) {
    console.error(err);
  }
}
async function getExpiryIndices(api) {
  const formattedDate = getFormattedDate();
  const expiryIndices = [];

  const promises = INDEX_DETAILS.map((index) => {
    const { key, optExch } = index;
    return api.searchscrip(optExch, key).then((result = {}) => {
      const { values = [] } = result;
      if (values.some(({ tsym }) => tsym.includes(formattedDate))) {
        expiryIndices.push(key);
      }
    });
  });
  await Promise.all(promises);
  return expiryIndices;
}
module.exports.init = async (api) => {
  const formattedDate = getFormattedDate();
  await login(api, authparams);
  const expiryIndices = await getExpiryIndices(api);
  return { expiryIndices, formattedDate };
};
