const csurf = require("csurf");

// Use default settings for csurf as we are using express-session
const csrfProtection = csurf();

const token = (req, res, next) => {
  if (req.method === "POST") {
    // Remove _csrf token from request as we don't need it anymore
    // it has been verified by csurf middleware before this middleware
    delete req.body._csrf;
  }

  // Expose the csrf token to EJS
  res.locals.csrfToken = req.csrfToken();

  next();
};

// Have 2 middlewares here in 1 array
// Init csurf then generaete token if "GET" request
module.exports = [csrfProtection, token];
