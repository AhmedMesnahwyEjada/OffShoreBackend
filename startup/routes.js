const express = require("express");
const users = require("../routes/users");
const workingHours = require("../routes/workingHours");
const locationRequest = require("../routes/locationRequest");
const workFromHomeRequest = require("../routes/workFromHomeRequest");
const timeSheetRequest = require("../routes/timeSheetRequest");
const requests = require("../routes/requests");
module.exports = (app) => {
  app.use(express.json());
  app.use(function (_, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  app.use("/users", users);
  app.use("/workingHours", workingHours);
  app.use("/requests", requests);
  app.use("/requests/location", locationRequest);
  app.use("/requests/workFromHome", workFromHomeRequest);
  app.use("/requests/timeSheet", timeSheetRequest);
};
