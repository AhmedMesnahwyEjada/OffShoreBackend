const express = require("express");
const Joi = require("joi");
const constants = require("../shared/constants");
const { RequestCodes, ErrorMessages } = constants;
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const manager = require("../middleware/manager");
const LocationRequest = require("../models/locationRequest");
const User = require("../models/user");
const router = express.Router();

router.post(
  "/",
  auth,
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestLocation(req.body.location);
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send({ errors: { message: requestError.details[0].message } });
    const {
      userToken: { _id: userID },
      location,
      title,
    } = req.body;
    var { managerID, remoteLocations } = await User.findOne({ _id: userID });
    if (remoteLocations.length >= constants.MAX_NUMBER_OF_LOCATIONS)
      return res.status(RequestCodes.BAD_REQUEST).send({
        errors: { message: ErrorMessages.FILLED_REMOTE_LOCATIONS_ARRAY },
      });
    const locationRequest = new LocationRequest({
      userID,
      managerID,
      title,
      location,
    });
    await locationRequest.save();
    return res.status(RequestCodes.OK).send(locationRequest._id);
  })
);
router.post(
  "/approve/:locationRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    const locationRequestID = req.params.locationRequestID;
    const locationRequest = await LocationRequest.findById(locationRequestID);
    if (!locationRequest)
      return res.status(RequestCodes.NOT_FOUND).send({
        errors: { message: ErrorMessages.LOCATION_REQUEST_NOT_FOUND },
      });
    const {
      userToken: { _id: managerID },
    } = req.body;
    if (locationRequest.managerID != managerID)
      return res.status(RequestCodes.FORBIDDEN).send({
        errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
      });
    const user = await User.findById(locationRequest.userID);
    if (user.remoteLocations.length >= 3)
      return res.status(RequestCodes.BAD_REQUEST).send({
        errors: {
          message: ErrorMessages.FILLED_REMOTE_LOCATIONS_ARRAY_MANAGER,
        },
      });
    locationRequest.status = "Approved";
    user.remoteLocations = user.remoteLocations.concat([
      locationRequest.location,
    ]);
    await user.save();
    await locationRequest.save();
    res.status(RequestCodes.OK).send(locationRequest);
  })
);
router.post(
  "/reject/:locationRequestID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    const locationRequestID = req.params.locationRequestID;
    const locationRequest = await LocationRequest.findById(locationRequestID);
    if (!locationRequest)
      return res.status(RequestCodes.NOT_FOUND).send({
        errors: { message: ErrorMessages.LOCATION_REQUEST_NOT_FOUND },
      });
    const {
      userToken: { _id: managerID },
    } = req.body;
    if (locationRequest.managerID != managerID)
      return res.status(RequestCodes.FORBIDDEN).send({
        errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
      });
    locationRequest.status = "Rejected";
    await locationRequest.save();
    res.status(RequestCodes.OK).send(locationRequest);
  })
);
router.post(
  "/cancel/:locationRequestID",
  auth,
  exceptionHandling(async (req, res) => {
    const locationRequestID = req.params.locationRequestID;
    const locationRequest = await LocationRequest.findById(locationRequestID);
    if (!locationRequest)
      return res.status(RequestCodes.NOT_FOUND).send({
        errors: { message: ErrorMessages.LOCATION_REQUEST_NOT_FOUND },
      });
    const {
      userToken: { _id: userID },
    } = req.body;
    if (locationRequest.userID != userID)
      return res.status(RequestCodes.FORBIDDEN).send({
        errors: { message: ErrorMessages.NOT_ALLOWED_TO_MODIFY_THIS_REQUEST },
      });
    locationRequest.status = "Canceled";
    await locationRequest.save();
    res.status(RequestCodes.OK).send(locationRequest);
  })
);
const validateRequestLocation = (location) => {
  const locationSchema = Joi.object({
    longitude: Joi.number().required(),
    latitude: Joi.number().required(),
  });
  return locationSchema.validate(location);
};

module.exports = router;
