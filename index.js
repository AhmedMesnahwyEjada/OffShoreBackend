const express = require("express");
const winston = require("winston");
const app = express();
require("./startup/logging")();
require("./startup/db")();
require("./startup/routes")(app);
app.listen(3000, () => winston.info("listening on port 3000..."));
