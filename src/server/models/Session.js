const mongoose = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;

const sessionSchema = new mongoose.Schema({
  _id: { type: String },
  expires: { type: Date },
  lastModified: { type: Date },
  session: {
    cookie: {},
    flash: {},
    csrfSecret: {},
    user: {
      _id: { type: ObjectId },
      email: { type: String },
      role: { type: String },
    },
  },
});

module.exports = mongoose.model("Session", sessionSchema);
