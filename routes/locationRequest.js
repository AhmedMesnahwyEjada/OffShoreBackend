const express = require("express");
const Joi = require("joi");
const constants = require("../shared/constants");
const { RequestCodes, ErrorMessages } = constants;
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
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
        .send(requestError.details[0].message);
    const {
      userToken: { _id: userID },
      location,
      title,
    } = req.body;
    var { managerID, remoteLocations } = await User.findOne({ _id: userID });
    if (remoteLocations.length >= constants.MAX_NUMBER_OF_LOCATIONS)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send(ErrorMessages.FILLED_REMOTE_LOCATIONS_ARRAY);
    const locationRequest = new LocationRequest({
      userID,
      managerID,
      title,
      location,
    });
    await locationRequest.save();
    return res.send(locationRequest._id);
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
