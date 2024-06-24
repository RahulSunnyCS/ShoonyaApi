const speakeasy = require("speakeasy");
const { MONTHS_OF_YEAR, DAYS_OF_WEEK } = require("./constants");
module.exports.getPositions = async () => {
  try {
    const response = await api.get_positions();
  } catch (err) {}
};

module.exports.getDayIndex  = () => new Date().getDay();

module.exports.getCurrentDay = () => {
  const dayIndex = this.getDayIndex();
  const dayName = DAYS_OF_WEEK[dayIndex];
  return dayName;
};

module.exports.getPreviousDay = () => {
  const dayIndex = this.getDayIndex();
  //If current day is saturday, sunday and monday, then prevDay should be Friday
  const prevDayIndex =
    dayIndex === 0 || dayIndex === 1 || dayIndex === 6 ? 5 : dayIndex - 1;
  const dayName = DAYS_OF_WEEK[prevDayIndex];
  return dayName;
};

module.exports.getFormattedDate = () => {
  const currentDate = new Date();
  const day = this.getDayIndex();
  const month = MONTHS_OF_YEAR[currentDate.getMonth()];
  return `${day.toString().padStart(2, "0")}${month}`;
};

module.exports.getFormattedDateWithYear = () => {
  const formattedDate = this.getFormattedDate();
  const currentDate = new Date();
  const year = currentDate.getFullYear() % 100;
  return `${formattedDate}${year}`;
};

module.exports.getTotp = (secretKey) => {
  const totpToken = speakeasy.totp({
    secret: secretKey,
    encoding: "base32",
  });
  return totpToken;
};
