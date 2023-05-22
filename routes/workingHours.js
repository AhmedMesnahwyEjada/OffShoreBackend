const express = require("express");
const Joi = require("joi");
const moment = require("moment");
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const WorkingHours = require("../models/workingHours");
const User = require("../models/user");
const router = express.Router();

router.post(
  "/clockIn",
  auth,
  exceptionHandling(async (req, res) => {
    const {
      userToken: { _id: userID },
      location: { longitude, latitude },
    } = req.body;
    const { defaultLocation, remoteLocations } = await User.findOne({
      _id: userID,
    });

    const distanceFromDefaultLocation = distanceInKMBetweenTwoLocations(
      latitude,
      longitude,
      defaultLocation.latitude,
      defaultLocation.longitude
    );
    if (distanceFromDefaultLocation <= 0.5) {
      //working from office
      const nowTime = new Date(Date.now());
      const dayID = {
        year: nowTime.getUTCFullYear(),
        month: nowTime.getUTCMonth() + 1,
        day: nowTime.getUTCDate(),
        userID,
      };
      const workingDay = await WorkingHours.findOne({ id: dayID });
      if (!workingDay) {
        //first time
        const clockIns = [{ date: nowTime, location: defaultLocation }];
        const newWorkingDay = new WorkingHours({
          id: dayID,
          clockIns,
          totalWorkingHours: 0,
        });
        await newWorkingDay.save();
        return res.send("Clocked in successfully from the default location");
      }
      //not first clock in
      if (workingDay.clockIns.length > workingDay.clockOuts.length)
        return res.status(400).send("You are already clocked In");
      console.log("not first time");
      workingDay.clockIns.push({ date: nowTime, location: defaultLocation });
      await workingDay.save();
      return res.send("Clocked in successfully from the default location");
    }
    //working from home
    res.send("working from home");
  })
);

router.post(
  "/clockOut",
  auth,
  exceptionHandling((req, res) => {})
);
const distanceInKMBetweenTwoLocations = (lat1, lon1, lat2, lon2) => {
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
  const d = R * c; // Distance in km
  return d;
};
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};
const validateRequestBody = (user) => {
  const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return userSchema.validate(user);
};

module.exports = router;
