const express = require("express");
const Joi = require("joi");
const constants = require("../shared/constants");
const { RequestCodes, ErrorMessages } = constants;
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
    const {
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
    const workFromHomeRequest = new WorkFromHomeRequest({
      userID,
      managerID,
      startDate,
      endDate,
    });
    await workFromHomeRequest.save();
    res.send(workFromHomeRequest);
  })
);

router.post(
  "/accept/:workFromHomeRequestID",
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
      return res
        .status(RequestCodes.NOT_FOUND)
        .send(ErrorMessages.WORK_FROM_HOME_REQUEST_NOT_FOUND);
    const {
      managerID: requestManagerID,
      userID,
      startDate,
      endDate,
    } = workFromHomeRequest;
    if (requestManagerID != managerID)
      return res
        .status(RequestCodes.FORBIDDEN)
        .send(ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST);
    const user = await User.findById(userID);
    
    for (var d = startDate; d <= endDate; d.setDate(d.getDate() + 1))
      if (user.workingFromHomeDays.indexOf(d) === -1)
        user.workingFromHomeDays.push(new Date(d));
    workFromHomeRequest.status = "Approved";
    await workFromHomeRequest.save();
    await user.save();
    res.send(workFromHomeRequest);
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
      return res
        .status(RequestCodes.NOT_FOUND)
        .send(ErrorMessages.WORK_FROM_HOME_REQUEST_NOT_FOUND);
    if (workFromHomeRequest.managerID !== managerID)
      return res
        .status(RequestCodes.FORBIDDEN)
        .send(ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST);
    workFromHomeRequest.status = "Rejected";
    await workFromHomeRequest.save();
    res.send(workFromHomeRequest);
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
