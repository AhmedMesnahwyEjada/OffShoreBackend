const { RequestCodes, ErrorMessages } = require("../shared/constants");
module.exports = (req, res, next) => {
  const role = req.body.userToken.role;
  if (role !== "Manager")
    return res
      .status(RequestCodes.FORBIDDEN)
      .send({ errors: { message: ErrorMessages.FORBIDDEN_MESSAGE } });
  next();
};
