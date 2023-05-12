const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    // The users ObjectId
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    // The users password reset token
    passwordResetToken: { type: String, required: true },
    // The expiration date of the password reset token
    expiration: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
