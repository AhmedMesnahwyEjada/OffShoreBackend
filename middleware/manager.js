const { RequestCodes, ErrorMessages } = require("../shared/constants");
module.exports = (req, res, next) => {
  const token = req.userToken;
  if (token === "Employee")
    return res
      .status(RequestCodes.FORBIDDEN)
      .send(ErrorMessages.FORBIDDEN_MESSAGE);
  next();
};
