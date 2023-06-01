const jwt = require("jsonwebtoken");
const {
  PrivateKeys,
  RequestCodes,
  ErrorMessages,
} = require("../shared/constants");
module.exports = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token)
      return res
        .status(RequestCodes.UNAUTHORIZED)
        .send({ errors: { message: ErrorMessages.UNAUTHORIZED_MESSAGE } });
    const userToken = jwt.verify(token, PrivateKeys.JWT_KEY);
    req.body.userToken = userToken;
    req.body.userToken.role = userToken.role;
    next();
  } catch (err) {
    res.status(400).send("invalid token");
  }
};
