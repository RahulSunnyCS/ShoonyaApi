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
}
module.exports.getATMValue = async (api,index) => {
  const {id: token, exch, lotDiff} = INDEX_DETAILS?.[INDEX_INDICES?.[index]];
  const quote = await api.get_quotes(exch, token);
  const atmValue = this.getATMValueFromLTP(quote?.lp, lotDiff)
  return atmValue;
};
module.exports.init = async (api) => {
  await login(api);
  const formattedDate = getFormattedDate();
  
  let optionChain = [];
  let priceDetails = [];
  const expiryIndices = await getExpiryIndices(api);
  for(const expiryIndex of expiryIndices){
    const atmValue = await this.getATMValue(api ,expiryIndex);
    const {optExch} = INDEX_DETAILS?.[INDEX_INDICES?.[expiryIndex]];
    const optionChain = await api.get_option_chain(optExch,`${expiryIndex}${formattedDate}24C${atmValue}`,`${atmValue}`,'16');
    priceDetails.push({
      expiryIndex,
      priceDetails: optionChain,
    })
  } 
  const prevDay = getPreviousDay();
  const currentDay = getCurrentDay();
  let cloneOf = [];
  expiryIndices.forEach((expiryIndex) => {
    const indexNum = INDEX_INDICES?.[expiryIndex];
    cloneOf = [...Object.values(INDEX_DETAILS?.[indexNum]?.algos), ...cloneOf];
  });
  await deleteAlgos(prevDay);
  await cloneAlgos(cloneOf, currentDay);
  return { formattedDate, expiryIndices, optionChain, priceDetails };
};
