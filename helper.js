const speakeasy = require("speakeasy");
const Api = require("./lib/RestApi");
const WebSocket2 = require("ws");
let { SmartAPI, WebSocket, WebSocketV2 } = require("smartapi-javascript");
const { getATMValue } = require("./lib/shoonyaHelpers");

const {
  FV_USER_ID,
  FV_PASSWORD,
  FV_API_SECRET,
  FV_VENDOR_CODE,
  FV_IMEI,
  AO_USER_ID,
  AO_PASSWORD,
  AO_API_SECRET,
  AO_API_KEY,
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
  api_key: AO_API_KEY,
});
module.exports.loginShoonya = async (api) => {
  try {
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
    };
  } catch (err) {
    console.error("login to Shoonya failed", err);
  }
};
module.exports.loginAngelOne = async (autraData) => {
  try {
    // Generate TOTP based on the secret
    const totpToken = speakeasy.totp({
      secret: process.env.AO_TWO_FA,
      encoding: "base32",
    });
    const response = await smart_api.generateSession(
      AO_USER_ID,
      AO_PASSWORD,
      totpToken
    );
    const soAuthData = autraData.setSOLoginData(response);
    return soAuthData;
  } catch (err) {
    console.error("login to Angel One failed", err);
  }
};

const clients = [];
const sumValues = [];
const derivativeSumValues = [];
module.exports.authenticateAOApis = async (autraData) => {
  let { aoJwtToken } = autraData;
  if (aoJwtToken) {
    return autraData;
  }
  return await this.loginAngelOne(autraData);
};
module.exports.createws2Connection = async (autraData, api) => {
  const { aoJwtToken, aoFeedToken } = await this.authenticateAOApis(autraData);
  const payload = {
    jwttoken: aoJwtToken,
    apikey: process.env.AO_API_KEY,
    clientcode: process.env.AO_USER_ID,
    feedtype: aoFeedToken,
  };
  const tokenData = autraData.indexData["BANKNIFTY"];
  let web_socket = new WebSocketV2(payload);
  let atmceValue = 0;
  let atmpeValue = 0;
  let nxtceValue = 0;
  let nxtpeValue = 0;
  let prevceValue = 0;
  let prevpeValue =0;
  let atmSumValue = 0, otmSumValue = 0, itmSumValue = 0, totalSum = 0;
  try {
    let weightedRateOfChange = 0;
    const tokenArray = Object.values(tokenData);

    await web_socket.connect();
    let json_req = {
      correlationID: "banknifty",
      action: 1,
      mode: 2,
      exchangeType: 2,
      tokens:tokenArray,
    };

    web_socket.fetchData(json_req);
    setInterval(() => {
      if (sumValues.length >= 10) {
        sumValues.shift();
      }
      sumValues.push(totalSum);
      weightedRateOfChange = calculateWeightedRateOfChange(sumValues);
      console.log(
        "weightedRateOfChangeTick::::::",
        weightedRateOfChange,
        totalSum
      );
    }, 10000);
    setInterval(async ()=>{
      const atmValue  = await getATMValue(api, "BANKNIFTY")
    },30000)
    web_socket.on("tick", (data) => {
      if (data.token === tokenData.atmCE) {
        atmceValue = Number(data.last_traded_price);
        atmSumValue = atmceValue + atmpeValue; 
      } else if (data.token === tokenData.atmPE) {
        atmpeValue = Number(data.last_traded_price);
        atmSumValue = atmceValue + atmpeValue;
      }
      if (data.token === tokenData.nxtCE) {
        nxtceValue = Number(data.last_traded_price);
        otmSumValue = nxtceValue + prevpeValue;
      } else if (data.token === tokenData.atmPE) {
        nxtpeValue = Number(data.last_traded_price);
        itmSumValue = prevceValue + nxtpeValue;
      }
      if (data.token === tokenData.atmCE) {
        prevceValue = Number(data.last_traded_price);
        itmSumValue = prevceValue + nxtpeValue; 
      } else if (data.token === tokenData.atmPE) {
        prevpeValue = Number(data.last_traded_price); 
        otmSumValue = nxtceValue + prevpeValue;
      }
      totalSum = atmSumValue + otmSumValue + itmSumValue;
      broadcast({ atmSum: atmSumValue,otmSumValue, itmSumValue, weightedRateOfChange });
      // console.log("receiveTick:::::", atmSumValue, otmSumValue, itmSumValue, totalSum);
    });
  } catch (err) {
    console.log(err);
  }
};

const calculateWeightedRateOfChange = (values) => {
  if (values.length < 2) return 0;

  let weightedSum = 0;
  let weightSum = 0;
  const alpha = 2 / (values.length + 1);

  for (let i = 1; i < values.length; i++) {
    const weight = Math.pow(1 - alpha, values.length - i);
    weightedSum += (values[i] - values[i - 1]) * weight;
    weightSum += weight;
  }

  return Math.round(weightedSum / weightSum, 1);
};

const broadcast = (data) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Create a WebSocket server to communicate with frontend clients
const wss = new WebSocket2.Server({ port: 8080 });

wss.on("connection", (ws) => {
  clients.push(ws);

  ws.on("close", () => {
    clients.splice(clients.indexOf(ws), 1);
  });
});

module.exports.getPositions = async () => {
  try {
    const response = await api.get_positions();
    console.log("getPosition response", response);
  } catch (err) {
    console.log("error in getPosition", err);
  }
};
