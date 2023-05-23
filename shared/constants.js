module.exports = {
  ErrorMessages: {
    INVALID_EMAIl_OR_PASSWORD: "The Email or the Password is incorrect",
    NOT_CLOCKED_IN: "Please Clock in first",
    CLOCKING_OUT_FROM_DIFFERENT_LOCATION:
      "Please clock out from the same location you have clocked in from",
  },
  PrivateKeys: {
    JWT_KEY: "privateKey",
  },
  milliSecondInHour: 1000.0 * 60 * 60,
  dailyWorkingHoursLimit: 24,
  defaultLocationNumber: 0,
};
