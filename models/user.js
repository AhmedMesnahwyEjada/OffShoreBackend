const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { PrivateKeys } = require("../shared/constants");
const userSchema = new mongoose.Schema({
  email: { type: String, trim: true, required: true, unique: true },
  password: { type: String, required: true, trim: true },
  firstName: { type: String, required: true },
  lastName: String,
  arabicName: String,
  role: {
    type: String,
    enum: ["Employee", "Manager"],
    default: "Employee",
  },
  roleArabic: {
    type: String,
    required: true,
  },
  imageUrl: String,
  mobileNumber: String,
  defaultLocation: {
    _id: false,
    type: { longitude: Number, latitude: Number },
    required: true,
  },
  remoteLocations: {
    _id: false,
    type: [{ longitude: Number, latitude: Number }],
    validate: [
      (locations) => {
        return locations.length <= 3;
      },
    ],
    default: [],
  },
  workingFromHomeDays: {
    _id: false,
    type: [Date],
    default: [],
  },
  managerID: {
    type: String,
    ref: "User",
    required: true,
  },
});
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id, role: this.role }, PrivateKeys.JWT_KEY);
};
const User = mongoose.model("Users", userSchema, "Users");
module.exports = User;
