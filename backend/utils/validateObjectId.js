const mongoose = require("mongoose");
const ApiError = require("./ApiError");

/**
 * Throws a 400 ApiError if the given value is not a valid MongoDB ObjectId.
 * Used before any query so we never leak a raw Mongoose CastError to the client.
 */
const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

module.exports = validateObjectId;
