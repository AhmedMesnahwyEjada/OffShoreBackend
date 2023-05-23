const express = require("express");
const { capitalizeOnlyFirstChar } = require("../shared/helperFunctions");
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const LocationRequest = require("../models/locationRequest");
const manager = require("../middleware/manager");
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
  const requests = await LocationRequest.find({
    [IDAttribute]: userID,
    status: status ?? { $regex: /.*/ },
  });
  return res.send(requests);
};
module.exports = router;
