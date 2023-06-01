const express = require("express");
const Joi = require("joi");
const constants = require("../shared/constants");
const { RequestCodes, ErrorMessages } = constants;
const {
  isDateInArray,
  reformatDate,
  getNumberOfWorkingDays,
} = require("../shared/helperFunctions");
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const manager = require("../middleware/manager");
const WorkFromHomeRequest = require("../models/workFromHomeRequest");
const User = require("../models/user");
const router = express.Router();

router.post(
  "/",
  auth,
  exceptionHandling(async (req, res) => {
    var {
      userToken: { _id: userID },
      startDate,
      endDate,
    } = req.body;
    const { error: requestError } = validateWorkFromHomeRequest({
      startDate,
      endDate,
    });
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send(requestError.details[0].message);
    const { managerID } = await User.findById(userID);

    startDate = reformatDate(startDate);
    endDate = reformatDate(endDate);
    const workFromHomeRequest = new WorkFromHomeRequest({
      userID,
      managerID,
      startDate,
      endDate,
    });
    await workFromHomeRequest.save();
    res.status(RequestCodes.OK).send(workFromHomeRequest);
  })
);

router.put(
  "/:workFromHomeRequestID",
  auth,
  exceptionHandling(async (req, res) => {
    var {
      userToken: { _id: userID },
      startDate,
      endDate,
    } = req.body;
    const { error: requestError } = validateWorkFromHomeRequest({
      startDate,
      endDate,
    });
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send(requestError.details[0].message);
    startDate = reformatDate(startDate);
    endDate = reformatDate(endDate);
    const workFromHomeRequest = await WorkFromHomeRequest.findById(
      req.params.workFromHomeRequestID
    );
    if (!workFromHomeRequest)
      return res.status(RequestCodes.NOT_FOUND).send({
        errors: { message: ErrorMessages.WORK_FROM_HOME_REQUEST_NOT_FOUND },
      });
    if (workFromHomeRequest.userID != userID)
      return res.status(RequestCodes.FORBIDDEN).send({
        errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
      });
    if (workFromHomeRequest.status != "Pending")
      return res.status(RequestCodes.BAD_REQUEST).send({
        errors: { message: ErrorMessages.CANNOT_MODIFY_THIS_REQUEST },
      });
    workFromHomeRequest.startDate = startDate;
    workFromHomeRequest.endDate = endDate;
    await workFromHomeRequest.save();
    res.status(RequestCodes.OK).send(workFromHomeRequest);
  })
);

router.post(
  "/approve/:workFromHomeRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    const {
      userToken: { _id: managerID },
    } = req.body;
    const workFromHomeRequestID = req.params.workFromHomeRequestID;
    const workFromHomeRequest = await WorkFromHomeRequest.findById(
      workFromHomeRequestID
    );
    if (!workFromHomeRequest)
      return res.status(RequestCodes.NOT_FOUND).send({
        errors: { message: ErrorMessages.WORK_FROM_HOME_REQUEST_NOT_FOUND },
      });
    const {
      managerID: requestManagerID,
      userID,
      startDate,
      endDate,
    } = workFromHomeRequest;
    if (requestManagerID != managerID)
      return res.status(RequestCodes.FORBIDDEN).send({
        errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
      });
    const user = await User.findById(userID);

    for (var d = startDate; d <= endDate; d.setDate(d.getDate() + 1))
      if (!isDateInArray(user.workingFromHomeDays, d))
        user.workingFromHomeDays.push(new Date(d));
    workFromHomeRequest.status = "Approved";
    await workFromHomeRequest.save();
    await user.save();
    res.status(RequestCodes.OK).send(workFromHomeRequest);
  })
);
router.post(
  "/reject/:workFromHomeRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    const {
      userToken: { _id: managerID },
    } = req.body;
    const workFromHomeRequestID = req.params.workFromHomeRequestID;
    const workFromHomeRequest = await WorkFromHomeRequest.findById(
      workFromHomeRequestID
    );
    if (!workFromHomeRequest)
      return res.status(RequestCodes.NOT_FOUND).send({
        errors: { message: ErrorMessages.WORK_FROM_HOME_REQUEST_NOT_FOUND },
      });
    if (workFromHomeRequest.managerID != managerID)
      return res.status(RequestCodes.FORBIDDEN).send({
        errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
      });
    workFromHomeRequest.status = "Rejected";
    await workFromHomeRequest.save();
    res.status(RequestCodes.OK).send(workFromHomeRequest);
  })
);
router.post(
  "/cancel/:workFromHomeRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    const {
      userToken: { _id: managerID },
    } = req.body;
    const workFromHomeRequestID = req.params.workFromHomeRequestID;
    const workFromHomeRequest = await WorkFromHomeRequest.findById(
      workFromHomeRequestID
    );
    if (!workFromHomeRequest)
      return res.status(RequestCodes.NOT_FOUND).send({
        errors: { message: ErrorMessages.WORK_FROM_HOME_REQUEST_NOT_FOUND },
      });
    if (workFromHomeRequest.managerID != managerID)
      return res.status(RequestCodes.FORBIDDEN).send({
        errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
      });
    workFromHomeRequest.status = "Canceled";
    await workFromHomeRequest.save();
    res.status(RequestCodes.OK).send(workFromHomeRequest);
  })
);
router.post(
  "/numberOfDays",
  exceptionHandling((req, res) => {
    validateWorkFromHomeRequest(req.body);
    const { startDate, endDate } = req.body;
    const numberOfWorkingDays = getNumberOfWorkingDays(
      reformatDate(startDate),
      reformatDate(endDate)
    );
    res.status(RequestCodes.OK).send({ numberOfWorkingDays });
  })
);
const validateWorkFromHomeRequest = (request) => {
  const requestSchema = Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().required().min(Joi.ref("startDate")),
  });
  return requestSchema.validate(request);
};

module.exports = router;
