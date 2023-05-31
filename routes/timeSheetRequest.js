const express = require("express");
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const manager = require("../middleware/manager");
const User = require("../models/user");
const TimeSheetRequest = require("../models/timeSheetRequest");
const { RequestCodes, ErrorMessages } = require("../shared/constants");
const Joi = require("joi");
const router = express.Router();

router.post(
  "/",
  auth,
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestTimeSheet(req.body);
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send(requestError.details[0].message);
    const {
      userToken: { _id: userID },
      numberOfDays,
      projects,
    } = req.body;
    const { managerID } = await User.findById(userID);
    const timeSheetRequest = new TimeSheetRequest({
      userID,
      managerID,
      numberOfDays,
      projects,
    });
    await timeSheetRequest.save();
    return res.status(RequestCodes.OK).send(timeSheetRequest);
  })
);

router.post(
  "/approve/:timeSheetRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    return await changeRequestStatus(req, res, "Approved");
  })
);
router.post(
  "/reject/:timeSheetRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    return await changeRequestStatus(req, res, "Rejected");
  })
);
router.post(
  "/cancel/:timeSheetRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    return await changeRequestStatus(req, res, "Canceled");
  })
);
const changeRequestStatus = async (req, res, status) => {
  const timeSheetRequestID = req.params.timeSheetRequestID;
  const timeSheetRequest = await TimeSheetRequest.findById(timeSheetRequestID);
  if (!timeSheetRequest)
    return res.status(RequestCodes.NOT_FOUND).send({
      errors: { message: ErrorMessages.TIME_SHEET_REQUEST_NOT_FOUND },
    });
  const {
    userToken: { _id: managerID },
  } = req.body;
  if (timeSheetRequest.managerID != managerID)
    return res.status(RequestCodes.FORBIDDEN).send({
      errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
    });
  timeSheetRequest.status = status;
  await timeSheetRequest.save();
  return res.status(RequestCodes.OK).send(timeSheetRequest);
};
router.get(
  "/projects",
  auth,
  exceptionHandling(async (req, res) => {
    return res.status(RequestCodes.OK).send([
      {
        name: "project1",
        managerName: "Ahmed",
        managerNameArabic: "احمد",
        country: "Egypt",
        countryNameArabic: "مصر",
      },
      {
        name: "project2",
        managerName: "Moustafa",
        managerNameArabic: "مصطفى",
        country: "Egypt",
        countryNameArabic: "مصر",
      },
      {
        name: "project3",
        managerName: "Moustafa",
        managerNameArabic: "مصطفى",
        country: "Saudi",
        countryNameArabic: "السعودية",
      },
      {
        name: "project4",
        managerName: "Ahmed",
        managerNameArabic: "احمد",
        country: "Jordan",
        countryNameArabic: "الاردن",
      },
      {
        name: "project5",
        managerName: "Moustafa",
        managerNameArabic: "مصطفى",
        country: "India",
        countryNameArabic: "الهند",
      },
    ]);
  })
);

const validateRequestTimeSheet = (body) => {
  const timeSheetSchema = Joi.object({
    numberOfDays: Joi.number().required(),
    projects: Joi.array().min(1).required(),
    userToken: Joi.object(),
  });
  return timeSheetSchema.validate(body);
};
module.exports = router;
