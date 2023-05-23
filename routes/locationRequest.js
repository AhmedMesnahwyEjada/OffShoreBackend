const express = require("express");
const Joi = require("joi");
const constants = require("../shared/constants");
const { RequestCodes } = constants;
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
    var { managerID } = await User.findOne({ _id: userID });
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
