const { RequestCodes, ErrorMessages } = require("../shared/constants");
module.exports = (req, res, next) => {
  const token = req.body.userToken;
  if (token === "Employee")
    return res
      .status(RequestCodes.FORBIDDEN)
      .send({ errors: { message: ErrorMessages.FORBIDDEN_MESSAGE } });
  next();
};
