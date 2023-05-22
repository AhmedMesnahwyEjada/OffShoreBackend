const express = require("express");
const users = require("../routes/users");
const workingHours = require("../routes/workingHours");
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
};
