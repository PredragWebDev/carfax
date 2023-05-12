const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema(
  {
    // The users email.
    email: {
      $type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/\S+@\S+\.\S+/, "is invalid"],
      index: true,
    },
    // The users password.
    password: { $type: String, required: true },
    // The users role (USER, ADMIN).
    role: { $type: String, default: "USER", required: true },
    // The users subscription data
    subscription_data: {
      // The users report balance (-1 For unlimited else x amount of reports per month)
      balance: Number,
      // UTC timestamp for the end of the subscription
      current_period_end: Date,
      // If the subscription is active or disabled by an admin
      active: Boolean,
      // The 24 hour report limit for the user
      dailyReportLimit: {
        $type: Number,
        default: 20,
      },
      // If user has access to wholesale pricing
      wholeSalePricing: {
        $type: Boolean,
        default: false,
      },
    },
    // The users CARFAX reports
    reports: [
      { $type: mongoose.Schema.Types.ObjectId, ref: "Report", required: false },
    ],
    autocheckreports: [
      { $type: mongoose.Schema.Types.ObjectId, ref: "AutoCheck", required: false },
    ],
  },
  {
    timestamps: true,
    typeKey: "$type",
  }
);

userSchema.pre("save", async function (next) {
  // Check if the password is modified or if its a new document else dont edit
  if (!this.isModified("password")) return next();

  // Hash the cleartext password
  const hash = await argon2.hash(this.password, {
    type: argon2.argon2id,
    memoryCost: 4096 * 2,
    timeCost: 6,
    parallelism: 2,
    hashLength: 64,
  });

  // Replace the cleartext password with the hashed one
  this.password = hash;
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await argon2.verify(this.password, password);
};

userSchema.index({ createdAt: 1 });

module.exports = mongoose.model("User", userSchema);
