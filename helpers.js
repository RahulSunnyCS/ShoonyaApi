const { MONTHS_OF_YEAR, DAYS_OF_WEEK } = require("./constants");
module.exports.getPositions = async () => {
  try {
    const response = await api.get_positions();
  } catch (err) {}
};

module.exports.getCurrentDay = () => {
  const currentDate = new Date();
  const dayIndex = currentDate.getDay();
  const dayName = DAYS_OF_WEEK[dayIndex];
  return dayName;
};

module.exports.getPreviousDay = () => {
  const currentDate = new Date();
  const dayIndex = currentDate.getDay();
  //If current day is saturday, sunday and monday, then prevDay should be Friday
  const prevDayIndex =
    dayIndex === 0 || dayIndex === 1 || dayIndex === 6 ? 5 : dayIndex - 1;
  const dayName = DAYS_OF_WEEK[prevDayIndex];
  return dayName;
};

module.exports.getFormattedDate = () => {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = MONTHS_OF_YEAR[currentDate.getMonth()];
  return `${day.toString().padStart(2, "0")}${month}`;
};
