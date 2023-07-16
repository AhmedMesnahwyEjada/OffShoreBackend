module.exports = {
  ErrorMessages: {
    INVALID_EMAIl_OR_PASSWORD: "The Email or the Password is incorrect",
    NOT_CLOCKED_IN: "Please Clock in first",
    CLOCKING_OUT_FROM_DIFFERENT_LOCATION:
      "Please clock out from the same location you have clocked in from",
    CANNOT_WORK_FROM_THIS_LOCATION:
      "you are not approved to work from this location",
    ALREADY_CLOCKED_IN: "You are already clocked In",
    UNAUTHORIZED_MESSAGE: "Please Log in first",
    FORBIDDEN_MESSAGE: "You are not authorized to access this content",
    FILLED_REMOTE_LOCATIONS_ARRAY:
      "You already have filled the locations array",
    FILLED_REMOTE_LOCATIONS_ARRAY_MANAGER:
      "The employee have already filled the locations array",
    LOCATION_REQUEST_NOT_FOUND: "The location request ID is incorrect",
    NOT_ALLOWED_TO_MODIFY_THIS_REQUEST:
      "You are not allowed to modify the status of this request",
    WORK_FROM_HOME_REQUEST_NOT_FOUND:
      "The work from home request ID is incorrect",
    THIS_USER_NO_LONGER_EXIST: "This user no longer exist",
    TIME_SHEET_REQUEST_NOT_FOUND: "The time sheet request ID is incorrect",
    CANNOT_MODIFY_THIS_REQUEST:
      "This request status is not pending you cannot edit this request",
    NUMBER_OF_WORKING_DAYS_IS_ZERO:
      "You cannot create a work from home request as the number of working days is 0",
  },
  PrivateKeys: {
    JWT_KEY: "privateKey",
  },
  RequestCodes: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    OK: 200,
  },
  MILLIE_SECONDS_IN_HOUR: 1000.0 * 60 * 60,
  DAILY_WORKING_HOURS_LIMIT: 24,
  MAX_NUMBER_OF_LOCATIONS: 3,
};
