const Sentry = require("@sentry/node");
const sgMail = require("@sendgrid/mail");

const { SENDGRID_API_KEY, NODE_ENV } = process.env;


if (!SENDGRID_API_KEY) {
  throw new Error(
    "The sendgrid api key has not been set in the environment variables"
  );
}

// Set api key for SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async (opts) => {

  try {
    // Subject and email html comes from templateId @ SendGrid
    const msg = {
      "from": "noreply@buycarfax.com",
      ...opts,
    };
  
    sgMail.send(msg)
      .then(() => console.log('Email sent'))
      .catch((error) => console.error(error));
  } catch (err) {
    Sentry.captureException(err);
  }
};

const sendErrorEmail = async (email) => {
  try {
    const msg = {
      "from": "noreply@buycarfax.com",
      "to": email,
      "templateId": "d-3c3876140e6149aca89f280e53163ec6",
    };

    if (NODE_ENV !== "production")
      msg.mailSettings = { sandboxMode: { enable: true } };

    await sgMail.send(msg);
  } catch (err) {
    Sentry.captureException(err);
  }
};

module.exports = {
  sendErrorEmail,
  sendEmail,
};
