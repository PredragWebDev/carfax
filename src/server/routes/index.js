const express = require("express");
const router = express.Router();
const Joi = require("joi");
const moment = require("moment");
const cheerio = require("cheerio");
const User = require("../models/User");
const { log } = require("../classes/log");
const Report = require("../models/Report");
const AutoCheck = require("../models/AutoCheck");
const MobileDetect = require("mobile-detect");
const {
  getCarFax,
  getVINFromPlate,
  getAutoCheck,
  //vinSuggestions,
  //vinCheck,
} = require("../classes/carfax-api");
const { isAuthenticated } = require("../middleware/auth");
const csrfProtection = require("../middleware/csrf");

const renderReport = (req, res, report, wholeSalePricing) => {
  const md = new MobileDetect(req.headers["user-agent"]);

  if (wholeSalePricing) {
    if (md.mobile()) {
      res.render("report", {
        desktopReportHtml: null,
        mobileReportHtml: report.mobileReportHtml || null,
        html: report.html || null,
      });
    } else {
      res.render("report", {
        desktopReportHtml: report.desktopReportHtml || null,
        mobileReportHtml: null,
        html: report.html || null,
      });
    }
  } else {
    if (md.mobile()) {
      const mobileReportHtml = cheerio.load(report.mobileReportHtml);

      // Remove wholesale info in script
      mobileReportHtml("script").each((i, elem) => {
        if (mobileReportHtml(elem).html().includes("oneprice")) {
          mobileReportHtml(elem).remove();
        }
        if (
          mobileReportHtml(elem).html().includes("retail") ||
          mobileReportHtml(elem).html().includes("wholesale")
        ) {
          mobileReportHtml(elem).remove();
        }
      });

      // Remove wholesale pricing container
      mobileReportHtml("#value-container").remove();

      res.render("report", {
        desktopReportHtml: null,
        mobileReportHtml: mobileReportHtml.html() || null,
        html: report.html || null,
      });
    } else {
      const desktopReportHtml = cheerio.load(report.desktopReportHtml);

      // Remove wholesale info in script
      desktopReportHtml("script").each((i, elem) => {
        if (desktopReportHtml(elem).html().includes("oneprice")) {
          desktopReportHtml(elem).remove();
        }
        if (
          desktopReportHtml(elem).html().includes("retail") ||
          desktopReportHtml(elem).html().includes("wholesale")
        ) {
          desktopReportHtml(elem).remove();
        }
      });

      // Remove wholesale pricing container
      desktopReportHtml("#value-container").remove();

      res.render("report", {
        desktopReportHtml: desktopReportHtml.html() || null,
        mobileReportHtml: null,
        html: report.html || null,
      });
    }
  }
};

// Home page / check page
router.get("/", isAuthenticated, csrfProtection, async (req, res) => {
  const user = await User.findOne({ _id: req.session.user._id });
  res.render("check", {
    user,
  });
});

router.get("/autocheck", isAuthenticated, csrfProtection, async (req, res) => {
  const user = await User.findOne({ _id: req.session.user._id });
  res.render("autocheck", {
    user,
  });
});

// Get a report
router.get("/report/:id", async (req, res) => {
  const { id } = req.params;

  // Make sure length is same as object id of mongo
  if (id.length === 24) {
    let report = await Report.findById(id);

    if (!report) {
      report = await AutoCheck.findById(id);
    }
    
    // If a report exists with this id show the html
    if (report) {
      // User signed in
      if (req.session && req.session.user) {
        const user = await User.findOne({ _id: req.session.user._id });

        // User exists in db
        if (user) {
          // User has wholesale pricing
          if (user.subscription_data.wholeSalePricing) {
            renderReport(req, res, report, true);
          } else {
            renderReport(req, res, report, false);
          }
        }
        // User maybe deleted from DB?
        else {
          renderReport(req, res, report, false);
        }
      }
      // User not signed in or doesn't have access to wholesale pricing
      else {
        renderReport(req, res, report, false);
      }
    } else {
      res
        .status(200)
        .json({ message: "Either your key is invalid or it's expired." });
    }
  } else {
    res
      .status(200)
      .json({ message: "Either your key is invalid or it's expired." });
  }
});

// Get all reports the current user has made
router.get("/reports", isAuthenticated, async (req, res) => {
  const user = await User.findOne({ _id: req.session.user._id }).populate({
    path: "reports",
    options: {
      sort: { createdAt: -1 },
      select: "VIN yearMakeModel createdAt",
    },
  });

  // User should exist but just to make sure
  if (user) {
    res.render("reports", {
      reports: user.reports,
    });
  } else {
    res.redirect("/users/login");
  }
});

router.get("/autocheckReports", isAuthenticated, async (req, res) => {
  const user = await User.findOne({ _id: req.session.user._id }).populate({
    path: "autocheckreports",
    options: {
      sort: { createdAt: -1 },
      select: "VIN yearMakeModel createdAt",
    },
  });

  // User should exist but just to make sure
  if (user) {
    res.render("reports", {
      reports: user.autocheckreports,
    });
  } else {
    res.redirect("/users/login");
  }
});

// Check a VIN / generate a report
router.post("/check", isAuthenticated, csrfProtection, async (req, res) => {
  const schema = Joi.object({
    VIN: Joi.string().length(17).messages({
      "string.empty": "VIN cannot be empty",
      "any.required": "VIN is required",
      "string.length": "VIN must be 17 characters in length",
    }),
    PLATE: Joi.string().max(11).messages({
      "string.empty": "Plate cannot be empty",
      "any.required": "Plate is required",
      "string.max": "Plate must be less than 11 characters",
    }),
    STATE: Joi.string().length(2).messages({
      "string.empty": "State cannot be empty",
      "any.required": "State is required",
      "string.length": "State must be 2 characters in length",
    }),
  })
    .or("VIN", "PLATE")
    .with("PLATE", "STATE");

  const { value, error } = schema.validate(req.body);

  // Need to get this balance shit into a common area
  const user = await User.findOne({ _id: req.session.user._id }).populate({
    path: "reports",
    match: {
      createdAt: {
        // Get all reports fetched from the start of "today"
        $gte: moment().startOf("day").toDate(),
      },
    },
    sort: { createdAt: -1 },
    select: "createdAt",
  });

  if (error) {
    res.render("check", {
      user,
      errors: error.details,
    });
  } else {
    // Check if current date is more than the end of users sub
    // const subExpired = new Date() > user.subscription_data.current_period_end;

    const subExpired = false;
    // Check if user has active sub and has a balance of 1 or more
    // Or user is admin so we can run the report
    if (
      (!subExpired && user.subscription_data.balance > 0) ||
      user.role === "ADMIN"
    ) {

      // Report limit reached for the day
      // Or user is admin
      if (
        user.reports.length >= user.subscription_data.dailyReportLimit &&
        user.role !== "ADMIN"
      ) {
        const now = moment(),
          tomorrow = moment().add(1, "day").startOf("day"),
          difference = moment.duration(tomorrow.diff(now));

        return res.render("check", {
          user,
          errors: [
            {
              message: `Daily report limit of ${
                user.subscription_data.dailyReportLimit
              } reached, please wait ${difference.hours()} hrs ${difference.minutes()} mins until your report limit is reset`,
            },
          ],
        });
      }

      // Init VIN
      let VIN = undefined;

      // If user requests with plate + state we get VIN from that
      if (value.PLATE && value.STATE) {
        const VINFromPlate = await getVINFromPlate(value.PLATE, value.STATE);

        if (VINFromPlate.error) {
          return res.render("check", {
            user,
            errors: [{ message: VINFromPlate.error }],
          });
        } else {
          VIN = VINFromPlate.VIN;
        }
      }
      // User gave us VIN
      else if (value.VIN) {
        VIN = value.VIN;
      }


      // Get the users reports by his id and the current VIN being requested
      // to make sure he didn't already request it

      const userReports = await Report.findOne({
        userId: req.session.user._id,
        VIN,
      });

      // User already has a report for the VIN
      if (userReports) {
        res.render("check", {
          user,
          errors: [{ message: `Report for ${VIN} already exists` }],
        });
      } else {

        // Get CARFAX report for the VIN from this order
        const {
          Carfax,
          desktopReportHtml,
          yearMakeModel,
          error,
        } = await getCarFax(VIN);

        if (error) {
          log({
            status: "error",
            type: "User Fetched Report",
            data: JSON.stringify(
              { VIN, error, report: { Carfax: Carfax || null } },
              null,
              2
            ),
            user: user._id,
          });

          res.render("check", {
            user,
            errors: [{ message: error }],
          });
        } else {
          const report = new Report({
            userId: req.session.user._id,
            VIN,
            desktopReportHtml,
            yearMakeModel,
            carFax: Carfax,
          });

          // Save the new report
          await report.save();

          // Add the report to the user
          // And subtract 1 from balance
          await User.findOneAndUpdate(
            { _id: req.session.user._id },
            {
              $addToSet: { reports: report._id },
              $inc: { "subscription_data.balance": -1 },
            }
          );

          log({
            status: "success",
            type: "User Fetched Report",
            data: JSON.stringify(
              {
                VIN,
                report: {
                  yearMakeModel,
                  id: report.id,
                  Carfax,
                },
              },
              null,
              2
            ),
            user: user._id,
          });

          req.flash(
            "success_msg",
            `Success, view your report for ${VIN} in my reports`
          );

          res.redirect("/");
        }
      }
    } else {
      res.render("check", {
        user,
        errors: [{ message: "Not enough balance or subscription expired" }],
      });
    }
  }
});

router.post("/autocheck", isAuthenticated, csrfProtection, async (req, res) => {
  const schema = Joi.object({
    VIN: Joi.string().length(17).messages({
      "string.empty": "VIN cannot be empty",
      "any.required": "VIN is required",
      "string.length": "VIN must be 17 characters in length",
    }),
    PLATE: Joi.string().max(11).messages({
      "string.empty": "Plate cannot be empty",
      "any.required": "Plate is required",
      "string.max": "Plate must be less than 11 characters",
    }),
    STATE: Joi.string().length(2).messages({
      "string.empty": "State cannot be empty",
      "any.required": "State is required",
      "string.length": "State must be 2 characters in length",
    }),
  })
    .or("VIN", "PLATE")
    .with("PLATE", "STATE");

  const { value, error } = schema.validate(req.body);

  // Need to get this balance shit into a common area
  const user = await User.findOne({ _id: req.session.user._id }).populate({
    path: "autocheckreports",
    match: {
      createdAt: {
        // Get all reports fetched from the start of "today"
        $gte: moment().startOf("day").toDate(),
      },
    },
    sort: { createdAt: -1 },
    select: "createdAt",
  });

  if (error) {
    res.render("autocheck", {
      user,
      errors: error.details,
    });
  } else {
    // Check if current date is more than the end of users sub

    // const subExpired = new Date() > user.subscription_data.current_period_end;

    const subExpired = false

    // Check if user has active sub and has a balance of 1 or more
    // Or user is admin so we can run the report
    if (
      (!subExpired && user.subscription_data.balance > 0) ||
      user.role === "ADMIN"
    ) {
      // Report limit reached for the day
      // Or user is admin
      if (
        user.autocheckreports.length >= user.subscription_data.dailyReportLimit &&
        user.role !== "ADMIN"
      ) {
        const now = moment(),
          tomorrow = moment().add(1, "day").startOf("day"),
          difference = moment.duration(tomorrow.diff(now));

        return res.render("autocheck", {
          user,
          errors: [
            {
              message: `Daily autocheck limit of ${
                user.subscription_data.dailyReportLimit
              } reached, please wait ${difference.hours()} hrs ${difference.minutes()} mins until your auto check limit is reset`,
            },
          ],
        });
      }

      // Init VIN
      let VIN = undefined;

      // If user requests with plate + state we get VIN from that
      if (value.PLATE && value.STATE) {
        const VINFromPlate = await getVINFromPlate(value.PLATE, value.STATE);

        if (VINFromPlate.error) {
          return res.render("autocheck", {
            user,
            errors: [{ message: VINFromPlate.error }],
          });
        } else {
          VIN = VINFromPlate.VIN;
        }
      }
      // User gave us VIN
      else if (value.VIN) {
        VIN = value.VIN;
      }

      // Get the users reports by his id and the current VIN being requested
      // to make sure he didn't already request it
      const userAutoCheckReports = await AutoCheck.findOne({
        userId: req.session.user._id,
        VIN,
      });

      // User already has a report for the VIN
      if (userAutoCheckReports) {
        res.render("autocheck", {
          user,
          errors: [{ message: `Report for ${VIN} already exists` }],
        });
      } else {
        // Get CARFAX report for the VIN from this order
        const {
          Carfax,
          desktopReportHtml,
          yearMakeModel,
          error,
        } = await getAutoCheck(VIN);

        if (error) {
          log({
            status: "error",
            type: "User Fetched Report",
            data: JSON.stringify(
              { VIN, error, report: { Carfax: Carfax || null } },
              null,
              2
            ),
            user: user._id,
          });

          res.render("autocheck", {
            user,
            errors: [{ message: error }],
          });
        } else {

          const autoCheckReport = new AutoCheck({
            userId: req.session.user._id,
            VIN,
            yearMakeModel,
            desktopReportHtml,
            carFax: Carfax,
          });

          // Save the new report
          await autoCheckReport.save();

          // Add the report to the user
          // And subtract 1 from balance
          await User.findOneAndUpdate(
            { _id: req.session.user._id },
            {
              $addToSet: { autocheckreports: autoCheckReport._id },
              $inc: { "subscription_data.balance": -1 },
            }
          );

          log({
            status: "success",
            type: "User Fetched Report",
            data: JSON.stringify(
              {
                VIN,
                autoCheck: {
                  yearMakeModel,
                  id: autoCheckReport.id,
                  Carfax,
                },
              },
              null,
              2
            ),
            user: user._id,
          });

          req.flash(
            "success_msg",
            `Success, view your report for ${VIN} in my reports`
          );

          res.redirect("/");
        }
      }
    } else {
      res.render("autocheck", {
        user,
        errors: [{ message: "Not enough balance or subscription expired" }],
      });
    }
  }
});

/*
router.get("/purchase/:VIN", async (req, res) => {
  let vinValid = undefined;
  const { VIN } = req.params;

  const suggestions = await vinSuggestions(VIN);

  // No suggestions = Valid / Invalid VIN
  if (suggestions.length === 0) {
    vinValid = await vinCheck(VIN);
  }

  res.status(200).json({ suggestions, vinValid });
});
*/

// Routes
router.use("/webhooks", require("./webhooks"));
router.use("/admin", require("./admin"));
router.use("/users", require("./users"));

module.exports = router;
