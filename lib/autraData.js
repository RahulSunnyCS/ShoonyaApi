const { INDEX_DETAILS, INDEX_INDICES } = require("../constants");

const AutraData = function () {
  const self = this;
  self.indexData = {};
  const createIndexToken = (atmValue, optionChain, lotDiff) => {
    const val = {};
    optionChain.forEach((option) => {
      const { ceToken, peToken } = option;
      if (`${atmValue}` == option.strprc) {
        val.atmCE = ceToken;
        val.atmPE = peToken;
      }
      if (`${atmValue + lotDiff}` == option.strprc) {
        val.nxtCE = ceToken;
        val.nxtPE = peToken;
      }
      if (`${atmValue - lotDiff}` == option.strprc) {
        val.prevCE = ceToken;
        val.prevPE = peToken;
      }
    });
    return val;
  };
  self.createIndicesTokens = (tokenData) => {
    // add logic
    tokenData?.forEach((token) => {
      const { index, atmValue, optionChain } = token;
      const lotDiff = INDEX_DETAILS[INDEX_INDICES[index]].lotDiff;
      self.indexData[index] = createIndexToken(atmValue, optionChain, lotDiff);
    });
    return self.indexData;
  };
  self.setSOLoginData = (response) => {
    const { jwtToken, feedToken, refreshToken } = response.data;
    self.aoJwtToken = jwtToken;
    self.aoFeedToken = feedToken;
    self.aoRefreshToken = refreshToken;
    return {
      aoJwtToken: jwtToken,
      aoFeedToken: feedToken,
      aoRefreshToken: refreshToken,
    };
  };
};
module.exports = AutraData;
