module.exports.API = {
  endpoint: "https://api.shoonya.com/NorenWClientTP",
  websocket: "wss://api.shoonya.com/NorenWSTP/",
  eodhost: "https://shoonya.finvasia.com/chartApi/getdata/",
  debug: false,
  timeout: 7000,
};

//  optionChain = optionChain.reduce((acc, curr) => {
//   const index = acc.findIndex((obj) => obj.strprc === curr.strprc);
//   if (index > -1) {
//     if (curr.optt === "CE") {
//       acc[index].ceToken = curr.token;
//     } else if (curr.optt === "PE") {
//       acc[index].peToken = curr.token;
//     }
//   } else {
//     acc.push(curr);
//   }
//   return acc;
// });
