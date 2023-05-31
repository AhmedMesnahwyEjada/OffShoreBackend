var moment = require("moment-timezone");
var ts = require("@mapbox/timespace");
module.exports = {
  isTwoLocationsClose: (lat1, lon1, lat2, lon2, maxDistanceBetween = 0.5) => {
    const deg2rad = (deg) => {
      return deg * (Math.PI / 180);
    };
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d <= maxDistanceBetween;
  },
  capitalizeOnlyFirstChar: (word) => {
    if (!word) return undefined;
    word = word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  },
  isDateInArray: (array, newDate) => {
    for (date of array)
      if (
        date.getDate() === newDate.getDate() &&
        date.getMonth() === newDate.getMonth() &&
        date.getYear() === newDate.getYear()
      )
        return true;
    return false;
  },
  reformatDate: (date) => {
    date = new Date(new Date(date).setUTCHours(0));
    date = new Date(date.setDate(date.getDate() + 1));
    return date;
  },
  changeTimeZoneToLocation: (location, nowTime) => {
    const timeStamp = ts.getFuzzyLocalTimeFromPoint(nowTime, location);
    return timeStamp.format("HH:mm");
  },
  getNumberOfWorkingDays: (startDate, endDate, vacationDays = [5, 6]) => {
    var numberOfDays = 0;
    for (var d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1))
      if (!vacationDays.includes(d.getUTCDay())) numberOfDays++;
    return numberOfDays;
  },
};
