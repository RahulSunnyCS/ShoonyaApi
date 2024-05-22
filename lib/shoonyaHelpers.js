let { getAuthparams } = require("../cred");
let { INDEX_DETAILS, INDEX_INDICES } = require("../constants");
const {
  getFormattedDate,
  getPreviousDay,
  getCurrentDay,
} = require("../helpers");
const {
  cloneAlgos,
  deleteAlgos,
  getDayWiseAlgos,
  enableAlgos,
} = require("./QuantiplyApis");

const getToday = () => new Date().toISOString().split("T")[0];

async function login(api) {
  try {
    const authparams = getAuthparams();
    await api.login(authparams);
    return;
  } catch (error) {
    console.error("error in loginApi", error);
  }
}
async function getExpiryIndices(api) {
  const formattedDate = getFormattedDate();
  const expiryIndices = [];
  try {
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
  } catch (error) {
    return expiryIndices;
  }
}
module.exports.init = async (api, quantApi) => {
  await login(api);
  const formattedDate = getFormattedDate();
  const result = await enableAlgos(api);
  // return { result };

  const expiryIndices = await getExpiryIndices(api);
  // const prevDay = getPreviousDay();
  // const currentDay = getCurrentDay();
  // let cloneOf = [];
  // expiryIndices.forEach((expiryIndex) => {
  //   const indexNum = INDEX_INDICES?.[expiryIndex];
  //   cloneOf = [...Object.values(INDEX_DETAILS?.[indexNum]?.algos), ...cloneOf];
  // });
  // await deleteAlgos(prevDay);
  // await cloneAlgos(cloneOf, currentDay);

  // quantApi.addAlgos(data);
  return { expiryIndices, formattedDate };
};
