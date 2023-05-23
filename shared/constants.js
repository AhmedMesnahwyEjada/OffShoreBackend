module.exports = {
  ErrorMessages: {
    INVALID_EMAIl_OR_PASSWORD: "The Email or the Password is incorrect",
    NOT_CLOCKED_IN: "Please Clock in first",
    CLOCKING_OUT_FROM_DIFFERENT_LOCATION:
      "Please clock out from the same location you have clocked in from",
    CANNOT_WORK_FROM_THIS_LOCATION:
      "you are not approved to work from this location",
    ALREADY_CLOCKED_IN: "You are already clocked In",
  },
  PrivateKeys: {
    JWT_KEY: "privateKey",
  },
  RequestCodes: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
  },
  milliSecondInHour: 1000.0 * 60 * 60,
  dailyWorkingHoursLimit: 24,
  defaultLocationNumber: 0,
};
