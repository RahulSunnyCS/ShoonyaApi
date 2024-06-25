const speakeasy = require("speakeasy");
const Api = require("./lib/RestApi");
const AutraData = require("./lib/autraData");
const WebSocket2 = require("ws");
let { SmartAPI, WebSocket, WebSocketV2 } = require("smartapi-javascript");

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
module.exports.loginShoonya = async () => {
  try {
    // Generate TOTP based on the secret
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

// module.exports.createws2Connection = async () => {
//   const totpToken = speakeasy.totp({
//     secret: process.env.AO_TWO_FA,
//     encoding: "base32",
//   });
//   const response = await smart_api.generateSession(
//     AO_USER_ID,
//     AO_PASSWORD,
//     totpToken
//   );
//   const payload = {
//     jwttoken: response.data.jwtToken,
//     apikey: AO_API_KEY,
//     clientcode: AO_USER_ID,
//     feedtype: response.data.feedToken,
//   };
//   let web_socket = new WebSocketV2(payload);
//   // for mode, action and exchangeTypes , can use values from constants file.
//   try {
//     const startTime = new Date();
//     let firstCount = 0;
//     let secondCount = 0;
//     await web_socket.connect();
//     let json_req = {
//       correlationID: "correlation_id",
//       action: 1,
//       mode: 2,
//       exchangeType: 5,
//       tokens: ["431310", "431243"],
//     };
//     web_socket.fetchData(json_req);
//     web_socket.on("tick", receiveTick);
//     function receiveTick(data) {
//       console.log("receiveTick:::::", new Date() - startTime, data.token, data.token === '431243' ? ++firstCount : ++secondCount);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

const clients = [];
const sumValues = [];
module.exports.authenticateAOApis = async (autraData) => {
  let { aoJwtToken } = autraData;
  if (aoJwtToken) {
    return autraData;
  }
  return await this.loginAngelOne(autraData);
};
module.exports.createws2Connection = async (autraData, reqData) => {
  const { aoJwtToken, aoFeedToken } = await this.authenticateAOApis(autraData);
  const payload = {
    jwttoken: aoJwtToken,
    apikey: process.env.AO_API_KEY,
    clientcode: process.env.AO_USER_ID,
    feedtype: aoFeedToken,
  };

  let web_socket = new WebSocketV2(payload);
  let ceValue = 0;
  let peValue = 0;

  try {
    let weightedRateOfChange = 0;
    let sumValue = 0;

    await web_socket.connect();
    let json_req = {
      correlationID: "correlation_id",
      action: 1,
      mode: 2,
      exchangeType: 5,
      tokens: ["432309", "432359"],
    };

    web_socket.fetchData(json_req);
    setInterval(() => {
      if (sumValues.length >= 10) {
        sumValues.shift();
      }
      sumValues.push(sumValue);
      weightedRateOfChange = calculateWeightedRateOfChange(sumValues);
      console.log(
        "weightedRateOfChangeTick::::::",
        weightedRateOfChange,
        sumValue
      );
    }, 10000);
    web_socket.on("tick", (data) => {
      if (data.token === "432309") {
        ceValue = Number(data.last_traded_price); // Assuming ltp is the latest price
      } else if (data.token === "432359") {
        peValue = Number(data.last_traded_price); // Assuming ltp is the latest price
      }

      sumValue = ceValue + peValue;
      broadcast({ sum: sumValue, weightedRateOfChange });
      // console.log("receiveTick:::::", new Date() - startTime, sumValue, peValue, ceValue);
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
