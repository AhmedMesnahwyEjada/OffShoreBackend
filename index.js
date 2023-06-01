const express = require("express");
const winston = require("winston");
const app = express();
require("./startup/logging")();
require("./startup/db")();
require("./startup/routes")(app);
process.on("uncaughtException", (err) => winston.error(err.message));
app.listen(3000, () => winston.info("listening on port 3000..."));
