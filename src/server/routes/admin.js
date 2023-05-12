const express = require("express");
const router = express.Router();
const ObjectId = require("mongoose").Types.ObjectId;
const Joi = require("joi");
const Log = require("../models/Log");
const User = require("../models/User");
const Report = require("../models/Report");
const Session = require("../models/Session");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { patchReport } = require("../classes/carfax-api");

router.get("/users", isAuthenticated, isAdmin, async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });

  res.render("./admin/users", {
    users,
  });
});

router.get("/user/:id", isAuthenticated, isAdmin, async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().length(24).required().messages({
      "string.empty": "User Id cannot be empty",
      "any.required": "User Id is required",
    }),
  });

  const { value, error } = schema.validate(req.params);

  if (error) {
    req.flash("error_msg", error.details[0].message);
    res.redirect(`/admin/users`);
  } else {
    const { id } = value;
    const user = await User.findOne({ _id: id });

    if (user) {
      res.render("./admin/user", {
        currentUser: user,
      });
    } else {
      req.flash("error_msg", `User with id ${id} does not exist`);
      res.redirect(`/admin/users`);
    }
  }
});

router.post("/user/:id", isAuthenticated, isAdmin, async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email cannot be empty",
      "any.required": "Email is required",
    }),
    balance: Joi.number().required().messages({
      "string.empty": "Balance cannot be empty",
      "any.required": "Balance is required",
    }),
    subcription_data_active: Joi.bool().valid("on").default(false),
    wholesale_pricing: Joi.bool().valid("on").default(false),
    current_period_end: Joi.date().required().messages({
      "string.empty": "Subscription end date cannot be empty",
      "any.required": "Subscription end date is required",
    }),
    role: Joi.string().valid("USER", "ADMIN").required().messages({
      "string.empty": "Role cannot be empty",
      "any.required": "Role is required",
    }),
  });

  const { value, error } = schema.validate(req.body);
  const { id } = req.params;

  if (error) {
    req.flash("error_msg", error.details[0].message);
    res.redirect(`/admin/user/${id}`);
  } else {
    if (id.length === 24) {
      const user = await User.findOne({ _id: id });

      if (user) {
        user.email = value.email;
        user.subscription_data.balance = Number(value.balance);

        if (value.subcription_data_active) {
          user.subscription_data.active = true;
        } else {
          user.subscription_data.active = false;
        }

        if (value.wholesale_pricing) {
          user.subscription_data.wholeSalePricing = true;
        } else {
          user.subscription_data.wholeSalePricing = false;
        }

        user.subscription_data.current_period_end = value.current_period_end;
        user.role = value.role;

        await user.save();

        // Delete all sessions
        // TODO: Update current sessions to prevent a ADMIN that was
        // set to "USER" still has access to admin panel.
        // Or just dont store role in session / instead get from users
        /*
        const sessions = await Session.find({
          "session.user._id": new ObjectId(id),
        });
        */

        req.flash("success_msg", "Successfully updated user");
        res.redirect(`/admin/user/${id}`);
      } else {
        next();
      }
    } else {
      next();
    }
  }
});

router.get("/user/:id/reports", isAuthenticated, isAdmin, async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().length(24).required().messages({
      "string.empty": "User Id cannot be empty",
      "any.required": "User Id is required",
    }),
  });

  const { value, error } = schema.validate(req.params);

  if (error) {
    req.flash("error_msg", error.details[0].message);
    res.redirect(`/admin/users`);
  } else {
    const { id } = value;

    const user = await User.findOne({ _id: id }).populate({
      path: "reports",
      options: {
        sort: { createdAt: -1 },
        select: "VIN yearMakeModel createdAt",
      },
    });

    if (user) {
      res.render("./admin/user_reports", {
        reports: user.reports,
      });
    } else {
      req.flash("error_msg", `User with id ${id} does not exist`);
      res.redirect(`/admin/users`);
    }
  }
});

router.post("/user/:id/delete", isAuthenticated, isAdmin, async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().length(24).required().messages({
      "string.empty": "User Id cannot be empty",
      "any.required": "User Id is required",
    }),
  });

  const { value, error } = schema.validate(req.params);

  if (error) {
    req.flash("error_msg", error.details[0].message);
    res.redirect(`/admin/users`);
  } else {
    const { id } = value;

    const user = await User.findOne({ _id: id });

    if (user) {
      // Remove the user from users collection
      await user.remove();

      // Remove user session from sessions collection so that no errors occur
      // where user still has a session but no user exists in users collection
      await Session.findOneAndDelete({
        "session.user._id": id,
      });

      req.flash("success_msg", `Successfully deleted user ${user.email}`);
      res.redirect(`/admin/users`);
    } else {
      req.flash("error_msg", `User with id ${id} does not exist`);
      res.redirect(`/admin/users`);
    }
  }
});

router.get(
  "/reports/:id/repatch",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const schema = Joi.object({
      id: Joi.string().length(24).required().messages({
        "string.empty": "Report Id cannot be empty",
        "any.required": "Reeport Id is required",
      }),
    });

    const { value, error } = schema.validate(req.params);

    if (error) {
      res.status(200).json({ message: error.details[0].message });
    } else {
      const report = await Report.findOne({ _id: value.id });

      if (report) {
        await report.updateOne({
          desktopReportHtml: patchReport(report.desktopReportHtml, "desktop"),
          mobileReportHtml: patchReport(report.mobileReportHtml, "mobile"),
        });

        res.status(200).json({ message: "Patched report" });
      } else {
        res.status(200).json({ message: "Report with this id does not exist" });
      }
    }
  }
);

router.get("/logs", isAuthenticated, isAdmin, async (req, res) => {
  const logs = await Log.find({}).sort({ createdAt: -1 });

  res.render("./admin/logs", {
    logs,
  });
});

module.exports = router;
