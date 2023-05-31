const mongoose = require("mongoose");
const timeSheetRequestSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  managerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  projects: [],
  numberOfDays: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Canceled"],
    default: "Pending",
  },
});
const TimeSheetRequestSchema = mongoose.model(
  "TimeSheetRequestSchema",
  timeSheetRequestSchema,
  "TimeSheetRequestSchema"
);
module.exports = TimeSheetRequestSchema;
