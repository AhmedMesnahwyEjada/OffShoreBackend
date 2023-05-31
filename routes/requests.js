const express = require("express");
const {
  capitalizeOnlyFirstChar,
  getNumberOfWorkingDays,
  reformatDate,
} = require("../shared/helperFunctions");
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const LocationRequest = require("../models/locationRequest");
const manager = require("../middleware/manager");
const WorkFromHomeRequest = require("../models/workFromHomeRequest");
const User = require("../models/user");
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
  const status = capitalizeOnlyFirstChar(req.query.status);
  const type = capitalizeOnlyFirstChar(req.query.type);
  var requests = [];
  if (!type || type == "Location") {
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
  if (!type || type == "Workfromhome") {
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
      r._doc.numberOfDays = getNumberOfWorkingDays(
        reformatDate(r.startDate),
        reformatDate(r.endDate)
      );
      delete r.userID;
    }
    requests = requests.concat(workFromHomeRequests);
  }
  return res.status(RequestCodes.OK).send(requests);
};
module.exports = router;
