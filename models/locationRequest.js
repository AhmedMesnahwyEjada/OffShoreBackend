const mongoose = require("mongoose");
const locationRequestSchema = new mongoose.Schema({
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
  title: String,
  location: { longitude: Number, latitude: Number },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
});
const LocationRequest = mongoose.model(
  "LocationRequest",
  locationRequestSchema,
  "LocationRequest"
);
module.exports = LocationRequest;
