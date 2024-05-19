const axios = require("axios");
const { WEEK_DAYS } = require("../constants");
const QUANTIPLY_BASE_URL = "https://api.quantiply.tech/algos/";
const QUANTIPLY_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2M2FmMGQ3ODM5NjI1ZDI1ZGFmYmU3YmQiLCJuYW1lIjoiUmFodWwgU3VubnkgQyBTIiwiZW1haWwiOiJyYWh1bHN1bm55MTNAZ21haWwuY29tIiwibW9iaWxlIjoiODYwNjA1NDg4OCIsImlhdCI6MTcxNjEyMTU5MCwiZXhwIjoxNzE2MTUzOTkwfQ.H5uMoghkJjqTFQpPj3OAHf22fThWpgkMvt8zeD0QK7Q";
const QUANTIPLY_ROUTES = {
  cloneAlgos: "bulk/action/clone",
  deleteAlgos: "bulk/action/delete",
  dayWise: "day-wise",
};
const METHODS = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PUT: "PUT",
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

module.exports.cloneAlgos = async (
  cloneOf = ["663dc41ff4fcc13a992631d0"],
  day = ["MON"]
) => {
  const data = {
    cloneOf,
    day,
    addText: "dup",
    addTextType: "SUFFIX",
  };
  return await fetch_request(METHODS.PUT, QUANTIPLY_ROUTES.cloneAlgos, data);
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
