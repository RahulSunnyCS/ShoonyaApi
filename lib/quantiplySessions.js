var NorenRestApi = function (params) {
  var self = this;
  self.__quantiplyAlgos = {
    atmSell1: [],
    atmSell2: [],
    atmSell3: [],
    buy: [],
    otmSell: [],
  };
  self.addAlgos = function (algos = []) {
    algos?.forEach((algo) => {
      if (algo?.name?.includes("ATM_BUY")) {
        self.__quantiplyAlgos?.buy?.push(algo._id);
      }
      if (algo?.name?.includes("ATM_SELL_1")) {
        self.__quantiplyAlgos?.atmSell1?.push(algo._id);
      }
      if (algo?.name?.includes("ATM_SELL_2")) {
        self.__quantiplyAlgos?.atmSell2?.push(algo._id);
      }
      if (algo?.name?.includes("ATM_SELL_3")) {
        self.__quantiplyAlgos?.atmSell3?.push(algo._id);
      }
      if (algo?.name?.includes("OTM_SELL")) {
        self.__quantiplyAlgos?.otmSell?.push(algo._id);
      }
    });
    self.__quantiplyAlgos.atmSell1 = [
      ...new Set(self.__quantiplyAlgos.atmSell1),
    ];
    self.__quantiplyAlgos.atmSell2 = [
      ...new Set(self.__quantiplyAlgos.atmSell2),
    ];
    self.__quantiplyAlgos.atmSell3 = [
      ...new Set(self.__quantiplyAlgos.atmSell3),
    ];
    self.__quantiplyAlgos.otmSell = [...new Set(self.__quantiplyAlgos.otmSell)];
    self.__quantiplyAlgos.buy = [...new Set(self.__quantiplyAlgos.buy)];
    return self.__quantiplyAlgos;
  };
};
module.exports = NorenRestApi;
