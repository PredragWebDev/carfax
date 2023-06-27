const express = require("express");
const router = express.Router();
const { getCarFax, getVINFromPlate } = require("../../classes/carfax-api");
const Report = require("../../models/Report");
const User = require("../../models/User");
const Log = require("../../models/Log");
const Webhooks = require("../../models/WebhooksID");
const { log } = require("../../classes/log");
const { sendErrorEmail, sendEmail } = require("../../classes/email");

  router.post("/selly", async (req, res) => {
    // TODO: Verify selly sig
    // const sellySignature = req.headers["x-selly-signature"];

    let customer_email = ""
    let product_title = ""
    let VIN =""
    let flag = 0

    // if (req.body.webhookType === 'ONETIME_PAID') {
    //   VIN = req.body.payload;
    // }

    const webhook = await Webhooks.findOne({webhooksID:req.body.webhookId})

    if(!webhook) {

      if (req.body.webhookType == 'ONETIME_PAID') {
      // if (req.body.event == 'order.created') {
  
        // customer_email = req.body.data.customer_information.email
        customer_email = req.body.email;
        const user = await User.findOne({ email:customer_email });
  
        if (user) {
          flag = new Date() - user.updatedAt
        }
        else {
          const user = await Log.findOne({user:customer_email})
          
          if (user) {
            console.log('user exist!')
            flag = new Date() - user.updatedAt
  
            console.log('flag>>>>', flag);
          }
          else {
            flag = 200000
          }
        }
  
        // if (user) {
          if ( flag > 100000 ) {
  
            // if (req.body.data.product_variants[0].additional_information.length == 0) {
            //   const qty = req.body.data.product_variants[0].quantity
            //   const total_price = req.body.data.payment.full_price.base
            //   const product_price  = total_price/qty
      
            //   let balance = 0
        
            //   switch (product_price) {
            //     case 599:
            //       balance = qty
            //       break;
            //     case 1575:
            //       balance = qty * 3
            //       break;
            //     case 5050:
            //       balance = qty * 10
            //       break;
            //     case 8700:
            //       balance = qty * 25
            //       break;
            //     case 21700:
            //       balance = qty * 75
            //       break;
            //     case 39000:
            //       balance = qty * 100
            //       break;
            //     case 45000:
            //       balance = qty * 150
            //       break;
            //     case 55000:
            //       balance = qty * 200
            //       break;
            //     default:
            //       balance = qty
            //       break;
            //   }
  
            //   if (user) {
            //     const now = new Date();
            //     const futureDate = new Date(now.setDate(now.getDate() + 90));
            //     console.log('expire date', futureDate);
  
            //     await user.updateOne({
            //       "subscription_data.balance":
            //         Number(user.subscription_data.balance) + balance,
            //       "subscription_data.current_period_end":futureDate,
            //       "subscription_data.active":true
            //     });
            //   }
  
            //   log({
            //     status: "info",
            //     type: `Selly Webhook: Purchased Balances`,
            //     data: JSON.stringify(
            //       {
            //         customer_email,
            //         balance,
            //       },
            //       null,
            //       2
            //     ),
            //     user: user ? user._id : customer_email,
            //   });
  
            //   await sendEmail({
            //     to: customer_email,
            //     subject:'Purchased Balances',
            //     text:`Congratulations! \nYou have successfully purchased ${balance} balances`
            //   });
              
            // }
            if (req.body.productName === 'Instant Service') {
              // VIN = req.body.data.product_variants[0].additional_information[0].value;
              VIN = req.body.payload;
          
              // Loop through all custom fields and get the VIN field
              // Then fetch the CARFAX report for that VIN and return the URL
              if (VIN.length === 17 && !isValidVin(VIN)) {
              // if (VIN !== 'vin' && VIN !== 'VIN' && VIN !== 'test') {
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
        
                  const user = await User.findOne({ email:customer_email });
          
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

                  const newWebhook = new Webhooks({webhooksID:req.body.webhookID, user:customer_email});
                  await newWebhook.save();
                  res.status(200).send('Webhook received successfully');
          
                  res.send(error);
                } else {
                  // Create the report
                  const report = await new Report({
                    VIN,
                    yearMakeModel,
                    desktopReportHtml,
                  });
          
                  // Save into DB
                  await report.save();
          
                  // Check if the user already has an account
                  const user = await User.findOne({ email:customer_email });
          
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
                        },
                      },
                      null,
                      2
                    ),
                    user: user ? user._id : customer_email,
                  });
          
                  // Send email to make sure user gets report
                  await sendEmail({
                    to: customer_email,
                    // templateId: "d-3c3876140e6149aca89f280e53163ec6",
                    templateId: 1,
                    subject:"Your order has been received",
                    params: {
                      VIN:VIN,
                      reportUrl: `${
                        process.env.APP_URL
                      }/report/${report.id.toUpperCase()}`,
                    },
                    headers: {
                      'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2'
                    }
                  });
                  const newWebhook = new Webhooks({webhooksID:req.body.webhookId, user:customer_email});
                  await newWebhook.save();
                  
                }
                // User ordered reports or unlimited instead of a single VIN
                // else {
                //   const user = await User.findOne({ email:customer_email });
              
                //   if (user) {
                //     let date = new Date();
                //     date.setDate(date.getDate() + 30);
              
                //     const productTitle = String(product_title).toLowerCase();
                //     let balance = 0;
              
                //     // Unlimited reports so lets add hella
                //     if (productTitle.includes("Unlimited".toLowerCase())) {
                //       balance = 99999;
                //       //console.log(`Received callback for Unlimited Reports for user ${email}`);
                //     }
                //     // Parse the amount of reports from the title
                //     else {
                //       balance = Number(productTitle.split(" Report".toLowerCase())[0]);
                //       //console.log(`Received callback for ${balance} Reports for user ${email}`);
                //     }
              
                //     await user.updateOne({
                //       subscription_data: {
                //         balance: Number(user.subscription_data.balance) + balance,
                //         current_period_end: date,
                //         active: true,
                //       },
                //     });
              
                //     log({
                //       status: "info",
                //       type: `Selly Webhook: Purchased ${
                //         balance === 99999 ? "Unlimited" : balance
                //       } Reports`,
                //       data: JSON.stringify({ customer_email }, null, 2),
                //       user: user._id,
                //     });
              
                //     // Success email
                //     sendEmail({
                //       "to": customer_email,
                //       "templateId": "d-3c3876140e6149aca89f280e53163ec6",
                //     });
                //     res.send("Successfully upgraded your account!");
                //   }
                //   // Retard didn't make an account like supposed to
                //   else {
                //     sendEmail({
                //       "to": customer_email,
                //       "templateId": "d-3c3876140e6149aca89f280e53163ec6",
                //     });
                //     res.send("Email does not exist, please contact support!");
                //   }
                // }
              }
            } else {
              await sendErrorEmail(customer_email);

            }
          }
        } 
      }
           
      console.log("sent status 200");
      res.status(200).send('Webhook received successfully');
    
  });

  const isValidVin = (vin) => {
    // Check that VIN contains only valid characters
    var validChars = /^[A-HJ-NPR-Z0-9]*$/;
    if (!validChars.test(vin)) {
      return false;
    }
    
    // Check that VIN follows correct format
    var weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    var transliteration = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9, 'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9 };
    var sum = 0;
    for (var i = 0; i < vin.length; i++) {
      var charValue = transliteration[vin[i]] || parseInt(vin[i]);
      if (isNaN(charValue)) {
        return false;
      }
      sum += charValue * weights[i];
    }
    var checkDigit = sum % 11;
    if (checkDigit === 10) {
      return vin[8] === 'X';
    } else {
      return vin[8] == checkDigit;
    }
  }

module.exports = router;
