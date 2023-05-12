const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    // The status of log (info, success, error)
    status: {
      type: String,
      required: true,
    },
    // The action that has occured
    type: {
      type: String,
      required: true,
    },
    // Any addional data the log might include
    data: {
      type: String,
      required: false,
    },
    // If initiated by user or not
    user: {
      type: mongoose.Types.ObjectId,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

logSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Log", logSchema);
