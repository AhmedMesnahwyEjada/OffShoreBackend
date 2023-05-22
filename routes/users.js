const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const exceptionHandling = require("../middleware/exceptionHandling");
const User = require("../models/user");
const { ErrorMessages } = require("../shared/constants");
const router = express.Router();

router.post(
  "/login",
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body);
    if (requestError)
      return res.status(400).send(requestError.details[0].message);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).send(ErrorMessages.INVALID_EMAIl_OR_PASSWORD);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).send(ErrorMessages.INVALID_EMAIl_OR_PASSWORD);
    const token = user.generateAuthToken();
    res.header("x-auth-token", token).send(user);
  })
);

router.get(
  "/login",
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body);
    if (requestError)
      return res.status(400).send(requestError.details[0].message);
    const { email, password, firstName, managerID, role } = req.body;
    const hashedPassword = createHashedPassword(password, 10);
    const user = new User({
      email: email,
      password: hashedPassword,
      firstName: firstName ?? "Ahmed",
      managerID: managerID ?? "123456",
      role: role ?? "Employee",
    });
    await user.save();
    const token = user.generateAuthToken();
    res.header("x-auth-token", token).send(user);
  })
);

const createHashedPassword = async (password, salt_length) => {
  const salt = await bcrypt.genSalt(salt_length);
  return await bcrypt.hash(password, salt);
};

const validateRequestBody = (user) => {
  const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return userSchema.validate(user);
};

module.exports = router;
