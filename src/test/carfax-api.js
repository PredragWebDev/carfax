require("dotenv").config({ path: "local.env" });
const test = require("ava");
const {
  login,
  isStillLoggedIn,
  getReport,
  getVINFromPlate,
} = require("../server/classes/carfax-api");

const { DEALER_USERNAME, DEALER_PASSWORD, DEALER_NAME } = process.env;

test.before((t) => {
  t.context.carfaxReports = [];
});

test.serial("can check if still logged in false", async (t) => {
  const result = await isStillLoggedIn();
  t.false(result);
});

test.serial("can login into dealer account", async (t) => {
  const result = await login(DEALER_USERNAME, DEALER_PASSWORD);
  t.true(result);
});

test.serial("can check if still logged in true", async (t) => {
  const result = await isStillLoggedIn();
  t.true(result);
});

test.serial("can get carfax report for newer VIN", async (t) => {
  const report = await getReport("ZHWUC1ZF2FLA03487");

  t.falsy(report.error);
  t.true(report.desktopReportHtml.length > 1000);
  t.true(report.mobileReportHtml.length > 1000);
  t.is(report.yearMakeModel, "2015 LAMBORGHINI HURACAN");

  t.context.carfaxReports.push(report);
});

test.serial("can get carfax report for older VIN", async (t) => {
  const report = await getReport("WBACB3314NFE02251");

  t.falsy(report.error);
  t.true(report.desktopReportHtml.length > 1000);
  t.true(report.mobileReportHtml.length > 1000);
  t.is(report.yearMakeModel, "1992 BMW 325I");

  t.context.carfaxReports.push(report);
});

test.serial("can get error carfax report for wrong VIN", async (t) => {
  const report = await getReport("WBACB3314NFE02252");
  t.truthy(report.error);
  t.is(report.error, "CARFAX returned an error for this VIN");
});

test.serial(
  "patched desktop report(s) do not contain dealer name",
  async (t) => {
    for (const report of t.context.carfaxReports) {
      t.false(
        report.desktopReportHtml
          .toLowerCase()
          .includes(DEALER_NAME.toLowerCase())
      );
    }
  }
);

test.serial(
  "patched mobile report(s) do not contain dealer name",
  async (t) => {
    for (const report of t.context.carfaxReports) {
      t.false(
        report.mobileReportHtml
          .toLowerCase()
          .includes(DEALER_NAME.toLowerCase())
      );
    }
  }
);

test.serial("can get VIN from plate+state", async (t) => {
  const result = await getVINFromPlate("L91HPN", "NJ");
  t.is(result.error, null);
  t.is(result.VIN, "1HGCR2F50DA171964");
});

test.serial("can fail getting VIN from plate+state", async (t) => {
  const result = await getVINFromPlate("L91HPN69", "NJ");
  t.is(result.error, "No VIN found.");
});
