const CronJob = require("cron").CronJob;
const { log } = require("./log");
const User = require("../models/User");
const Settings = require("../models/Settings");
const { isStillLoggedIn, loginWithInfo } = require("../classes/carfax-api");

const loginCron = async () => {
  const settings = await Settings.findOne({});

  if (settings) {
    // Get the difference between current time & updatedAt & check if been more 30 min
    if (Date.now() - settings.updatedAt >= 1000 * 60 * 30) {
      // If not logged in anymore lets login again to set new cookies
      if (!(await isStillLoggedIn())) await loginWithInfo();
    }
  }
  // Don't have settings yet, lets create
  else {
    await loginWithInfo();
  }
};

const subscriptionCron = async () => {
  // Find all expired users _id's
  const expiredUsers = (
    await User.find(
      {
        // Users that have a current subscription
        "subscription_data.active": true,
        // & expiration date is less than current date
        "subscription_data.current_period_end": { $lt: new Date() },
      },
      "_id"
    )
  ).map((user) => user._id);

  // Update all matching users found above
  await User.updateMany(
    { _id: { $in: expiredUsers } },
    {
      subscription_data: {
        balance: 0,
        current_period_end: null,
        dailyReportLimit: process.env.DEFAULT_REPORT_LIMIT,
        active: false,
      },
    }
  );

  // Loop through all expired users and add log
  for (let i = 0; i < expiredUsers.length; i++) {
    log({
      status: "info",
      type: "User Subscription Expired",
      data: null,
      user: expiredUsers[i],
    });
  }
};

const main = () => {
  return new CronJob(
    // Every minute
    "* * * * *",
    async function () {
      await subscriptionCron();
      await loginCron();

      this.onComplete();
    },
    async function () {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `Posting cron job complete! Last Execution: ${this.lastExecution}`
        );
      }
    },
    true,
    "America/Los_Angeles"
  );
};

module.exports = main;
