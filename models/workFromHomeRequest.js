const mongoose = require("mongoose");
const workFromHomeRequestSchema = new mongoose.Schema({
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
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Canceled"],
    default: "Pending",
  },
});
const WorkFromHomeRequest = mongoose.model(
  "WorkFromHomeRequest",
  workFromHomeRequestSchema,
  "WorkFromHomeRequest"
);
module.exports = WorkFromHomeRequest;
