const AutraData = function () {
  const self = this;
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
