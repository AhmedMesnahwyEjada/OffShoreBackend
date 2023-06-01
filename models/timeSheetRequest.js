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
  projects: {
    type: [
      {
        name: String,
        country: String,
        managerName: String,
        numberOfDays: Number,
      },
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Canceled"],
    default: "Pending",
  },
});
const TimeSheetRequestSchema = mongoose.model(
  "TimeSheetRequest",
  timeSheetRequestSchema,
  "TimeSheetRequest"
);
module.exports = TimeSheetRequestSchema;
