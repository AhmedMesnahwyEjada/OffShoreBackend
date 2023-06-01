const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const exceptionHandling = require("../middleware/exceptionHandling");
const auth = require("../middleware/authorization");
const manager = require("../middleware/manager");
const User = require("../models/user");
const { ErrorMessages, RequestCodes } = require("../shared/constants");
const router = express.Router();

router.post(
  "/login",
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body);
    if (requestError)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send({ errors: { message: requestError.details[0].message } });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(RequestCodes.BAD_REQUEST)
        .send({ errors: { message: ErrorMessages.INVALID_EMAIl_OR_PASSWORD } });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res
        .status(400)
        .send({ errors: { message: ErrorMessages.INVALID_EMAIl_OR_PASSWORD } });
    const token = user.generateAuthToken();
    res.status(RequestCodes.OK).header("x-auth-token", token).send(user);
  })
);

router.get(
  "/info",
  auth,
  exceptionHandling(async (req, res) => {
    const {
      userToken: { _id: userID },
    } = req.body;
    const user = await User.findById(userID);
    const { firstName: managerFirstName, email: managerEmail } = User.findById(
      user.managerID
    );
    const {
      _doc: { __v, _id, managerID, password, ...userInfo },
    } = user;
    userInfo.managerFirstName = managerFirstName;
    userInfo.managerEmail = managerEmail;
    res.status(RequestCodes.OK).send(userInfo);
  })
);
router.get(
  "/employeeInfo/:employeeID",
  auth,
  manager,
  exceptionHandling(async (req, res) => {
    const employeeID = req.params.employeeID;
    const {
      userToken: { _id: managerID },
    } = req.body;
    const employee = await User.findById(employeeID);
    if (!employee)
      return res
        .status(RequestCodes.NOT_FOUND)
        .send("The user ID is incorrect");
    if (employee.managerID != managerID)
      return res
        .status(RequestCodes.FORBIDDEN)
        .send("You are not the manager of this user");
    const {
      _doc: { __v, _id, managerID: mID, password, ...employeeInfo },
    } = employee;
    res.status(RequestCodes.OK).send(employeeInfo);
  })
);

router.get(
  "/timeSheetFilled",
  auth,
  exceptionHandling((req, res) => {
    return res.status(RequestCodes.OK).send({ filledTimeSheet: true });
  })
);
router.post(
  "/register",
  exceptionHandling(async (req, res) => {
    const { error: requestError } = validateRequestBody(req.body);
    if (requestError)
      return res.status(RequestCodes.BAD_REQUEST).send({ errors: { message: requestError.details[0].message}});
    const { email, password, firstName, managerID, role } = req.body;
    const hashedPassword = await createHashedPassword(password, 10);
    const user = new User({
      email: email,
      password: hashedPassword,
      firstName: firstName ?? "Ahmed",
      managerID: managerID ?? "646f3e276c753fbad2376e45",
      mobileNumber: "01234569877",
      role: role ?? "Employee",
      imageUrl: "",
      lastName: "Ahmed",
      arabicName: "أحمد",
      roleArabic: "موظف",
      defaultLocation: {
        longitude: 31.3507,
        latitude: 30.0686,
      },
    });
    await user.save();
    const token = user.generateAuthToken();
    res.status(RequestCodes.OK).header("x-auth-token", token).send(user);
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
    firstName: Joi.string(),
  });
  return userSchema.validate(user);
};

module.exports = router;
