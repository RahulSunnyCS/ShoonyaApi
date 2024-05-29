const axios = require("axios");
const { WEEK_DAYS, INDEX_DETAILS, INDEX_INDICES } = require("../constants");
const {
  getCurrentDay,
  getPreviousDay,
  getFormattedDate,
} = require("../helpers");
const QUANTIPLY_BASE_URL = "https://api.quantiply.tech/algos/";
const QUANTIPLY_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2M2FmMGQ3ODM5NjI1ZDI1ZGFmYmU3YmQiLCJuYW1lIjoiUmFodWwgU3VubnkgQyBTIiwiZW1haWwiOiJyYWh1bHN1bm55MTNAZ21haWwuY29tIiwibW9iaWxlIjoiODYwNjA1NDg4OCIsImlhdCI6MTcxNjM0NDE2MSwiZXhwIjoxNzE2Mzc2NTYxfQ.mkI5Wz_gQ1jumdeMyHnMh7SHFW3xCWXoETNJXIrrnfo";
const QUANTIPLY_ROUTES = {
  cloneAlgos: "bulk/action/clone",
  deleteAlgos: "bulk/action/delete",
  enableAlgos: "bulk/action/enable",
  dayWise: "day-wise",
};
const METHODS = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PUT: "PUT",
};
const ALGO_KEY = {
  ATM_SELL_1: "ATM_SELL_1",
  ATM_SELL_2: "ATM_SELL_2",
  ATM_SELL_3: "ATM_SELL_3",
  BUY: "ATM_BUY",
  OTM_SELL: "OTM_SELL",
};
const RISK_TYPES = {
  LOW_RISKS: "LOW_RISKS",
  MED_RISKS: "MED_RISKS",
  HIGH_RISKS: "HIGH_RISKS",
};
const RISKS = {
  [RISK_TYPES.LOW_RISKS]: [ALGO_KEY.OTM_SELL],
  [RISK_TYPES.MED_RISKS]: [ALGO_KEY.ATM_SELL_1, ALGO_KEY.ATM_SELL_2],
  [RISK_TYPES.HIGH_RISKS]: [
    ALGO_KEY.ATM_SELL_1,
    ALGO_KEY.ATM_SELL_2,
    ALGO_KEY.ATM_SELL_3,
    ALGO_KEY.BUY,
  ],
};
const headers = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-GB,en;q=0.9,ml;q=0.8",
  authorization: QUANTIPLY_TOKEN,
  "content-type": "application/json;charset=UTF-8",
  origin: "https://app.quantiply.tech",
  priority: "u=1, i",
  referer: "https://app.quantiply.tech/algos",
  "sec-ch-ua":
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

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

module.exports.QuantiplySession = function () {
  var self = this;
  self.headers = headers;
  self.routes = QUANTIPLY_ROUTES;
};

async function loginToBroker(brokerName = "finvasia", uid, password, factor2) {
  const url = `https://api.quantiply.tech/broker/${brokerName}/login/${uid}`;
  const data = { password, factor2 };
  return await fetch_request(METHODS.POST, url);
}

async function fetch_request(method = METHODS.GET, route, data) {
  let url = QUANTIPLY_BASE_URL + route;
  let result;
  try {
    const options = {
      method,
      url,
      data,
      headers,
    };
    result = await axios(options);
  } catch (error) {
    console.error(`[${method}]:${url} has failed due to error: ${error}`);
    return;
  }
  return result;
}

module.exports.cloneAlgos = async (cloneOf, day) => {
  const data = {
    cloneOf,
    day: [day],
    addText: "-dup",
    addTextType: "SUFFIX",
  };
  return await fetch_request(METHODS.PUT, QUANTIPLY_ROUTES.cloneAlgos, data);
};
const createPayloadForEnablingAlgos = async (api, riskType, retry = true) => {
  let algoIds = [];
  const currentDay = getCurrentDay();
  try {
    const dayWiseAlgos = await this.getDayWiseAlgos();
    const data = dayWiseAlgos?.data
      ?.find?.(({ day: dayVal }) => dayVal === currentDay)
      ?.algos?.filter?.((algo) => !algo.enabled);
    const requiredAlgoKeys = RISKS?.[riskType] || [];
    const result = [];
    requiredAlgoKeys.forEach((substring) => {
      for (const str of data) {
        if (str?.name?.includes(substring)) {
          result.push(str?._id);
          break; // Move to the next substring once the first match is found
        }
      }
    });
    if (result?.length === requiredAlgoKeys?.length) {
      return { algoIds: result };
    } else if (retry) {
      const expiryIndices = await getExpiryIndices(api);
      const currentDay = getCurrentDay();
      let cloneOf = [];
      expiryIndices.forEach((expiryIndex) => {
        const indexNum = INDEX_INDICES?.[expiryIndex];
        cloneOf = [
          ...Object.values(INDEX_DETAILS?.[indexNum]?.algos),
          ...cloneOf,
        ];
      });
      // await cloneAlgos(cloneOf, currentDay);
      await this.cloneAlgos(cloneOf, currentDay);
      await createPayloadForEnablingAlgos(riskType, false);
    } else {
      return { algoIds };
    }
  } catch (err) {
    return { algoIds };
  }
};
module.exports.enableAlgos = async (api, riskType = RISK_TYPES.MED_RISKS) => {
  const payLoad = await createPayloadForEnablingAlgos(api, riskType);
  return await fetch_request(
    METHODS.PUT,
    QUANTIPLY_ROUTES.enableAlgos,
    payLoad
  );
};

module.exports.deleteAlgos = async (day) => {
  if (day === WEEK_DAYS.SATURDAY) {
    return;
  }
  const { data: dayWiseAlgos = {} } = await this.getDayWiseAlgos(day);
  const data = dayWiseAlgos
    ?.find(({ day: dayVal }) => dayVal === day)
    ?.algos?.map((algos) => algos?._id);
  return data.length
    ? await fetch_request(METHODS.DELETE, QUANTIPLY_ROUTES.deleteAlgos, {
        algoIds: data,
      })
    : null;
};

module.exports.getDayWiseAlgos = async () =>
  await fetch_request(METHODS.GET, QUANTIPLY_ROUTES.dayWise);
