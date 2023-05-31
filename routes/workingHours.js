const express = require("express");
const Joi = require("joi");
const constants = require("../shared/constants");
const {
  isTwoLocationsClose,
  changeTimeZoneToLocation,
} = require("../shared/helperFunctions");
const { ErrorMessages, RequestCodes } = constants;
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const WorkingHours = require("../models/workingHours");
const User = require("../models/user");
const router = express.Router();

router.post(
  "/clockIn",
  auth,
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body.location);
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send(requestError.details[0].message);
    const {
      userToken: { _id: userID },
      location: { longitude, latitude },
    } = req.body;
    var { defaultLocation, remoteLocations, workingFromHomeDays } =
      await User.findOne({
        _id: userID,
      });
    remoteLocations = [...remoteLocations];
    remoteLocations.unshift({
      longitude: defaultLocation.longitude,
      latitude: defaultLocation.latitude,
    });
    const nowTime = new Date(Date.now());
    const dayID = {
      year: nowTime.getUTCFullYear(),
      month: nowTime.getUTCMonth() + 1,
      day: nowTime.getUTCDate(),
      userID,
    };
    const workingDay = await WorkingHours.findOne({ id: dayID });
    const hasWorkFromHomeApproval = true;
    for (const [locationIndex, workLocation] of remoteLocations.entries()) {
      if (
        (!locationIndex || (locationIndex && hasWorkFromHomeApproval)) &&
        isTwoLocationsClose(
          latitude,
          longitude,
          workLocation.latitude,
          workLocation.longitude
        )
      )
        if (!workingDay)
          return await clockIn(
            new WorkingHours({ id: dayID }),
            workLocation,
            locationIndex,
            nowTime,
            res
          );
        else if (workingDay.clockIns.length > workingDay.clockOuts.length)
          return res
            .status(RequestCodes.BAD_REQUEST)
            .send({ errors: { message: ErrorMessages.ALREADY_CLOCKED_IN } });
        else
          return await clockIn(
            workingDay,
            workLocation,
            locationIndex,
            nowTime,
            res
          );
    }
    return res
      .status(RequestCodes.BAD_REQUEST)
      .send({
        errors: { message: ErrorMessages.CANNOT_WORK_FROM_THIS_LOCATION },
      });
  })
);
const clockIn = async (
  workingDay,
  clockInLocation,
  locationIndex,
  nowTime,
  res
) => {
  workingDay.clockIns.push({
    dateTime: nowTime,
    location: clockInLocation,
  });
  await workingDay.save();
  const nowTimeUser = changeTimeZoneToLocation(
    [clockInLocation.longitude, clockInLocation.latitude],
    nowTime
  );
  return res.status(RequestCodes.OK).send({
    totalWorkingHours: workingDay.totalWorkingHours,
    nowTime: nowTimeUser,
  });
};
router.post(
  "/clockOut",
  auth,
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body.location);
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send(requestError.details[0].message);
    const {
      userToken: { _id: userID },
      location,
    } = req.body;
    const nowTime = new Date(Date.now());
    const dayID = {
      year: nowTime.getUTCFullYear(),
      month: nowTime.getUTCMonth() + 1,
      day: nowTime.getUTCDate(),
      userID,
    };
    const todayWorkingDay = await WorkingHours.findOne({ id: dayID });
    if (!todayWorkingDay) {
      dayID.day = dayID.day - 1;
      const yesterdayWorkingDay = await WorkingHours.findOne({ id: dayID });
      return await clockOut(yesterdayWorkingDay, location, nowTime, res);
    }
    return await clockOut(todayWorkingDay, location, nowTime, res);
  })
);
const clockOut = async (workingDay, clockOutLocation, nowTime, res) => {
  if (!workingDay || workingDay.clockIns.length === workingDay.clockOuts.length)
    return res
      .status(RequestCodes.BAD_REQUEST)
      .send({ errors: { message: ErrorMessages.NOT_CLOCKED_IN } });
  const clockInLocation = workingDay.clockIns.slice(-1)[0].location;
  if (
    !isTwoLocationsClose(
      clockInLocation.latitude,
      clockInLocation.longitude,
      clockOutLocation.latitude,
      clockOutLocation.longitude,
      0.5
    )
  )
    return res
      .status(RequestCodes.BAD_REQUEST)
      .send({
        errors: { message: ErrorMessages.CLOCKING_OUT_FROM_DIFFERENT_LOCATION },
      });
  const clockInTime = workingDay.clockIns.slice(-1)[0].dateTime;
  const totalWorkingHours =
    (nowTime.getTime() - clockInTime.getTime()) /
    constants.MILLIE_SECONDS_IN_HOUR;
  if (totalWorkingHours > constants.DAILY_WORKING_HOURS_LIMIT)
    return res
      .status(RequestCodes.BAD_REQUEST)
      .send({ errors: { message: ErrorMessages.NOT_CLOCKED_IN } });
  workingDay.clockOuts.push({ dateTime: nowTime, location: clockOutLocation });
  workingDay.totalWorkingHours =
    totalWorkingHours + workingDay.totalWorkingHours;
  await workingDay.save();
  return res.status(RequestCodes.OK).send(workingDay);
};
const validateRequestBody = (body) => {
  const bodySchema = Joi.object({
    longitude: Joi.number().required(),
    latitude: Joi.number().required(),
  });
  return bodySchema.validate(body);
};

module.exports = router;
