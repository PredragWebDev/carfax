const express = require("express");
const app = express();
const path = require("path");
const logger = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const flash = require("connect-flash");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const session = require("express-session");
const routes = require("./routes");
const MongoStore = require("connect-mongo");
const cron = require("./classes/cron");
const moment = require("moment-timezone");

// Set default timezone to UTC
moment.tz.setDefault("Etc/UTC");

Sentry.init({
  dsn: "https://845487d0a6024e56b2f6ee566b694ff3@sentry.io/5097011",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

const { MONGODB_URI, SESSION_SECRET, NODE_ENV } = process.env;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB");
    cron();
  })
  .catch((err) => {
    if (err.name === "MongooseTimeoutError") {
      console.error(
        "MongoDB connection error. Please make sure MongoDB is running.",
        err
      );
    } else {
      console.error(err);
    }
    process.exit();
  });

const isDevelopment = NODE_ENV !== "production";

if (!isDevelopment) {
  app.set("trust proxy", 1);
}

app.use("/assets", express.static(path.join(__dirname, "../assets")));

// Middlewares
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(logger("dev"));
app.use(
  helmet({
    // Diasabled for now, need to work on this later
    contentSecurityPolicy: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(function (req, res, next) {
  session({
    name: "_session_id", // _session_id
    secret: "hello",
    resave: false,
    saveUninitialized: false,
    // Lazy session update once every 5 minutes so we don't spam mongodb
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      touchAfter: 5 * 60,
      stringify: false,
      autoReconnect: true,
    }),
    cookie: {
      httpsOnly: true,
      secure: !isDevelopment,
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day for regular session
    },
    genid: (req) => {
      return uuidv4(); // use UUIDs for session IDs
    },
  })(req, res, next);
});
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  // Set user for Sentry events
  Sentry.setUser(req.session.user);

  // Expose the user to ejs
  res.locals.user = req.session.user;

  // Flash erorr messages
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");

  next();
});

app.set("view engine", "ejs");

// Routes
app.use("/", routes);

// Catch errors
app.use(Sentry.Handlers.errorHandler());
app.use(function (err, req, res, next) {
  // Sentry capture the exception
  Sentry.captureException(err);

  // Invalid CSRF token
  if (err.code === "EBADCSRFTOKEN") {
    // TODO: Custom message for CSRF token, temp solution rn.
    return res.status(50).render("./50X", { user: req.session.user });
  }

  if (isDevelopment) {
    console.log(err);
    res
      .status(500)
      .json({ status: false, error: err.stack, message: err.message });
  } else {
    res.status(500).render("./50X", { user: req.session.user });
  }
});

// 404 Fallback
app.use(function (req, res) {
  res.status(404).render("./404", { user: req.session.user });
});

module.exports = app;
