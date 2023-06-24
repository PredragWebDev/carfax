const Sentry = require("@sentry/node");
const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");
const Transport = require("nodemailer-brevo-transport");

const { NODEMAILER_API_KEY, SENDGRID_API_KEY, NODE_ENV } = process.env;


if (!NODEMAILER_API_KEY) {
  throw new Error(
    "The sendgrid api key has not been set in the environment variables"
  );
}

// Set api key for SendGrid
// sgMail.setApiKey(SENDGRID_API_KEY);

const transporter = nodemailer.createTransport(
  new Transport({ apiKey: NODEMAILER_API_KEY })
);

const sendEmail = async (opts) => {

  try {
    // Subject and email html comes from templateId @ SendGrid
    const msg = {
      "from": "noreply@buycarfax.com",
      ...opts,
    };
  
    transporter.sendMail(msg, (error, info) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // sgMail.send(msg)
    //   .then(() => console.log('Email sent'))
    //   .catch((error) => console.error(error));
  } catch (err) {
    Sentry.captureException(err);
  }
};

const sendErrorEmail = async (email) => {
  try {
    const msg = {
      "from": "noreply@buycarfax.com",
      "to": email,
      "templateId": "2",
    };

    if (NODE_ENV !== "production")
      msg.mailSettings = { sandboxMode: { enable: true } };

      transporter.sendMail(msg, (error, info) => {
        if (error) {
          console.log('Error:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    // await sgMail.send(msg);
  } catch (err) {
    Sentry.captureException(err);
  }
};

module.exports = {
  sendErrorEmail,
  sendEmail,
};
