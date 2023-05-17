const got = require("got");
const cheerio = require("cheerio");
const Sentry = require("@sentry/node");
const { CookieJar } = require("tough-cookie");
const { performance } = require("perf_hooks");
const Settings = require("../models/Settings");
const fetch = require('node-fetch');

const https = require('https')


const { DEALER_USERNAME, DEALER_PASSWORD, NODE_ENV } = process.env;

let cookieJar;
let session;
let entityId = null;

const getLatestSession = async () => {
  const settings = NODE_ENV !== "test" ? await Settings.findOne({}) : {};

  if (settings.cookies) {
    cookieJar = CookieJar.fromJSON(settings.cookies);
    entityId = cookieJar
      .getCookiesSync("https://vauto.com")
      .find((cookie) => cookie.key == "CurrentEntity").value;
  } else if (!session || !cookieJar) cookieJar = new CookieJar();

  session = got.extend({
    cookieJar: cookieJar,
  });

  return true;
};

const isStillLoggedIn = async () => {
  await getLatestSession();

  const response = await session(
    "https://www2.vauto.com/Va/Appraisal/Default.aspx?new=true",
    {
      headers: {
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": 1,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
      followRedirect: false,
    }
  );

  if (
    response.headers.location &&
    response.headers.location.includes("/Va/Share/Login.aspx")
  ) {
    //console.log("Session expired!");
    return false;
  }

  return true;
};

const login = async (username, password) => {
  //console.log("Logging in...");

  // This page redirects to the OAuth url
  const response02 = await session(
    "https://www2.vauto.com/Va/api/vauto/oauth2Callback/V1/landingPage",
    {
      headers: {
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": 1,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }
  );

  //console.log(response02.url);

  let $ = cheerio.load(response02.body);
  const params = $('div[id="params"]');

  const response1 = await session(
    "https://vauto.signin.coxautoinc.com/signin",
    {
      method: "POST",
      headers: {
        Connection: "keep-alive",
        Accept: "application/vnd.coxauto.v1+json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
        "Content-Type": "application/vnd.coxauto.v1+json",
        Origin: "https://vauto.signin.coxautoinc.com",
        Referer:
          "https://vauto.signin.coxautoinc.com/?solutionID=VAT_prod&clientId=fa9a52ac-a979-4501-bcdd-e5deb59df779",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
      json: {
        client_id: params.attr("data-client_id"),
        response_type: "code",
        scope: "openid",
        redirect_uri:
          "https://authorize.coxautoinc.com/oauth2/v1/authorize/callback",
        state: params.attr("data-state"),
        solutionid: "VAT_prod",
        authenticationProvider: "VAT_prod",
        username,
        password,
        transactionId: params.attr("data-transactionid"),
      },
      responseType: "json",
    }
  );

  // Get redirectUrl
  const redirectUrl = response1.body.redirectUrl;

  //console.log(`Got redirectUrl: ${redirectUrl}`);

  try {
    const response2 = await session(redirectUrl, {
      headers: {
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": 1,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        Referer:
          "https://vauto.signin.coxautoinc.com/?solutionID=VAT_prod&clientId=fa9a52ac-a979-4501-bcdd-e5deb59df779",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
      hooks: {
        beforeRedirect: [
          (options, response) => {
            // Don't need to load the last url it wastes another 1-2 seconds
            if (options.url.pathname === "/Va/Appraisal/Default.aspx")
              throw new Error("Last URL");
          },
        ],
      },
    });
  } catch (err) {}

  //console.log(response2.url);

  // Get entityId from cookies after login
  entityId = cookieJar
    .getCookiesSync("https://vauto.com")
    .find((cookie) => cookie.key == "CurrentEntity").value;

  //console.log(`Got entityId: ${entityId}`);

  return true;
};

const loginWithInfo = async () => {
  // Clear cookieJar + session before logging in again
  cookieJar = new CookieJar();
  session = got.extend({
    cookieJar: cookieJar,
  });

  await login(DEALER_USERNAME, DEALER_PASSWORD);

  // Set new cookies
  if (NODE_ENV !== "test")
    await Settings.updateMany(
      {},
      { cookies: cookieJar.toJSON() },
      { upsert: true }
    );
};

const getCarFaxReport = async (VIN) => {
  const response = await session(
    "https://www2.vauto.com/Va/Appraisal/LinkDataHandler.ashx",
    {
      method: "POST",
      headers: {
        Connection: "keep-alive",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://www2.vauto.com",
        Referer: "https://www2.vauto.com/Va/Appraisal/Default.aspx?new=true",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
      form: {
        // EntityId looks like id of employee that we are signing in with
        // Getting it dynamically from cookies after login now
        data: `{"Carfax":{"Vin":"${VIN}","EntityId":"${entityId}"}}`,
      },
      // Don't follow redirects so we don't waste time and know if logged in / not
      followRedirect: false,
    }
  );

  // Still logged in
  if (response.statusCode === 200) {
    if (response.body.includes("error")) {
      return JSON.parse(response.body);
    } else {
      // Get the expire date from the string
      const expireDate = Number(
        response.body.split("new Date(")[1].split(")")[0]
      );

      // Replace that shit
      const newJSON = response.body.replace(
        `new Date(${expireDate})`,
        `"${new Date(expireDate).toJSON()}"`
      );

      return JSON.parse(newJSON);
    }
  }
  // Logged out now
  else if (response.statusCode === 302) {
    //console.log("Not logged in anymore, logging in again!");
    await loginWithInfo();
    return await getCarFaxReport(VIN);
  }
};

const getCarFaxHtml = async (url) => {
  const desktopReportHtml = (
    await got(url, {
      headers: {
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": 1,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })
  ).body;

  const mobileReportHtml = (
    await got(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1",
        "Accept-Language": "en-us",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
    })
  ).body;

  return {
    desktopReportHtml,
    mobileReportHtml,
  };
};

const patchReport = (html, reportType) => {
  const allUrls = String(html).match(/[^"]*media.carfax.com[^"]*/g);

  if (allUrls) {
    //console.log(`Found ${allUrls.length} urls in ${reportType} html`);

    for (const url of allUrls) {
      let urlWithoutCarfax = url.replace("https://media.carfax.com/", "");

      if (urlWithoutCarfax.includes("media.carfax")) {
        urlWithoutCarfax = url.replace("//media.carfax.com/", "");
      }

      html = html.replace(
        url,
        `${process.env.APP_URL}/assets/carfax/${urlWithoutCarfax}`
      );
    }
  }

  const $ = cheerio.load(html);

  if (reportType === "desktop") {
    const DesktopIdsToRemove = [
      "headerHat",
      "oneprice",
      // Don't remove car wholesale value from html
      //"value-container",
      "headerSectionNameInLights",
      "tab_ws",
      "tabws",
      "tab_wc",
      "tabwc",
      "tab_bbg",
      "tabbbg",
      "nav > div:nth-child(3)",
      "dealer-name-in-lights",
      "print-only-nil",
    ];

    for (let id of DesktopIdsToRemove) {
      $(`#${id}`).remove();
    }
  } else if (reportType === "mobile") {
    const mobileIdsToRemove = [
      "oneprice",
      // Same as above
      //"value-container",
      "dealer-name-in-lights",
      "print-only-nil",
    ];

    for (let id of mobileIdsToRemove) {
      $(`#${id}`).remove();
    }

    // Remove mobile dealer info
    $(`.nil`).remove();
  }

  const desktopOnePrice = "document.getElementById('oneprice')";
  const mobileOnePrice = 'document.getElementById("oneprice")';

  // Loop through each script and remove the script
  // If it includes oneprice we remove it as it includes dealer info
  $("script").each((i, elem) => {
    if ($(elem).html().includes("oneprice")) {
      const html = $(elem).html();
      const val = html
        .substring(
          html.indexOf(
            reportType === "desktop" ? desktopOnePrice : mobileOnePrice
          )
        )
        .substring(0, html.lastIndexOf("};"));

      $(elem).replaceWith(
        `<script>${$(elem).html().replace(val, "")}</script>`
      );
      //$(elem).remove();
    }
  });

  return $.html();
};

const getYearMakeModel = (html) => {
  const $ = cheerio.load(html);

  const yearMakeModel = $('.vehicle-information-year-make-model').text()

  return yearMakeModel;
};

const getYearMakeModel_fromAutoCheck = (html) => {
  const $ = cheerio.load(html);

  const yearMakeModel = $('.make-year-title').text()

  return yearMakeModel;
};

const getCarFax = async (VIN) => {

  api_key = "mmFRGgxW.5A0bmbzql6szYhwJEOWbi7zSGn6ujAUD";

  // vin_number = "5YJ3E1EA9NF240937"

  vin_number = VIN

  const options = {
    hostname: 'api.lot.report',
    path: `/get_carfax/?vin=${vin_number}`,
    headers: {
      'Authorization': `Api-Key ${api_key}`
    }
  };

  try {
  
    const vinData = await new Promise((resolve, reject) => {
      https.get(options, (res) => {
        let data = "";
        res.on('data', (d) => {
          data += d;
        });
        res.on("end", () => {
          
          resolve(JSON.parse(data));
        });
      }).on('error', (e) => {
        reject(e);
      });
    });

    console.log("vindata=>>>", vinData)

    if (vinData.error !== 'false') {

      return { error: "CARFAX returned an error for this VIN" };
    } else {
      const Carfax = Buffer.from(vinData.html, 'base64').toString('utf-8');
      let desktopReportHtml = Carfax

      const yearMakeModel = getYearMakeModel(Carfax);
      return {
        Carfax,
        desktopReportHtml,
        yearMakeModel,
      };
    }

  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    return {
      error: "Could not retrieve your report, please try again!",
    };
  }
};

const getAutoCheck = async (VIN) => {

  api_key = "mmFRGgxW.5A0bmbzql6szYhwJEOWbi7zSGn6ujAUD";

  // vin_number = "5YJ3E1EA9NF240937"

  const options = {
    hostname: 'api.lot.report',
    path: `/get_autocheck/?vin=${VIN}`,
    headers: {
      'Authorization': `Api-Key ${api_key}`
    }
  };

  try {
  
    const vinData = await new Promise((resolve, reject) => {
      https.get(options, (res) => {
        let data = "";
        res.on('data', (d) => {
          data += d;
        });
        res.on("end", () => {
          
          resolve(JSON.parse(data));
        });
      }).on('error', (e) => {
        reject(e);
      });
    });


    if (vinData.error === 'true') {

      return { error: "CARFAX returned an error for this VIN" };
    } else {
      const Carfax = Buffer.from(vinData.html, 'base64').toString('utf-8');
      let desktopReportHtml = Carfax

      const yearMakeModel = getYearMakeModel_fromAutoCheck(Carfax);
      return {
        Carfax,
        yearMakeModel,
        desktopReportHtml,
        yearMakeModel,
      };
    }

  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    return {
      error: "Could not retrieve your report, please try again!",
    };
  }
};
const getVINFromPlate = async (plate, state) => {
  try {
    const response = await got(
      `https://consumerapi.carfax.com/hbv/cow/vins?plate=${plate}&state=${state}`
    ).json();

    // Plate found
    if (response.length > 0 && response[0].vin) {
      return { error: null, VIN: response[0].vin };
    } else {
      Sentry.captureException(err);
      return { error: "Failed to get VIN, please try again later!" };
    }
  } catch (err) {
    if (err.response.statusCode === 404) return { error: "No VIN found." };
    else {
      Sentry.captureException(err);
      return { error: "Failed to get VIN, please try again later!" };
    }
  }
};


module.exports = {
  isStillLoggedIn,
  login,
  loginWithInfo,
  getCarFaxReport,
  getCarFaxHtml,
  patchReport,
  getYearMakeModel,
  getCarFax,
  getAutoCheck,
  getVINFromPlate,
  //vinSuggestions,
  //vinCheck,
};
