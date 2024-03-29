const mongoose = require("mongoose");
const moment = require("moment");
const idSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, min: 2022 },
    month: { type: Number, min: 1, max: 12, required: true },
    day: { type: Number, min: 1, max: 31, required: true },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);
const workingHoursSchema = new mongoose.Schema({
  id: { type: idSchema, unique: true },
  clockIns: {
    type: [
      {
        dateTime: Date,
        location: { longitude: Number, latitude: Number },
        isApprovedLocation: Boolean,
      },
    ],
    default: [],
  },
  clockOuts: {
    type: [
      {
        dateTime: Date,
        location: { longitude: Number, latitude: Number },
        lastClockInIndex: Number,
      },
    ],
    default: [],
  },
  totalWorkingHours: { type: Number, default: 0 },
});
const WorkingHours = mongoose.model(
  "WorkingHours",
  workingHoursSchema,
  "WorkingHours"
);
module.exports = WorkingHours;
