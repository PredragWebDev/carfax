const mongoose = require("mongoose");

const webhooksSchema = new mongoose.Schema(
  {
    // The status of log (info, success, error)
    webhooksID: {
      type: String,
      required: true,
    },
    // The action that has occured
    
    // If initiated by user or not
    // type: mongoose.Types.ObjectId,
    user: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

webhooksSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Webhooks", webhooksSchema);
