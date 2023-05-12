const Log = require("../models/Log");

// Add log to DB
const log = (receivedLog) => {
  const log = new Log({
    status: receivedLog.status,
    type: receivedLog.type,
    data: receivedLog.data || null,
    user: receivedLog.user || null,
  });

  log.save();
};

module.exports = {
  log,
};
