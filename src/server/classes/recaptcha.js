const got = require("got");

const verifyRecaptchaV2 = async (response) => {
  const result = await got({
    url: "https://www.google.com/recaptcha/api/siteverify",
    method: "POST",
    searchParams: { secret: process.env.RECAPTCHA_SECRET, response },
    responseType: "json",
  });

  return result.body.success;
};

module.exports = { verifyRecaptchaV2 };
