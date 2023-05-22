const jwt = require("jsonwebtoken");
const { PrivateKeys } = require("../shared/constants");
module.exports = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(401).send("Please Log in first");
    const userToken = jwt.verify(token, PrivateKeys.JWT_KEY);
    req.body.userToken = userToken;
    next();
  } catch (err) {
    res.status(400).send("invalid token");
  }
};
