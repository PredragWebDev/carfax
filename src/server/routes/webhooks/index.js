const express = require("express");
const router = express.Router();
const { getCarFax, getVINFromPlate } = require("../../classes/carfax-api");
const Report = require("../../models/Report");
const User = require("../../models/User");
const { log } = require("../../classes/log");
const { sendErrorEmail, sendEmail } = require("../../classes/email");

  router.post("/selly", async (req, res) => {
    // TODO: Verify selly sig
    const sellySignature = req.headers["x-selly-signature"];
  
    const { customer_email, product_title, custom_fields } = req.body.data;
  
    let PLATE,
      STATE = undefined;
  
    // Loop through all custom fields and get the VIN field
    // Then fetch the CARFAX report for that VIN and return the URL
    if (custom_fields && Object.keys(custom_fields).length > 0) {
      // VIN Request
      if (Object.keys(custom_fields).length === 1) {
        // Make vin uppercase as shit complains and returns "A valid VIN is required" is not all uppercase
        const VIN = custom_fields['VIN'].toUpperCase();
  
        console.log(`Received single report callback for VIN: ${VIN}`);
  
        // Get CARFAX report for the VIN from this order
        const {
          Carfax,
          desktopReportHtml,
          yearMakeModel,
          error,
        } = await getCarFax(VIN);
  
        if (error) {
          // If user has an account with the purchasing email then add a credit

          const user = await User.findOne({ customer_email });
  
          if (user)
            await user.updateOne({
              "subscription_data.balance":
                Number(user.subscription_data.balance) + 1,
            });
  
          log({
            status: "error",
            type: "Selly Webhook: Purchased Single Report",
            data: JSON.stringify(
              { VIN, error, report: { Carfax: Carfax || null } },
              null,
              2
            ),
            user: null,
          });
  
          await sendErrorEmail(customer_email);
  
          res.send(error);
        } else {
          // Create the report
          const report = await new Report({
            VIN,
            yearMakeModel,
            desktopReportHtml,
            // mobileReportHtml,
            // carFax: Carfax,
          });
  
          // Save into DB
          await report.save();
  
          // Check if the user already has an account
          const user = await User.findOne({ customer_email });
  
          // If the user exists add the report to the users dashboard
          if (user) {
            await User.findOneAndUpdate(
              { _id: user._id },
              {
                $addToSet: { reports: report._id },
              }
            );
          }
  
  
          log({
            status: "info",
            type: `Selly Webhook: Purchased Single Report`,
            data: JSON.stringify(
              {
                customer_email,
                VIN,
                report: {
                  ID: report.id.toUpperCase(),
                  yearMakeModel,
                  // Carfax,
                },
              },
              null,
              2
            ),
            user: user ? user._id : null,
          });
  
          // Send email to make sure user gets report
          await sendEmail({
            to: customer_email,
            templateId: "d-3c3876140e6149aca89f280e53163ec6",
            dynamicTemplateData: {
              VIN:VIN,
              reportUrl: `${
                process.env.APP_URL
              }/report/${report.id.toUpperCase()}`,
            },
          });
 
          // Return the URL
          return res.send(
            `${process.env.APP_URL}/report/${report.id.toUpperCase()}`
          );
        }
      }
      // PLATE + STATE
      else if (Object.keys(custom_fields).length === 2) {
        PLATE = custom_fields["PLATE"];
        STATE = custom_fields["STATE"];
  
        // Plate + state exists, lets get VIN for it
        //console.log(`Received single report callback for PLATE: ${PLATE} + STATE: ${STATE}`);
  
        const VINFromPlate = await getVINFromPlate(PLATE, STATE);
  
        // Couldn't get VIN from PLATE + STATE
        if (VINFromPlate.error) {
          log({
            status: "error",
            type: "Selly Webhook: Purchased Single Report",
            data: JSON.stringify(
              {
                PLATE,
                STATE,
                error: VINFromPlate.error,
                report: { Carfax: Carfax || null },
              },
              null,
              2
            ),
            user: null,
          });
  
          res.send(VINFromPlate.error);
        } else {
          //console.log(`Got VIN from PLATE + STATE : ${VINFromPlate.VIN}`);
  
          // Get CARFAX report for the VIN from this order
          const {
            // Carfax,
            desktopReportHtml,
            // mobileReportHtml,
            yearMakeModel,
            error,
          } = await getCarFax(VINFromPlate.VIN);
  
          if (error) {
            // If user has an account with the purchasing email then add a credit
            const user = await User.findOne({ customer_email });
  
            if (user)
              await user.updateOne({
                "subscription_data.balance":
                  Number(user.subscription_data.balance) + 1,
              });
  
            log({
              status: "error",
              type: "Selly Webhook: Purchased Single Report",
              data: JSON.stringify(
                {
                  PLATE,
                  STATE,
                  VIN: VINFromPlate.VIN,
                  error,
                  // report: { Carfax: Carfax || null },
                },
                null,
                2
              ),
              user: null,
            });
  
            //console.log(error);
            await sendErrorEmail(customer_email);
  
            res.send(error);
          } else {
            // Create the report
            const report = await new Report({
              VIN: VINFromPlate.VIN,
              yearMakeModel,
              desktopReportHtml,
              // mobileReportHtml,
              // carFax: Carfax,
            });
  
            // Save into DB
            await report.save();
  
            // Check if the user already has an account
            const user = await User.findOne({ customer_email });
  
            // If the user exists add the report to the users dashboard
            if (user) {
              await User.findOneAndUpdate(
                { _id: user._id },
                {
                  $addToSet: { reports: report._id },
                }
              );
            }
  
            //console.log(`Report URL: ${process.env.APP_URL}/report/${report.id.toUpperCase()}`);
  
            log({
              status: "info",
              type: `Selly Webhook: Purchased Single Report`,
              data: JSON.stringify(
                {
                    customer_email,
                  PLATE,
                  STATE,
                  VIN: VINFromPlate.VIN,
                  report: {
                    ID: report.id.toUpperCase(),
                    yearMakeModel,
                    // Carfax,
                  },
                },
                null,
                2
              ),
              user: user ? user._id : null,
            });
  
            // Send email to make sure user gets report
            await sendEmail({
              "to": customer_email,
              "subject": `CARFAX Report for PLATE ${PLATE} | STATE ${STATE} | VIN ${VINFromPlate.VIN}`,
              "text": `
  Your order for PLATE: ${PLATE} + STATE: ${STATE} = VIN: ${VINFromPlate.VIN}
  Access your report here: ${
                process.env.APP_URL
              }/report/${report.id.toUpperCase()}
  
  Thanks for purchasing!`,
            });
  
            // Return the URL
            return res.send(
              `${process.env.APP_URL}/report/${report.id.toUpperCase()}`
            );
          }
        }
      }
    }
    // User ordered reports or unlimited instead of a single VIN
    else {
      const user = await User.findOne({ customer_email });
  
      if (user) {
        let date = new Date();
        date.setDate(date.getDate() + 30);
  
        const productTitle = String(product_title).toLowerCase();
        let balance = 0;
  
        // Unlimited reports so lets add hella
        if (productTitle.includes("Unlimited".toLowerCase())) {
          balance = 99999;
          //console.log(`Received callback for Unlimited Reports for user ${email}`);
        }
        // Parse the amount of reports from the title
        else {
          balance = Number(productTitle.split(" Report".toLowerCase())[0]);
          //console.log(`Received callback for ${balance} Reports for user ${email}`);
        }
  
        await user.updateOne({
          subscription_data: {
            balance: Number(user.subscription_data.balance) + balance,
            current_period_end: date,
            active: true,
          },
        });
  
        log({
          status: "info",
          type: `Selly Webhook: Purchased ${
            balance === 99999 ? "Unlimited" : balance
          } Reports`,
          data: JSON.stringify({ customer_email }, null, 2),
          user: user._id,
        });
  
        // Success email
        sendEmail({
          "to": customer_email,
          "templateId": "d-3c3876140e6149aca89f280e53163ec6",
        });
        res.send("Successfully upgraded your account!");
      }
      // Retard didn't make an account like supposed to
      else {
        sendEmail({
          "to": customer_email,
          "templateId": "d-3c3876140e6149aca89f280e53163ec6",
        });
        res.send("Email does not exist, please contact support!");
      }
    }
  });


module.exports = router;
