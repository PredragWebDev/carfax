const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    cookies: {},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);
