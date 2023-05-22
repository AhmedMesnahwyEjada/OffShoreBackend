const mongoose = require("mongoose");
const winston = require("winston");
module.exports = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/offShore")
    .then(() => winston.log("connected to mongodb"))
    .catch((err) => winston.error(err.message, err));
};
