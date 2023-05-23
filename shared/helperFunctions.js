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
};
