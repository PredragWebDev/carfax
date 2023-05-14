const express = require("express");
const router = express.Router();
const Joi = require("joi");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { sendEmail } = require("../classes/email");
const csrfProtection = require("../middleware/csrf");
const { isAuthenticated, forwardAuthenticated } = require("../middleware/auth");
const { verifyRecaptchaV2 } = require("../classes/recaptcha");

const { APP_URL, RECAPTCHA_SITEKEY } = process.env;

// Expose RECAPTCHA to user routes
router.use(function (req, res, next) {
  // Expose sitekey to ejs
  res.locals.RECAPTCHA_SITEKEY = RECAPTCHA_SITEKEY;

  next();
});

router.get("/login", forwardAuthenticated, csrfProtection, (req, res) => {
  res.render("users/login");
});

router.post(
  "/login",
  forwardAuthenticated,
  csrfProtection,
  async (req, res) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.empty": "Email cannot be empty",
        "any.required": "Email is required",
      }),
      password: Joi.string().required().messages({
        "string.empty": "Password cannot be empty",
        "any.required": "Password is required",
      }),
      // "g-recaptcha-response": Joi.string().required().messages({
      //   "string.empty": "reCaptcha cannot be empty",
      //   "any.required": "reCaptcha is required",
      // }),
      remember_me: Joi.bool().valid("on").default(false),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      res.render("users/login", {
        errors: error.details,
        email: value.email,
      });
    } else {
      const { email, password, remember_me } = value;

      // if (!(await verifyRecaptchaV2(value["g-recaptcha-response"])))
      //   return res.render("users/login", {
      //     errors: [
      //       {
      //         message: "Invalid reCaptcha",
      //       },
      //     ],
      //     email,
      //   });

      const user = await User.findOne({ email });

      if (user) {
        if (await user.comparePassword(password)) {
          // Set our session
          req.session.user = {
            _id: user._id,
            email: user.email,
            role: user.role,
          };

          // Set the max age
          if (remember_me) {
            req.session.cookie.originalMaxAge = 1000 * 60 * 60 * 24 * 30; // 30 days for remember me
          }

          res.redirect("/");
        } else {
          res.render("users/login", {
            errors: [
              {
                message: "User does not exist or password invalid",
              },
            ],
            email,
          });
        }
      } else {
        res.render("users/login", {
          errors: [
            {
              message: "User does not exist or password invalid",
            },
          ],
          email,
        });
      }
    }
  }
);

router.get("/register", forwardAuthenticated, csrfProtection, (req, res) => {
  res.render("users/register");
});

router.post(
  "/register",
  forwardAuthenticated,
  csrfProtection,
  async (req, res) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.empty": "Email cannot be empty",
        "any.required": "Email is required",
      }),
      password: Joi.string().min(8).max(200).required().messages({
        "string.empty": "Password cannot be empty",
        "string.min": "Password must have a minimum length of {#limit}",
        "string.max": "Password must have a maximum length of {#limit}",
      }),
      // "g-recaptcha-response": Joi.string().required().messages({
      //   "string.empty": "reCaptcha cannot be empty",
      //   "any.required": "reCaptcha is required",
      // }),
      password2: Joi.ref("password"),
    })
      .with("password", "password2")
      .messages({
        "any.only": "Passwords must match",
      });

    const { value, error } = schema.validate(req.body);
    
    if (error) {
      res.render("users/register", {
        errors: error.details,
        email: value.email,
      });
    } else {
      const { email, password } = value;

      // if (!(await verifyRecaptchaV2(value["g-recaptcha-response"])))
      //   return res.render("users/login", {
      //     errors: [
      //       {
      //         message: "Invalid reCaptcha",
      //       },
      //     ],
      //     email,
      //   });

      const user = await User.findOne({ email });

      if (user) {
        res.render("users/register", {
          errors: [{ message: "Email already exists" }],
          email,
        });
      } else {
        // Create the new User.
        const newUser = new User({
          email,
          password,
          subscription_data: {
            balance: 10,
            current_period_end: null,
            active: false,
          },
        });

        // Save the User & Redirect.
        await newUser.save();

        req.flash("success_msg", "You are now registered and can log in");
        res.redirect("/users/login");
      }
    }
  }
);

router.get("/profile", isAuthenticated, csrfProtection, (req, res, next) => {
  res.render("users/profile");
});

router.post("/profile", isAuthenticated, csrfProtection, async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email cannot be empty",
      "any.required": "Email is required",
    }),
  });

  const { value, error } = schema.validate(req.body);

  if (error) {
    res.render("users/profile", {
      errors: error.details,
      email: value.email,
    });
  } else {
    // Find user and update the email
    await User.findOneAndUpdate(
      { _id: req.session.user._id },
      { email: value.email }
    );

    // Update the session email
    req.session.user.email = value.email;

    req.flash("success_msg", "Successfully changed email");
    res.redirect("/users/profile");
  }
});

router.get("/change_password", isAuthenticated, csrfProtection, (req, res) => {
  res.render("users/change_password");
});

router.post(
  "/change_password",
  isAuthenticated,
  csrfProtection,
  async (req, res) => {
    const schema = Joi.object({
      password: Joi.string().required().messages({
        "string.empty": "Password cannot be empty",
        "any.required": "Password is required",
      }),
      password2: Joi.ref("password"),
    })
      .with("password", "password2")
      .messages({
        "any.only": "Passwords must match",
      });

    const { value, error } = schema.validate(req.body);

    if (error) {
      res.render("users/change_password", {
        errors: error.details,
      });
    } else {
      // Find the user
      const user = await User.findOne({ _id: req.session.user._id });

      // Update the password
      user.password = value.password;

      // Save the user, should hit the User model pre save hook
      await user.save();

      req.flash(
        "success_msg",
        "Successfully changed password, please login with new password"
      );
      req.session.destroy();
      res.redirect("/users/login");
    }
  }
);

router.get(
  "/reset_password",
  forwardAuthenticated,
  csrfProtection,
  (req, res) => {
    res.render("users/reset_password");
  }
);

router.post(
  "/reset_password",
  forwardAuthenticated,
  csrfProtection,
  async (req, res) => {
    const schema = Joi.object({
      email: Joi.string().required().messages({
        "string.empty": "Email cannot be empty",
        "any.required": "Email is required",
      }),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      res.render("users/reset_password", {
        errors: error.details,
      });
    } else {
      // Find the user
      const user = await User.findOne({ email: value.email });

      // User with this email exists
      if (user) {
        // Create the token
        const token = uuidv4();

        // Create the password reset document
        const passwordReset = new PasswordReset({
          userId: user._id,
          passwordResetToken: token,
          expiration: moment.utc().add(1, "hours"),
        });

        // Save the password reset document
        await passwordReset.save();

        // Send the password reset link to the email specified
        await sendEmail({
          to: user.email,
          templateId: "d-89e7d03550f046c8817a9a051d701c35",
          dynamic_template_data: {
            passwordResetLink: `${APP_URL}/users/reset_password/${token}`,
          },
        });

        req.flash("success_msg", "Password reset sent to your email");
        res.redirect("/users/reset_password");
      } else {
        req.flash("error_msg", "User not found");
        res.redirect("/users/reset_password");
      }
    }
  }
);

router.get(
  "/reset_password/:token",
  forwardAuthenticated,
  csrfProtection,
  async (req, res) => {
    const passwordReset = await PasswordReset.findOne({
      passwordResetToken: req.params.token,
    });

    if (passwordReset) {
      const expireTime = moment.utc(passwordReset.expiration);
      const currentTime = new Date();

      // Password reset token expired
      if (currentTime > expireTime) {
        req.flash("error_msg", "Password reset token expired");
        res.render("users/reset_password");
      } else {
        res.render("users/reset_password_token", {
          token: req.params.token,
        });
      }
    } else {
      req.flash("error_msg", "Password reset token invalid");
      res.render("users/reset_password");
    }
  }
);

router.post(
  "/reset_password/:token",
  forwardAuthenticated,
  csrfProtection,
  async (req, res, next) => {
    const schema = Joi.object({
      password: Joi.string().required().messages({
        "string.empty": "Password cannot be empty",
        "any.required": "Password is required",
      }),
      password2: Joi.ref("password"),
    })
      .with("password", "password2")
      .messages({
        "any.only": "Passwords must match",
      });

    const { value, error } = schema.validate(req.body);

    if (error) {
      next();
    } else {
      const passwordReset = await PasswordReset.findOne({
        passwordResetToken: req.params.token,
      });

      // Password reset exists
      if (passwordReset) {
        // Find the user
        const user = await User.findOne({ _id: passwordReset.userId });

        // Update the password
        user.password = value.password;

        // Save the user, should hit the User model pre save hook
        await user.save();

        req.flash(
          "success_msg",
          "Successfully changed password, please login with new password"
        );
        res.redirect("/users/login");
      } else {
        next();
      }
    }
  }
);

router.get("/logout", isAuthenticated, (req, res) => {
  req.session.destroy();
  // getting req.flash requires sessions
  //req.flash("success_msg", "Successfully logged out!");
  res.redirect("/users/login");
});

module.exports = router;
