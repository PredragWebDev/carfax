const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // The user that requested this report
    // Not required if single report
    userId: {
      type: mongoose.Types.ObjectId,
      required: false,
    },
    // The VIN the user requested the report for
    VIN: {
      type: String,
      required: true,
    },
    // The year make model of the VIN the report is for
    yearMakeModel: {
      type: String,
      required: true,
    },
    // The desktop html data of the CARFAX report
    desktopReportHtml: {
      type: String,
      required: true,
    },
    // // The mobile html data of the CARFAX report
    // mobileReportHtml: {
    //   type: String,
    //   required: true,
    // },
    // Deprecated old html for just desktop version
    html: {
      type: String,
      required: false,
    },
    // The data returned by the CARFAX API
    carFax: {
      CarfaxHasReport: Boolean,
      CarfaxExpirationDate: Date,
      CarfaxHasMajorProblems: Boolean,
      CarfaxHasCleanTitle: Boolean,
      CarfaxHasOneOwner: Boolean,
      CarfaxHasTotalLoss: Boolean,
      CarfaxHasFrameDamage: Boolean,
      CarfaxHasAirbagDeployment: Boolean,
      CarfaxHasOdometerRollback: Boolean,
      CarfaxHasAccidentIndicators: Boolean,
      CarfaxHasDamage: Boolean,
      CarfaxHasManufacturerRecall: Boolean,
      NumberOfOwners: Number,
      result: String,
      text: String,
      showWindow: Boolean,
      reloadGrid: Boolean,
      vin: String,
      CarfaxStatusCode: Number,
      reportType: String,
      url: String,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Report", reportSchema);
