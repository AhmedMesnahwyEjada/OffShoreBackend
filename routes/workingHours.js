const express = require("express");
const Joi = require("joi");
const constants = require("../shared/constants");
const {
  isTwoLocationsClose,
  changeTimeZoneToLocation,
  isDateInArray,
} = require("../shared/helperFunctions");
const { ErrorMessages, RequestCodes } = constants;
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const WorkingHours = require("../models/workingHours");
const User = require("../models/user");
const manager = require("../middleware/manager");
const router = express.Router();

router.post(
  "/clockIn",
  auth,
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body.location);
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send({ errors: { message: requestError.details[0].message } });
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
    const hasWorkFromHomeApproval = isDateInArray(workingFromHomeDays, nowTime);
    for (const [locationIndex, workLocation] of remoteLocations.entries()) {
      isApprovedLocation = isTwoLocationsClose(
        latitude,
        longitude,
        workLocation.latitude,
        workLocation.longitude
      );
      if (
        getIfUserClockedIn(workingDay) ||
        ((!locationIndex || (locationIndex && hasWorkFromHomeApproval)) &&
          isApprovedLocation)
      )
        if (!workingDay)
          return await clockIn(
            new WorkingHours({ id: dayID }),
            workLocation,
            isApprovedLocation,
            nowTime,
            res
          );
        else
          return await clockIn(
            workingDay,
            workLocation,
            isApprovedLocation,
            nowTime,
            res
          );
    }
    return res.status(RequestCodes.BAD_REQUEST).send({
      errors: { message: ErrorMessages.CANNOT_WORK_FROM_THIS_LOCATION },
    });
  })
);
const clockIn = async (
  workingDay,
  clockInLocation,
  isApprovedLocation,
  nowTime,
  res
) => {
  workingDay.clockIns.push({
    dateTime: nowTime,
    location: clockInLocation,
    isApprovedLocation,
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
router.get(
  "/clockIns",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    const {
      userToken: { _id: managerID },
    } = req.body;
    const { day, month, year } = req.query;
    const users = await User.find({ managerID });
    const ids = users.map((user) => user._id);
    const clockIns = (
      await WorkingHours.find({
        "id.userID": { $in: ids },
        "id.day": day ?? { $gt: 0 },
        "id.month": month ?? { $gt: 0 },
        "id.year": year ?? { $gt: 0 },
      })
    ).map(({ clockIns, id }) => {
      return { id, clockIns };
    });
    for (let clockIn of clockIns)
      for (const user of users)
        if (user._id.equals(clockIn.id.userID)) {
          const {
            _id,
            password,
            defaultLocation,
            workingFromHomeDays,
            managerID,
            remoteLocations,
            __v,
            ...userData
          } = user._doc;
          clockIn.userData = userData;
        }

    return res.status(RequestCodes.OK).send(clockIns);
  })
);
router.post(
  "/clockOut",
  auth,
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body.location);
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send({ errors: { message: requestError.details[0].message } });
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
    if (!getIfUserClockedIn(todayWorkingDay))
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send({ errors: { message: ErrorMessages.NOT_CLOCKED_IN } });
    return await clockOut(todayWorkingDay, location, nowTime, res);
  })
);
const clockOut = async (workingDay, clockOutLocation, nowTime, res) => {
  const firstClockIn = getFirstClockIn(workingDay);
  const clockInLocation = firstClockIn.location;
  if (
    !isTwoLocationsClose(
      clockInLocation.latitude,
      clockInLocation.longitude,
      clockOutLocation.latitude,
      clockOutLocation.longitude,
      0.5
    )
  )
    return res.status(RequestCodes.BAD_REQUEST).send({
      errors: { message: ErrorMessages.CLOCKING_OUT_FROM_DIFFERENT_LOCATION },
    });
  const clockInTime = firstClockIn.dateTime;
  const totalWorkingHours =
    (nowTime.getTime() - clockInTime.getTime()) /
    constants.MILLIE_SECONDS_IN_HOUR;
  if (totalWorkingHours > constants.DAILY_WORKING_HOURS_LIMIT)
    return res
      .status(RequestCodes.BAD_REQUEST)
      .send({ errors: { message: ErrorMessages.NOT_CLOCKED_IN } });
  workingDay.clockOuts.push({
    dateTime: nowTime,
    location: clockOutLocation,
    lastClockInIndex: workingDay.clockIns.length - 1,
  });
  workingDay.totalWorkingHours =
    totalWorkingHours + workingDay.totalWorkingHours;
  await workingDay.save();
  return res.status(RequestCodes.OK).send(workingDay);
};
router.get(
  "/info",
  auth,
  exceptionHandling(async (req, res) => {
    const {
      userToken: { _id: userID },
    } = req.body;
    const nowTime = new Date(Date.now());
    const dayID = {
      year: nowTime.getUTCFullYear(),
      month: nowTime.getUTCMonth() + 1,
      day: nowTime.getUTCDate(),
      userID,
    };
    const workingDay = await WorkingHours.findOne({ id: dayID });
    if (!workingDay)
      return res.status(RequestCodes.OK).send({
        totalWorkingHours: 0,
        checkedIn: false,
        firstCheckInTime: NaN,
      });
    const checkedIn = getIfUserClockedIn(workingDay);
    var totalWorkingHours = 0;
    if (!checkedIn) totalWorkingHours = workingDay?.totalWorkingHours || 0;
    else {
      const firstClockInTime = getFirstClockIn(workingDay).dateTime;
      totalWorkingHours =
        workingDay.totalWorkingHours +
        (nowTime.getTime() - firstClockInTime.getTime()) /
          constants.MILLIE_SECONDS_IN_HOUR;
    }
    const firstClockIn = workingDay.clockIns[0];
    const firstCheckInTime = changeTimeZoneToLocation(
      [firstClockIn.location.longitude, firstClockIn.location.latitude],
      firstClockIn.dateTime
    );
    return res
      .status(RequestCodes.OK)
      .send({ totalWorkingHours, checkedIn, firstCheckInTime });
  })
);

const getFirstClockIn = (workingDay) => {
  if (!workingDay.clockOuts.length) return workingDay.clockIns[0];
  return workingDay.clockIns[
    workingDay.clockOuts.slice(-1)[0].lastClockInIndex + 1
  ];
};
const getIfUserClockedIn = (workingDay) => {
  if (!workingDay) return false;
  if (!workingDay.clockOuts.length && workingDay.clockIns.length) return true;
  if (
    workingDay.clockOuts.slice(-1)[0].lastClockInIndex + 1 <
    workingDay.clockIns.length
  )
    return true;
  return false;
};
const validateRequestBody = (body) => {
  const bodySchema = Joi.object({
    longitude: Joi.number().required(),
    latitude: Joi.number().required(),
  });
  return bodySchema.validate(body);
};

module.exports = router;
