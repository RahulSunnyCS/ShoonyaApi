let { getAuthparams } = require("../cred");
let { INDEX_DETAILS, INDEX_INDICES } = require("../constants");
const {
  getFormattedDate,
  getPreviousDay,
  getCurrentDay,
  getFormattedDateWithYear,
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
/**
 * Retrieves the expiry indices for a given day.
 *
 * @param {Object} api - The API object give access to Shoonya API methods and properties.
 * @return {Promise<Array<string>>} - A promise that resolves to an array of expiry indices.
 */
async function getExpiryIndices(api) {
  const formattedDate = getFormattedDate();
  const expiryIndices = [];
  try {
    const promises = INDEX_DETAILS.map(async (index) => {
      const { key, optExch } = index;
      try {
        const response = await api.searchscrip(optExch, key);
        const { values = [] } = response || {};
        if (values.some(({ tsym }) => tsym?.includes?.(formattedDate))) {
          expiryIndices.push(key);
        }
      } catch (error) {
        console.error(`error searching for scrip ${key}`, error);
      }
    });
    await Promise.all(promises);
    return expiryIndices;
  } catch (error) {
    console.error("error in getExpiryIndices", error);
    return expiryIndices;
  }
}
module.exports.getATMValueFromLTP = (ltp, multiple = 100) => {
  // Calculate the nearest multiples both below and above the value
  let lowerMultiple = Math.floor(ltp / multiple) * multiple;
  let upperMultiple = Math.ceil(ltp / multiple) * multiple;

  // Determine which multiple is closer to the value
  if (Math.abs(ltp - lowerMultiple) < Math.abs(ltp - upperMultiple)) {
    return lowerMultiple;
  } else {
    return upperMultiple;
  }
};
module.exports.getATMValue = async (api, index) => {
  const { id: token, exch, lotDiff } = INDEX_DETAILS?.[INDEX_INDICES?.[index]];
  const quote = await api.get_quotes(exch, token);
  const atmValue = this.getATMValueFromLTP(quote?.lp, lotDiff);
  return atmValue;
};
module.exports.init = async (api) => {
  await login(api);
  const formattedDateWithYear = getFormattedDateWithYear();
  let optionChainDetails = [];
  const expiryIndices = await getExpiryIndices(api);
  for (const expiryIndex of expiryIndices) {
    const atmValue = await this.getATMValue(api, expiryIndex);
    const { optExch } = INDEX_DETAILS?.[INDEX_INDICES?.[expiryIndex]];
    const { stat, values } = await api.get_option_chain(
      optExch,
      `${expiryIndex}${formattedDateWithYear}C${atmValue}`,
      `${atmValue}`,
      "16"
    );
    let optionChain = [];
    if (stat === "Ok") {
      optionChain = values?.map(({ token, optt, strprc }) => ({
        token,
        optt,
        strprc: strprc.slice(0, -3),
      }));
      optionChain = optionChain.reduce((acc, curr) => {
        const index = acc.findIndex((obj) => obj.strprc === curr.strprc);
        if (index > -1) {
          if (curr.optt === "CE") {
            acc[index].ceToken = curr.token;
          } else if (curr.optt === "PE") {
            acc[index].peToken = curr.token;
          }
        } else {
          const { strprc, optt, token } = curr;
          const ceToken = optt === "CE" ? token : null;
          const peToken = optt === "PE" ? token : null;
          acc.push({ strprc, ceToken, peToken });
        }
        return acc;
      }, []);
      optionChain = optionChain.sort((a, b) => a.strprc - b.strprc);
    }
    return { optionChain, index: expiryIndex, atmValue };
  }
};
module.exports.initializeQuantiply = async (expiryIndices) => {
  const prevDay = getPreviousDay();
  const currentDay = getCurrentDay();
  let cloneOf = [];
  expiryIndices.forEach((expiryIndex) => {
    const indexNum = INDEX_INDICES?.[expiryIndex];
    cloneOf = [...Object.values(INDEX_DETAILS?.[indexNum]?.algos), ...cloneOf];
  });
  await deleteAlgos(prevDay);
  await cloneAlgos(cloneOf, currentDay);
};
