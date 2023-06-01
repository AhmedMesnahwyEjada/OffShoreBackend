const express = require("express");
const {
  capitalizeOnlyFirstChar,
  getNumberOfWorkingDays,
} = require("../shared/helperFunctions");
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const LocationRequest = require("../models/locationRequest");
const manager = require("../middleware/manager");
const WorkFromHomeRequest = require("../models/workFromHomeRequest");
const User = require("../models/user");
const TimeSheetRequest = require("../models/timeSheetRequest");
const { RequestCodes, ErrorMessages } = require("../shared/constants");
const router = express.Router();

router.get(
  "/manager",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    return await getAllRequests("managerID", req, res);
  })
);

router.get(
  "/employee",
  auth,
  exceptionHandling(async (req, res) => {
    return await getAllRequests("userID", req, res);
  })
);

const getAllRequests = async (IDAttribute, req, res) => {
  const {
    userToken: { _id: userID },
  } = req.body;
  const status = getArrayOfParams(req.query.status);
  const type = getArrayOfParams(req.query.type);
  var requests = [];
  if (!type || type.includes("Location")) {
    var locationRequests = await LocationRequest.find({
      [IDAttribute]: userID,
      status: status ?? { $regex: /.*/ },
    });
    for (var r of locationRequests) {
      const user = await User.findById(r.userID);
      if (!user)
        return res.status(RequestCodes.BAD_REQUEST).send({
          errors: { message: ErrorMessages.THIS_USER_NO_LONGER_EXIST },
        });
      r._doc.firstName = user.firstName;
      r._doc.lastName = user.lastName;
      r._doc.arabicName = user.arabicName;
      r._doc.position = user.role;
      r._doc.positionArabic = user.roleArabic;
      r._doc.type = "location";
      delete r.userID;
    }
    requests = requests.concat(locationRequests);
  }
  if (!type || type.includes("Workfromhome")) {
    var workFromHomeRequests = await WorkFromHomeRequest.find({
      [IDAttribute]: userID,
      status: status ?? { $regex: /.*/ },
    });
    for (var r of workFromHomeRequests) {
      const user = await User.findById(r.userID);
      if (!user)
        return res.status(RequestCodes.BAD_REQUEST).send({
          errors: { message: ErrorMessages.THIS_USER_NO_LONGER_EXIST },
        });
      r._doc.firstName = user.firstName;
      r._doc.lastName = user.lastName;
      r._doc.arabicName = user.arabicName;
      r._doc.position = user.role;
      r._doc.type = "workFromHome";
      r._doc.positionArabic = user.roleArabic;
      r._doc.numberOfDays = getNumberOfWorkingDays(r.startDate, r.endDate);
      delete r.userID;
    }
    requests = requests.concat(workFromHomeRequests);
  }
  if (!type || type.includes("Timesheet")) {
    var timeSheetRequests = await TimeSheetRequest.find({
      [IDAttribute]: userID,
      status: status ?? { $regex: /.*/ },
    });
    for (var r of timeSheetRequests) {
      const user = await User.findById(r.userID);
      if (!user)
        return res.status(RequestCodes.BAD_REQUEST).send({
          errors: { message: ErrorMessages.THIS_USER_NO_LONGER_EXIST },
        });
      r._doc.firstName = user.firstName;
      r._doc.lastName = user.lastName;
      r._doc.arabicName = user.arabicName;
      r._doc.position = user.role;
      r._doc.type = "timeSheet";
      r._doc.positionArabic = user.roleArabic;
      delete r.userID;
    }
    requests = requests.concat(timeSheetRequests);
  }
  return res.status(RequestCodes.OK).send(requests);
};

const getArrayOfParams = (params) => {
  if (!params) return undefined;
  if (typeof params == "string") params = [params];
  var dummy = [];
  for (p of params) dummy.push(capitalizeOnlyFirstChar(p));
  return dummy;
};
module.exports = router;
