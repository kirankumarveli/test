'use strict';
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const AWS = require('aws-sdk');
const xlsx = require('xlsx');
const excelToJson = require('convert-excel-to-json');
const axios = require('axios')
var multer = require('multer')
const url = require('url')
var multerS3 = require('multer-s3')
var payload = require('./data.json')
//var filter = require('FilterExpression')


// const S3 = new AWS.S3({
//   accessKeyId: "AKIAR6HU7QOXENBOOEUR",
//   secretAccessKey: "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",
//   signatureVersion: 'v4',
//   region: 'us-east-1'
// });
let options = { region: "us-east-1" };
// let options = { region: "ap-south-1" };

const dynamodb = new AWS.DynamoDB.DocumentClient(options);


var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

const readXlsxFile = require('read-excel-file/node');

app.post('/claim_upload', (req, res) => {

  let body1 = JSON.parse(req.body);
  console.log("body", body1)
  let count = 0;
  let highest = Object.keys(body1.Expenses_Claim).sort().pop();
  body1.Expenses_Claim.forEach(function (items9) {

    var email = req.query.useremail;
    console.log("email", email)
    email = email.toString();

    var claim_Date = items9['Claim_Date'].toString()
    console.log("claim", claim_Date)
    var bill_Date = items9['Bill_Date'].toString()
    var bill_Number = items9['Bill_Number'].toString()
    var branch_Name = items9['Branch_Name'].toString()
    var employee_Name = items9['Employee_Name'].toString()
    var vendor_Name = items9['Vendor_Name'].toString()
    var vendor_GST = items9['Vendor_GST'].toString()
    var vendor_Address = items9['Vendor_Address'].toString()
    var product = items9['Product'].toString()
    var description = items9['Description'].toString()
    var hsn = items9['HSN']
    var qty = items9['QTY']
    var advance = items9['Advance']
    var taxable_Amount = items9['Taxable_Amount']
    var tax = items9['Tax']
    var netAmount = items9['NetAmount']

    console.log("items", items9)

    var params = {
      TableName: 'Expenses_Claim',
      Item: {
        "transactionPrimId": bill_Number,
        "email": email,
        "Claim_Date": claim_Date,
        "Bill_Datee": bill_Date,
        "Bill_Number": bill_Number,
        "Branch_Name": branch_Name,
        "Employee_Name": employee_Name,
        "Vendor_Name": vendor_Name,
        "Vendor_GST": vendor_GST,
        "Vendor_Address": vendor_Address,
        "Product": product,
        "Description": description,
        "HSN": hsn,
        "QTY": qty,
        "Advance": advance,
        "Taxable_Amount": taxable_Amount,
        "Tax": tax,
        "NetAmount": netAmount

      }
    }
    console.log("params", params)
    dynamodb.put(params, (err, data) => {
      if (err) {
        res.status(400)
        console.log(err)
        res.send({ msg: "data already is there" })
      } else {
        console.log("count", count == highest)
        if (count == highest) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
          console.log("data stord successfully");
          res.send({ message: "data stord successfully" })
        }
        count++
      }
    })

  })

})

app.get('/get_expenses_Claim', (req, res) => {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  var params = {
    TableName: "Expenses_Claim",
    FilterExpression: "#em =:email",
    ExpressionAttributeNames: {
      "#em": "email",
    },
    ExpressionAttributeValues: {
      ":email": useremail
    }
  };


  dynamodb.scan(params, onScan);
  var count = 0;

  function onScan(err, data) {
    if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Scan succeeded.");
      data.Items.forEach(function (itemdata) {
        console.log("Item :", ++count, JSON.stringify(itemdata));
      });


      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        dynamodb.scan(params, onScan);
      }
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.send(data.Items)
    }
  }

})

//Table CreationclaimItemExpenses
app.post('/createTable', async function (req, res) {
  const tableName = 'requestAdvanceForExpenseSubmit'
  console.log(tableName)
  var params = {
  };
  var dynamodb = new AWS.DynamoDB();
  var params2 = {
    TableName: "requestAdvanceForExpenseSubmit",
    KeySchema: [
      { AttributeName: "transactionPrimId", KeyType: "HASH" },  //Partition key
      { AttributeName: "email", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "transactionPrimId", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    }
  };
  dynamodb.createTable(params2, function (err, data) {
    if (err) {
      console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
      res.send(err)
    } else {
      console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
      res.send(data)
    }
  });
  //console.log(tablePromise)
})


app.post('/expense_Claim_upload', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let body1 = JSON.parse(req.body)
  let payload = body1.Expenses_Claim;
  let count = 0
  let data1 = [];
  let stat;
  let result;
  let result9;
  let result2 = [];
  let coaname;
  let coaid = null;


  let highest = Object.keys(payload).sort().pop();
  console.log(highest)
  let payload2 = {
    "email": useremail,
    "coaAccountCode": "",
    "identForDataValid": 0,
    "trialBalanceForBranch": "",
    "trialBalanceFromDate": "",
    "trialBalanceToDate": ""
  }
  let config = { headers: { 'Authorization': req.headers['authorization'] } }
  axios.post('https://vixaqcyyw9.execute-api.us-east-1.amazonaws.com/dev/getParticularsForCurrentOrg', payload2, config).then(data => {
    console.log("coadata", data.data.partData)
    data.data.partData.forEach(function (items2) {
      if (items2.name == "Expenses") {
        coaname = items2.name;
        coaid = items2.id.toString();
        console.log("name", coaname)
        console.log("id", coaid)
      }
    })

    if ((coaid != null)) {
      payload.forEach(async function (item) {
        item.useremail = useremail
        console.log(item)
        let claim_Date = item['Claim_Date'];
        let bill_Date = item['Bill_Date'];
        let bill_Number = item['Bill_Number'];
        let branch_name = item['Branch_Name'];
        let employee_Name = item['Employee_Name'];
        let vendor_Name = item['Vendor_Name']
        let vendor_GST = item['Vendor_GST']
        let vendor_Address = item['Vendor_Address']
        let reimbursement = item['Reimbursement']
        let product = item['Product'];
        let description = item['Description'];
        let hsn = item['HSN'];
        let qty = item['QTY'];
        let advance = item['Advance'];
        let taxable_Amount = item['Taxable_Amount'];
        let tax = item['Tax'];
        let netAmount = item['NetAmount']


        let config4 = { headers: { 'Authorization': req.headers['authorization'] } }
        await axios.get('https://vixaqcyyw9.execute-api.us-east-1.amazonaws.com/dev/getOrgData', config4).then(data => {
          console.log("getorgdata", data.data.branchListData)
          // branchId = data.data.branchListData[0].id;
          console.log("BranchName", branch_name)
          let branchId;
          data.data.branchListData.forEach(function (item3) {
            if (item3.name == branch_name) {
              branchId = item3.id.toString();
            }
          })

          console.log("branchId", branchId)
          let payload7 = {
            "datavalidationall": "",
            "openingBalance": "",
            "itemTransactionPurpose": "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,35,36,37,38,39,40,41,42",
            "isInputTaxCreditItem": "1",
            "GSTDesc": "",
            "GSTItemSelected": "",
            "GSTCode": hsn,
            "gstTaxRateSelected": tax,
            "cessTaxRateSelected": "0",
            "GSTTaxRate": "14",
            "cessTaxRate": "",
            "GSTItemCategory": "1",
            "GSTtypeOfSupply": "1",
            "expenseSpecfWithholdingApplicable": "0",
            "expenseSpecfWithholdingType": "",
            "expenseSpecfCaptureInputTaxes": "0",
            "expenseSpecfWithholdingRate": "",
            "expenseSpecfWithholdingLimit": "",
            "expenseSpecfWithholdingMonetoryLimit": "",
            "itemBarcodeNo": "",
            "specfUnitPrice": "",
            "docUploadRuleExpenseItemBranchesStr": "",
            "docUploadRuleMonetoryLimitsForExpenseItemInIndividualBranches": "",
            "isEmployeeClaimItem": "1",
            "expUnitMeasure": "Piece",
            "expNoOfOpeningBalUnits": qty,
            "expRateOpeningBalUnits": taxable_Amount,
            "expOpeningBal": "10000",
            "branchInvNoOfUnit": "1000",
            "branchInvRate": "100",
            "branchInvOpeningBalance": "10000",
            "datavalidation_pl_bs": "",
            "coaTDSData": {

            },
            "isTdsVendSpecific": 0,
            "isCompositionItem": 0,
            "useremail": useremail,
            "itemHiddenPrimaryKey": "",
            "topMostParentCode": "2000000000000000000",
            "specificsName": product,
            "specificsParentId": coaid,
            "specificsParentText": coaname,
            "btnName": "",
            "itemBchValues": branchId,
            "walkinCustDiscount": "",
            "branchOpeningBalance": "",
            "knowledgeLibraryHiddenIds": " ",
            "knowledgeLibraryContent": " ",
            "isknowledgeLibraryMandatory": "",
            "knowledgeLibraryForBranches": " ",
            "taxFormulaData": {

            }
          }
          console.log("paload7", payload7)
          //console.log("trialbalance", payload4)
          let config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
          axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/specifics/addSpecifics', payload7, config).then(data6 => {
            console.log("Purchase", data6.data)
            result = data6.data;

            let payload4 = {

              "email": useremail,
              "coaAccountCode": "2000000000000000000",
              "identForDataValid": 0,
              "trialBalanceForBranch": branchId,
              "trialBalanceFromDate": "",
              "trialBalanceToDate": ""

            }

            let config8 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
            axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/trialBalance/display', payload4, config8).then(data => {
              console.log("coaspecfchildDate", data.data.coaSpecfChildData)
              let itemId;
              data.data.coaSpecfChildData.forEach(function (item5) {
                if (item5.accountName == product) {
                  itemId = item5.specId.toString();
                  console.log("id", itemId)
                }
              })

              let payload6 = {
                "eGroupExpenseGroupName": reimbursement,
                "eGroupEntityHiddenId": "",
                "useremail": useremail,
                "eGroupexpenseItems": itemId,
                "eGroupexpenseItemMaximumPermittedAdvance": "0.00,0.00,",
                "eGroupexpenseItemMonthlyMonetoryLimitForReimbursement": "0.00,0.00,"

              }
              console.log("Claim", payload6)
              let expense_GroupId;
              let config0 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
              axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/claims/createExpenseGroup', payload6, config0).then(data0 => {
                console.log("Claim_group", data0.data)
                result9 = data0.data;
                expense_GroupId = data0.data.expensearray[count].expenseGroupId
                console.log("exp_gp", result9)

                let payloadd = {
                  "useremail": useremail
                }
                let configg = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
                axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/allUsers', payloadd, configg).then(userdata => {
                  console.log("getalluser", userdata.data.userListData)
                  let userId;
                  let user_emailId;
                  userdata.data.userListData.forEach(function (item11) {
                    console.log("getuser", item11)
                    if (item11.fullName == employee_Name) {
                      userId = item11.id.toString();
                      user_emailId = item11.userEmail;
                      console.log("userId", userId)
                      console.log("user_emailId", user_emailId)
                    }
                  })
                  let user_payload = {
                    "userHiddenPrimKey": userId,
                    "userName": employee_Name,
                    "userEmail": user_emailId,
                    "branch": branchId,
                    "userctryCodeText": "--Please Select--",
                    "userNumber": "-",
                    "userAddress": "",
                    "userRoles": "3,4,5,6,7",
                    "userTransactionQuestions": "1,2,3,4,5,6,7,8,11,14,22,23,24,25,30,31,32,33,35,36,37,38,39,40,41,42",
                    "creationrightsInBranches": branchId,
                    "creationrightsInProjects": "",
                    "approvalrightsInBranches": branchId,
                    "approvalrightsInProjects": "",
                    "auditorrightsInBranches": "",
                    "useremail": useremail,
                    "userTravelEligibility": "",
                    "userTravelTransPurpose": "",
                    "userExpenseEligibility": expense_GroupId,
                    "userExpenseTransPurpose": "",
                    "hireDate": "",
                    "confirmDate": "",
                    "noticeDate": "",
                    "releaseDate": "",
                    "manager": "",
                    "hrManager": "",
                    "empType": "",
                    "source": "",
                    "pan": "",
                    "passport": "",
                    "designation": "",
                    "department": "",
                    "userEmergencyName": "",
                    "userEmergencyEmail": "",
                    "userEmergencyPhone": "-",
                    "customerCreator": 0,
                    "vednorCreator": 0,
                    "customerActivator": 0,
                    "vednorActivator": 0,
                    "CREATOR_CHANGE": true,
                    "APPROVER_CHANGE": false,
                    "AUDITOR_CHANGE": false,
                    "CREATOR_INCOME_CHANGE": true,
                    "CREATOR_EXPENSE_CHANGE": true,
                    "CREATOR_ASSETS_CHANGE": true,
                    "CREATOR_LIABILITIES_CHANGE": true,
                    "APPROVER_INCOME_CHANGE": false,
                    "APPROVER_EXPENSE_CHANGE": false,
                    "APPROVER_ASSETS_CHANGE": false,
                    "APPROVER_LIABILITIES_CHANGE": false,
                    "AUDITOR_INCOME_CHANGE": false,
                    "AUDITOR_EXPENSE_CHANGE": false,
                    "AUDITOR_ASSETS_CHANGE": false,
                    "AUDITOR_LIABILITIES_CHANGE": false,
                    "moduleAccess": "1,2,3,4,5,6,7,8,9,10,11,12,13,14,"
                  }
                  console.log("user_payload", user_payload)
                  let user_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
                  axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/CreateUser', user_payload, user_config).then(update_userdata => {
                    console.log("Upadte_User", update_userdata.data)


                    let payload3 = {
                      "daysOfCredit": "",
                      "useremail": useremail,
                      "vendName": vendor_Name,
                      "gstinCode": vendor_GST,
                      "businessIndividual": "1",
                      "registeredOrUnReg": "1",
                      "vendUnitCost": ".0,0.0,0.10000,",
                      "vendEmail": "ramkrishna@gmail.com",
                      "vendPhnCtryCode": "",
                      "vendPhone": "",
                      "futurePayAlwd": "1",
                      "vendAddress": vendor_Address,
                      "vendCountry": "",
                      "vendorState": vendor_Address,
                      "vendorStateCode": "",
                      "vendLocation": vendor_Address,
                      "vendContAgg": "",
                      "vendSelSpecf": itemId,
                      "vendRcmApplicableDateItems": "|||",
                      "vendRcmTaxRateForItems": ",,12,",
                      "vendCessTaxRateForItems": ",,,",
                      "vendSelGroup": "",
                      "vendorBnchs": branchId,
                      "branchOpeningBalance": "",
                      "branchOpeningBalanceAP": "0.00",
                      "validityFrom": "",
                      "validityTo": "",
                      "openingBalance": "",
                      "openingBalanceAdvPaid": "0.00",
                      "vendStatutoryName1": "",
                      "vendStatutoryNumber1": "",
                      "vendStatutoryName2": "",
                      "vendStatutoryNumber2": "",
                      "vendStatutoryName3": "",
                      "vendStatutoryNumber3": "",
                      "vendStatutoryName4": "",
                      "vendStatutoryNumber4": "",
                      "btnName": "",
                      "vendPanNo": "",
                      "natureOfVend": "",
                      "billwiseOpeningBalance": [

                      ],
                      "vendorDetailIdListHid": "",
                      "gstinCodeHid": "",
                      "vendorAddressHid": "",
                      "vendorcountryCodeHid": "",
                      "vendorstateHid": "",
                      "vendorStateCodeHid": "",
                      "vendorlocationHid": "",
                      "vendorPhnNocountryCodeHid": "",
                      "vendorphone1Hid": "",
                      "vendorphone2Hid": "",
                      "vendorphone3Hid": "",
                      "gstinCheckedValues": "",
                      "vendTdsData": [
                      ]
                    }
                    console.log("vendor", payload3)
                    let config1 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
                    axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/vendor/addVendor', payload3, config1).then(data4 => {
                      console.log("Vendor", data4.data)
                      result2[count] = data4.data;

                      if (count == highest) {
                        res.send(result2)
                        return
                      }
                      count++

                    }).catch(err => {
                      res.status(500).send(err)
                    })
                  })

                }).catch(err => {
                  res.status(500).send(err)
                })
              })

            }).catch(err => {
              res.status(500).send(err)
            })

          }).catch(err => {
            res.status(500).send(err)
          })

        }).catch(err => {
          res.status(500).send(err)
        })


      })
    }

  }).catch(err => {
    res.status(500).send(err)

  })


})


app.get('/download_Expenses_Claim_Templete', (req, res) => {
  var params = {
    Bucket: 'expenses-claim',
    Key: 'Expense_claim.xlsx'
  }
  var url = S3.getSignedUrl('getObject', params);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.send(url)
})

app.post("/createExpenseClaimConfig", async (req, res) => {
  //console.log(JSON.parse(req.body))
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let body1 = JSON.parse(req.body)
  let payload = body1.Exp_claim_config;
  console.log("body", req.body)
  let count = 0
  let data1 = [];
  let stat;
  let highest = Object.keys(payload).sort().pop();
  console.log(highest)
  payload.forEach(async function (item) {
    item.useremail = useremail
    console.log(item)

    let config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/claims/createExpenseGroup`, item, config).then(data => {
      data1[count] = data.data;

      if (count == highest) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'x-auth-token');
        res.status(data.status).send(data1)
        return
      }
      count++
    }).catch(err => {
      res.status(500).send(err)
      return
    })
  })


})
app.get("/expenseClaimItems", async (req, res) => {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  //console.log(JSON.parse(req.body))
  let config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/claims/getAvailableExpenseClaimItems`, { body: { "email": useremail } }, config).then(data => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(data.status).send(data.data)
  }).catch(err => {
    res.status(500).send(err)
  })
})

app.post('/NewupdateUser', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let payloadd = {
    "useremail": useremail
  }
  let configg = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/allUsers', payloadd, configg).then(userdata => {
    console.log("getalluser", userdata.data.userListData)
    let userId;
    let user_emailId;
    userdata.data.userListData.forEach(function (item11) {
      console.log("getuser", item11)
      if (item11.fullName == employee_Name) {
        userId = item11.id.toString();
        user_emailId = item11.userEmail;
        console.log("userId", userId)
        console.log("user_emailId", user_emailId)
      }
    })
    let user_payload = {
      "userHiddenPrimKey": userId,
      "userName": "",
      "userEmail": "",
      "branch": "",
      "userctryCodeText": "--Please Select--",
      "userNumber": "-",
      "userAddress": "",
      "userRoles": "3,4,5,6,7",
      "userTransactionQuestions": "1,2,3,4,5,6,7,8,11,14,22,23,24,25,30,31,32,33,35,36,37,38,39,40,41,42",
      "creationrightsInBranches": "",
      "creationrightsInProjects": "",
      "approvalrightsInBranches": "",
      "approvalrightsInProjects": "",
      "auditorrightsInBranches": "",
      "useremail": useremail,
      "userTravelEligibility": "",
      "userTravelTransPurpose": "15,16",
      "userExpenseEligibility": "",
      "userExpenseTransPurpose": "17,18,19",
      "hireDate": "",
      "confirmDate": "",
      "noticeDate": "",
      "releaseDate": "",
      "manager": "",
      "hrManager": "",
      "empType": "",
      "source": "",
      "pan": "",
      "passport": "",
      "designation": "",
      "department": "",
      "userEmergencyName": "",
      "userEmergencyEmail": "",
      "userEmergencyPhone": "-",
      "customerCreator": 0,
      "vednorCreator": 0,
      "customerActivator": 0,
      "vednorActivator": 0,
      "CREATOR_CHANGE": true,
      "APPROVER_CHANGE": false,
      "AUDITOR_CHANGE": false,
      "CREATOR_INCOME_CHANGE": true,
      "CREATOR_EXPENSE_CHANGE": true,
      "CREATOR_ASSETS_CHANGE": true,
      "CREATOR_LIABILITIES_CHANGE": true,
      "APPROVER_INCOME_CHANGE": false,
      "APPROVER_EXPENSE_CHANGE": false,
      "APPROVER_ASSETS_CHANGE": false,
      "APPROVER_LIABILITIES_CHANGE": false,
      "AUDITOR_INCOME_CHANGE": false,
      "AUDITOR_EXPENSE_CHANGE": false,
      "AUDITOR_ASSETS_CHANGE": false,
      "AUDITOR_LIABILITIES_CHANGE": false,
      "moduleAccess": "1,2,3,4,5,6,7,8,9,10,11,12,13,14,"
    }
    console.log("user_payload", user_payload)
    let user_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/CreateUser', user_payload, user_config).then(update_userdata => {
      console.log("Upadte_User", update_userdata.data)
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'x-auth-token');
      res.status(200).send(update_userdata.data)
    }).catch(err => {
      res.status(500).send(err)
    })
  })
})


















































app.post('/createClaimExpense', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let claim_body1 = JSON.parse(req.body);
  let maximum_PermittedAdvance = claim_body1.maximumPermittedAdvance
  let monetory_LimitForReimbursement = claim_body1.monthlyMonetoryLimitForReimbursement
  console.log("claim_body", claim_body1)
  let specifics_Name = claim_body1.specificsName
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string_length = 8;
  var randomstring = '';
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);

  }
  console.log("Number", randomstring)
  var params = {
    TableName: 'createClaimExp',
    Item: {

      "email": useremail,
      "transactionPrimId": randomstring,
      "datavalidationall": "-",
      "openingBalance": claim_body1.opening_Balance,
      "itemTransactionPurpose": claim_body1.itemTransactionPurpose,
      "isInputTaxCreditItem": claim_body1.isInputTaxCreditItem,
      "GSTDesc": claim_body1.GSTDesc,
      "GSTItemSelected": "-",
      "GSTCode": claim_body1.GSTCode,
      "gstTaxRateSelected": claim_body1.gstTaxRateSelected,
      "cessTaxRateSelected": claim_body1.cessTaxRateSelected,
      "GSTTaxRate": claim_body1.GSTTaxRate,
      "cessTaxRate": "-",
      "GSTItemCategory": claim_body1.GSTItemCategory,
      "GSTtypeOfSupply": claim_body1.GSTtypeOfSupply,
      "expenseSpecfWithholdingApplicable": claim_body1.expenseSpecfWithholdingApplicable,
      "expenseSpecfWithholdingType": "-",
      "expenseSpecfCaptureInputTaxes": claim_body1.expenseSpecfCaptureInputTaxes,
      "expenseSpecfWithholdingRate": "-",
      "expenseSpecfWithholdingLimit": "-",
      "expenseSpecfWithholdingMonetoryLimit": "-",
      "itemBarcodeNo": "-",
      "specfUnitPrice": claim_body1.specfUnitPrice,
      "docUploadRuleExpenseItemBranchesStr": "-",
      "docUploadRuleMonetoryLimitsForExpenseItemInIndividualBranches": "-",
      "isEmployeeClaimItem": claim_body1.isEmployeeClaimItem,
      "expUnitMeasure": claim_body1.expUnitMeasure,
      "expNoOfOpeningBalUnits": claim_body1.expNoOfOpeningBalUnits,
      "expRateOpeningBalUnits": claim_body1.expRateOpeningBalUnits,
      "expOpeningBal": claim_body1.expOpeningBal,
      "branchInvNoOfUnit": claim_body1.branchInvNoOfUnit,
      "branchInvRate": claim_body1.branchInvRate,
      "branchInvOpeningBalance": claim_body1.branchInvOpeningBalance,
      "datavalidation_pl_bs": "-",
      "coaTDSData": "-",
      "isTdsVendSpecific": claim_body1.isTdsVendSpecific,
      "isCompositionItem": claim_body1.isCompositionItem,
      "useremail": useremail,
      "itemHiddenPrimaryKey": "-",
      "topMostParentCode": claim_body1.topMostParentCode,
      "specificsName": claim_body1.specificsName,
      "specificsParentId": claim_body1.specificsParentId,
      "specificsParentText": claim_body1.specificsParentText,
      "btnName": "-",
      "itemBchValues": claim_body1.itemBchValues,
      "walkinCustDiscount": "-",
      "branchOpeningBalance": claim_body1.branchOpeningBalance,
      "knowledgeLibraryHiddenIds": "-",
      "knowledgeLibraryContent": "-",
      "isknowledgeLibraryMandatory": "-",
      "knowledgeLibraryForBranches": "-",
      "taxFormulaData": "-",
      "maximumPermittedAdvance": maximum_PermittedAdvance,
      "monthlyMonetoryLimitForReimbursement": monetory_LimitForReimbursement


    }
  }


  let claim_config = { headers: { 'Authorization': req.headers['authorization'] } }
  axios.post(`https://chmwo9vq83.execute-api.us-east-1.amazonaws.com/dev/addChartOfAccounts`, claim_body1, claim_config).then(claimdata => {
    console.log("claim", claimdata.data)


    let payload4 = {

      "email": useremail,
      "coaAccountCode": "2000000000000000000",
      "identForDataValid": 0,
      "trialBalanceForBranch": "",
      "trialBalanceFromDate": "",
      "trialBalanceToDate": ""

    }
    let config8 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/trialBalance/display', payload4, config8).then(data => {
      console.log("coaspecfchildDate", data.data.coaSpecfChildData)
      let claim_data = data.data.coaSpecfChildData
      let itemId;
      claim_data.forEach(function (item99) {
        console.log("item", item99.accountName)
        if (item99.accountName == specifics_Name) {
          itemId = item99.specId.toString();
          console.log("id", itemId)
        }
      })
      //let reimbursement=0;

      let payload6 = {
        "eGroupExpenseGroupName": specifics_Name,
        "eGroupEntityHiddenId": "",
        "useremail": useremail,
        "eGroupexpenseItems": itemId,
        "eGroupexpenseItemMaximumPermittedAdvance": maximum_PermittedAdvance,
        "eGroupexpenseItemMonthlyMonetoryLimitForReimbursement": monetory_LimitForReimbursement

      }
      console.log("Claim", payload6)

      let config0 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
      axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/claims/createExpenseGroup', payload6, config0).then(data0 => {
        console.log("Claim_group", data0.data)
        console.log("params", params)
        dynamodb.put(params, (err, data) => {
          if (err) {
            res.status(400)
            console.log(err)
            res.send({ msg: "data already is there" })
          } else {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'x-auth-token');
            res.status(200).send(data0.data)
          }
        })
      }).catch(err => {
        res.status(500).send(err)
      })
    })
  })


})





//Claim Realted api's


// add table name createClaimExp

app.post('/masterclaimExpenses', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let claim_body1 = JSON.parse(req.body);
  let maximum_PermittedAdvance = claim_body1.maximumPermittedAdvance
  let monetory_LimitForReimbursement = claim_body1.monthlyMonetoryLimitForReimbursement
  //console.log("claim_body", claim_body1)
  let specifics_Name = claim_body1.specificsName
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string_length = 8;
  var randomstring = '';
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);

  }
  console.log("Number", randomstring)
  var params = {
    //TableName: 'claimItemExpenses-qa',
    TableName: 'createClaimExp',

    Item: {

      "email": useremail,
      "transactionPrimId": randomstring.toString(),
      "datavalidationall": claim_body1.datavalidationall,
      "openingBalance": claim_body1.openingBalance,
      "itemTransactionPurpose": claim_body1.itemTransactionPurpose,
      "isInputTaxCreditItem": claim_body1.isInputTaxCreditItem,
      "GSTDesc": claim_body1.GSTDesc,
      "GSTItemSelected": claim_body1.GSTItemSelected,
      "GSTCode": claim_body1.GSTCode,
      "gstTaxRateSelected": claim_body1.gstTaxRateSelected,
      "cessTaxRateSelected": claim_body1.cessTaxRateSelected,
      "GSTTaxRate": claim_body1.GSTTaxRate,
      "cessTaxRate": claim_body1.cessTaxRate,
      "GSTItemCategory": claim_body1.GSTItemCategory,
      "GSTtypeOfSupply": claim_body1.GSTtypeOfSupply,
      "expenseSpecfWithholdingApplicable": claim_body1.expenseSpecfWithholdingApplicable,
      "expenseSpecfWithholdingType": claim_body1.expenseSpecfWithholdingType,
      "expenseSpecfCaptureInputTaxes": claim_body1.expenseSpecfCaptureInputTaxes,
      "expenseSpecfWithholdingRate": claim_body1.expenseSpecfWithholdingRate,
      "expenseSpecfWithholdingLimit": claim_body1.expenseSpecfWithholdingLimit,
      "expenseSpecfWithholdingMonetoryLimit": claim_body1.expenseSpecfWithholdingMonetoryLimit,
      "itemBarcodeNo": claim_body1.itemBarcodeNo,
      "specfUnitPrice": claim_body1.specfUnitPrice,
      "docUploadRuleExpenseItemBranchesStr": claim_body1.docUploadRuleExpenseItemBranchesStr,
      "docUploadRuleMonetoryLimitsForExpenseItemInIndividualBranches": claim_body1.docUploadRuleExpenseItemBranchesStr,
      "isEmployeeClaimItem": claim_body1.isEmployeeClaimItem,
      "expUnitMeasure": claim_body1.expUnitMeasure,
      "expNoOfOpeningBalUnits": claim_body1.expNoOfOpeningBalUnits,
      "expRateOpeningBalUnits": claim_body1.expRateOpeningBalUnits,
      "expOpeningBal": claim_body1.expOpeningBal,
      "branchInvNoOfUnit": claim_body1.branchInvNoOfUnit,
      "branchInvRate": claim_body1.branchInvRate,
      "branchInvOpeningBalance": claim_body1.branchInvOpeningBalance,
      "datavalidation_pl_bs": claim_body1.datavalidation_pl_bs,
      "coaTDSData": claim_body1.coaTDSData,
      "isTdsVendSpecific": claim_body1.isTdsVendSpecific,
      "isCompositionItem": claim_body1.isCompositionItem,
      "useremail": useremail,
      "itemHiddenPrimaryKey": claim_body1.itemHiddenPrimaryKey,
      "topMostParentCode": claim_body1.topMostParentCode,
      "specificsName": claim_body1.specificsName,
      "specificsParentId": claim_body1.specificsParentId,
      "specificsParentText": claim_body1.specificsParentText,
      "btnName": claim_body1.btnName,
      "itemBchValues": claim_body1.itemBchValues,
      "walkinCustDiscount": claim_body1.walkinCustDiscount,
      "branchOpeningBalance": claim_body1.branchOpeningBalance,
      "knowledgeLibraryHiddenIds": claim_body1.knowledgeLibraryHiddenIds,
      "knowledgeLibraryContent": claim_body1.knowledgeLibraryContent,
      "isknowledgeLibraryMandatory": claim_body1.isknowledgeLibraryMandatory,
      "knowledgeLibraryForBranches": claim_body1.knowledgeLibraryForBranches,
      "taxFormulaData": claim_body1.taxFormulaData,
      "maximumPermittedAdvance": maximum_PermittedAdvance,
      "monthlyMonetoryLimitForReimbursement": monetory_LimitForReimbursement


    }
  }
  Object.keys(params.Item).map(item => {
    if (!params.Item[item].toString().length) {
      params.Item[item] = null
    }
  })
  console.log("params", params.Item)
  let claim_config = { headers: { 'Authorization': req.headers['authorization'] } }
  axios.post(`https://chmwo9vq83.execute-api.us-east-1.amazonaws.com/dev/addChartOfAccounts`, claim_body1, claim_config).then(claimdata => {
    console.log("claim", claimdata.data)


    let payload4 = {

      "email": useremail,
      "coaAccountCode": "2000000000000000000",
      "identForDataValid": 0,
      "trialBalanceForBranch": "",
      "trialBalanceFromDate": "",
      "trialBalanceToDate": ""

    }
    let config8 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/trialBalance/display', payload4, config8).then(data => {
      console.log("coaspecfchildDate", data.data.coaSpecfChildData)
      let claim_data = data.data.coaSpecfChildData
      let itemId;
      claim_data.forEach(function (item99) {
        console.log("item", item99.accountName)
        if (item99.accountName == specifics_Name) {
          itemId = item99.specId.toString();
          console.log("id", itemId)
        }
      })


      let payload6 = {
        "eGroupExpenseGroupName": specifics_Name,
        "eGroupEntityHiddenId": "",
        "useremail": useremail,
        "eGroupexpenseItems": itemId,
        "eGroupexpenseItemMaximumPermittedAdvance": maximum_PermittedAdvance,
        "eGroupexpenseItemMonthlyMonetoryLimitForReimbursement": monetory_LimitForReimbursement

      }
      console.log("Claim", payload6)

      let config0 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
      axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/claims/createExpenseGroup', payload6, config0).then(data0 => {
        console.log("Claim_group", data0.data)
        dynamodb.put(params, (err, data) => {
          if (err) {
            res.status(400)
            console.log(err)
            res.send({ msg: "data already is there" })
          } else {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'x-auth-token');
            res.status(200).send(data0.data)
          }
        })
      }).catch(err => {
        res.status(500).send(err)
      })
    })
  })

})


app.post('/updateUser', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let update_user1 = JSON.parse(req.body);
  let userExpense_Eligibility = update_user1.userExpenseEligibility
  let payloadd = {
    "useremail": useremail,
    "userExpenseEligibility": userExpense_Eligibility

  }
  let configg = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/allUsers', payloadd, configg).then(userdata => {
    console.log("getalluser", userdata.data.userListData)
    let userId;
    let full_Name
    userId = userdata.data.userListData[0].id
    full_Name = userdata.data.userListData[0].fullName
    console.log("UserID", userId)
    let config4 = { headers: { 'Authorization': req.headers['authorization'] } }
    axios.get('https://vixaqcyyw9.execute-api.us-east-1.amazonaws.com/dev/getOrgData', config4).then(data => {
      console.log("getorgdata", data.data.branchListData)
      let branchId;
      branchId = data.data.branchListData[0].id;
      console.log("BranchName", branchId)
      let user_payload1 = {
        "userHiddenPrimKey": userId,
        "userName": full_Name,
        "userEmail": useremail,
        "branch": branchId,
        "userctryCodeText": "--Please Select--",
        "userNumber": "-",
        "userAddress": "",
        "userRoles": "1,3,4,5,6,7",
        "userTransactionQuestions": "1,2,3,4,5,6,7,8,11,14,22,23,24,25,30,31,32,33,34,35,36,37,38,39,40,41,42",
        "creationrightsInBranches": branchId,
        "creationrightsInProjects": "",
        "approvalrightsInBranches": branchId,
        "approvalrightsInProjects": "",
        "auditorrightsInBranches": "",
        "useremail": useremail,
        "userTravelEligibility": "",
        "userTravelTransPurpose": "15,16",
        "userExpenseEligibility": userExpense_Eligibility,
        "userExpenseTransPurpose": "17,18,19",
        "hireDate": "",
        "confirmDate": "",
        "noticeDate": "",
        "releaseDate": "",
        "manager": "",
        "hrManager": "",
        "empType": "",
        "source": "",
        "pan": "",
        "passport": "",
        "designation": "",
        "department": "",
        "userEmergencyName": "",
        "userEmergencyEmail": "",
        "userEmergencyPhone": "-",
        "customerCreator": 0,
        "vednorCreator": 0,
        "customerActivator": 0,
        "vednorActivator": 0,
        "CREATOR_CHANGE": true,
        "APPROVER_CHANGE": false,
        "AUDITOR_CHANGE": false,
        "CREATOR_INCOME_CHANGE": true,
        "CREATOR_EXPENSE_CHANGE": true,
        "CREATOR_ASSETS_CHANGE": true,
        "CREATOR_LIABILITIES_CHANGE": true,
        "APPROVER_INCOME_CHANGE": false,
        "APPROVER_EXPENSE_CHANGE": false,
        "APPROVER_ASSETS_CHANGE": false,
        "APPROVER_LIABILITIES_CHANGE": false,
        "AUDITOR_INCOME_CHANGE": false,
        "AUDITOR_EXPENSE_CHANGE": false,
        "AUDITOR_ASSETS_CHANGE": false,
        "AUDITOR_LIABILITIES_CHANGE": false,
        "moduleAccess": "1,2,3,4,5,6,7,8,9,10,11,12,13,14,"
      }
      console.log("user_payload", user_payload1)
      let user_config1 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
      axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/CreateUser', user_payload1, user_config1).then(update_userdata1 => {
        console.log("Upadte_User", update_userdata1.data)
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'x-auth-token');
        res.status(200).send(update_userdata1.data)
      }).catch(err => {
        res.status(500).send(err)

      })
    })
  })
})


app.get("/availableTravelExpenseGroups", async (req, res) => {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  //console.log(JSON.parse(req.body))
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'x-auth-token');
  let config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/claims/getAvailableTravelExpenseGroups`, { body: { "userEmail": useremail } }, config).then(data => {
    res.status(data.status).send(data.data)
  }).catch(err => {
    res.status(500).send(err)

  })
})


app.get('/getallUsers', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/allUsers', { body: { "useremail": useremail } }, config).then(userdata => {
    console.log("getalluser", userdata.data.userListData)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(200).send(userdata.data.userListData)
  }).catch(err => {
    res.status(500).send(err)

  })

})

app.get('/getMasterUser', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/config/allUsers', { body: { "useremail": useremail } }, config).then(userdata => {
    console.log("getalluser", userdata.data.userListData[0])
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(200).send(userdata.data.userListData[0])
  }).catch(err => {
    res.status(500).send(err)

  })


})

//add table name request_Advance_for_expense
app.post('/save_Advance_for_expense', async function (req, res) {

  let adv_body1 = JSON.parse(req.body);
  console.log("Adv_body", adv_body1)
  var email = req.query.useremail;
  console.log("email", email)
  email = email.toString();
  var params = {
    //TableName: 'request-Advance-for-expense-qa',
      TableName: 'request_Advance_for_expense',
    Item: {
      "email": email,
      "transactionPrimId": adv_body1.transactionPrimId,
      "transactionPrimId": adv_body1.transactionPrimId,
      "transactionRefNo": adv_body1.transactionRefNo,
      "EmployeeEmail": adv_body1.EmployeeEmail,
      "Date": adv_body1.Date,
      "Branch": adv_body1.Branch,
      "ClaimantId": adv_body1.ClaimantId,
      "Claimant": adv_body1.Claimant,
      "ClaimItem": adv_body1.ClaimItem,
      "Purpose": adv_body1.Purpose,
      "Advance Required": adv_body1.AdvanceRequired,
      "Remarks": adv_body1.Remarks

    }
  }
  console.log("params", params)
  dynamodb.put(params, (err, data) => {
    if (err) {
      res.status(400)
      console.log(err)
      res.send({ msg: "data already is there" })
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      console.log("data stord successfully");
      res.send({ message: "data stored successfully" })
    }


  })

})


//add table name request-Advance-for-expense-qa by ID get details
app.post('/getAdvExpId', async function (req, res) {
  let taxId_body1 = JSON.parse(req.body);
  console.log("taxId_body1", taxId_body1)
  // var useremail = req.query.useremail;
  // useremail = useremail.toString();
  let transaction_PrimId = taxId_body1.transactionPrimId
  var params = {
    //TableName: "request-Advance-for-expense-qa",
    TableName: "request_Advance_for_expense",
    FilterExpression: "#transactionPrimId =:taxprimId",
    ExpressionAttributeNames: {
      "#transactionPrimId": "transactionPrimId",
    },
    ExpressionAttributeValues: {
      ":taxprimId": transaction_PrimId
    }
  };
  dynamodb.scan(params, onScan);
  var count = 0;

  function onScan(err, data) {
    if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Scan succeeded.");
      data.Items.forEach(function (itemdata) {
        console.log("Item :", ++count, JSON.stringify(itemdata));
      });
      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        dynamodb.scan(params, onScan);
      }
      console.log("data", data.Items)
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.send(data.Items)
    }
  }



})

//add table name request-Advance-for-expense-qa by email get details
app.get('/get_advance_for_expense', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  var params = {
    //TableName: "request-Advance-for-expense-qa",
    TableName: "request_Advance_for_expense",
    FilterExpression: "#em =:email",
    ExpressionAttributeNames: {
      "#em": "email",
    },
    ExpressionAttributeValues: {
      ":email": useremail
    }
  };

  dynamodb.scan(params, onScan);
  var count = 0;

  function onScan(err, data) {
    if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Scan succeeded.");
      data.Items.forEach(function (itemdata) {
        console.log("Item :", ++count, JSON.stringify(itemdata));
      });

      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        dynamodb.scan(params, onScan);
      }
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.send(data.Items)
    }
  }

})


//add table name save_claim_for_expense
app.post('/save_claim_for_expense', async function (req, res) {

  let claim_body1 = JSON.parse(req.body);
  console.log("Adv_body", claim_body1)
  var email = req.query.useremail;
  console.log("email", email)
  email = email.toString();
  var params = {
     //TableName: 'claim-for-expense-qa',
    TableName: 'save_claim_for_expense',
    Item: {
      "transactionPrimId": claim_body1.transactionPrimId,
      "email": email,
      "Branch": claim_body1.branch,
      "Claim": claim_body1.claim,
      "Item": claim_body1.item,
      "Date": claim_body1.date,
      "VendorName": claim_body1.vendorName,
      "InvoiceDate": claim_body1.invoiceDate,
      "InvoiceNumber": claim_body1.invoiceNumber,
      "GSTNO": claim_body1.gstno,
      "QTY": claim_body1.qty,
      "Rate": claim_body1.rate,
      "Tax": claim_body1.tax,
      "TotalAmount": claim_body1.totalAmount,
      "AdvanceReceived": claim_body1.advanceReceived,
      "BalanceToSettle": claim_body1.balanceToSettle


    }
  }
  console.log("params", params)
  dynamodb.put(params, (err, data) => {
    if (err) {
      res.status(400)
      console.log(err)
      res.send({ msg: "data already is there" })
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      console.log("data stord successfully");
      res.send({ message: "data stord successfully" })
    }


  })

})

//add table name save_claim_for_expense
app.get('/get_claim_for_expense', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  var params = {
    //TableName: "claim-for-expense-qa",
    TableName: "save_claim_for_expense",
    FilterExpression: "#em =:email",
    ExpressionAttributeNames: {
      "#em": "email",
    },
    ExpressionAttributeValues: {
      ":email": useremail
    }
  };


  dynamodb.scan(params, onScan);
  var count = 0;

  function onScan(err, data) {
    if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Scan succeeded.");
      data.Items.forEach(function (itemdata) {
        console.log("Item :", ++count, JSON.stringify(itemdata));
      });


      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        dynamodb.scan(params, onScan);
      }
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.send(data.Items)
    }
  }
})



// add table name savePandingClaims
app.post('/savePendingClaims', async function (req, res) {

  let pending_body1 = JSON.parse(req.body);
  console.log("Adv_body", pending_body1)
  var email = req.query.useremail;
  console.log("email", email)
  email = email.toString();
  var params = {
    //TableName: 'pending-Claims-qa',
    TableName: 'savePandingClaims',
    Item: {
      "email": email,
      "transactionPrimId": pending_body1.transactionPrimId,
      "Date": pending_body1.date,
      "Claimant": pending_body1.claimant,
      "EmployeeEmail": pending_body1.employeeEmail,
      "Branch": pending_body1.branch,
      "Purpose": pending_body1.purpose,
      "AdvancePaid": pending_body1.advancePaid,
      "BalanceTosettle": pending_body1.balanceTosettle,
      "ModeOfPayent": pending_body1.modeOfPayent,
      "BankInf": pending_body1.bankInf,
      "TotalAmount": pending_body1.totalAmount,
      "status": pending_body1.status

    }
  }
  console.log("params", params)
  dynamodb.put(params, (err, data) => {
    if (err) {
      res.status(400)
      console.log(err)
      res.send({ msg: "data already is there" })
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      //res.header("Access-Control-Allow-Headers", "x-auth-token");
      console.log("data stord successfully");
      res.send({ message: "data stored successfully" })
    }


  })

})

// add table name pending-Claims-qa
app.get('/get_savePendingClaims', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  var params = {
  //TableName: "pending-Claims-qa",
   TableName: "savePandingClaims",
    FilterExpression: "#em =:email",
    ExpressionAttributeNames: {
      "#em": "email",
    },
    ExpressionAttributeValues: {
      ":email": useremail
    }
  };


  dynamodb.scan(params, onScan);
  var count = 0;

  function onScan(err, data) {
    if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Scan succeeded.");
      data.Items.forEach(function (itemdata) {
        console.log("Item :", ++count, JSON.stringify(itemdata));
      });


      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        dynamodb.scan(params, onScan);
      }
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.send(data.Items)
    }
  }
})

app.post('/userClaims_Transactions', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  //let number;
  let tax_payload = {
    "email": useremail,
    "limit": 1000
  }
  let tax_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/user/userClaimsTransactions`, tax_payload, tax_config).then(taxdata => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(taxdata.status).send(taxdata.data)
  }).catch(err => {
    res.status(500).send(err)
  })

})

app.post('/userAdvance_ForExpenseItems', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let item_payload = {
    "email": useremail,
    "type": "expense"
  }
  let Item_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/advance/userAdvanceForExpenseItems`, item_payload, Item_config).then(Itemdata => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(Itemdata.status).send(Itemdata.data)
  }).catch(err => {
    res.status(500).send(err)
  })
})

app.post('/getclaimgstdata', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let gst_payload = {
    "email": useremail,
    "mappingId": ""
  }
  let gst_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/claims/getclaimgstdata`, gst_payload, gst_config).then(gstdata => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(gstdata.status).send(gstdata.data)
  }).catch(err => {
    res.status(500).send(err)
  })

})

app.post('/getAvailableUnsetteled_ExpensesAdvances', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let item_payload1 = {
    "email": useremail,
    "type": "expense"
  }
  let Item_config1 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/advance/populateUserUnsettledExpenseAdvances`, item_payload1, Item_config1).then(Itemdata => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(Itemdata.status).send(Itemdata.data)
  }).catch(err => {
    res.status(500).send(err)
  })

})






//add qa api here

app.post('/getdisplayUnsettledAdvances', function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let dis_payload = {
    "email": useremail,
    "type": "expense"
  }
  console.log("se", dis_payload)
  let dis_config = { headers: { 'Authorization': req.headers['authorization'] } }
  let url11 = "https://dkmzogmjnl.execute-api.us-east-1.amazonaws.com/dev/getAvailableUnsetteled_ExpensesAdvances?useremail=" + useremail
 // let url11 = "https://1cb2ie3yp6.execute-api.ap-south-1.amazonaws.com/qa/getAvailableUnsetteled_ExpensesAdvances?useremail=" + useremail
  axios.post(url11, dis_payload, dis_config).then(disdata1 => {
    console.log("CalimId", disdata1.data.expenseAdvanceUnsettledData[0])
    //let pendingId = getpendata1.data.pendingClaims[0].id;
    var pendingId;
    let count = 0
    let expenseadv = disdata1.data.expenseAdvanceUnsettledData
    let unsettledadvance = []
    expenseadv.forEach(function (item111) {

      console.log("ID", item111.id);
      pendingId = item111.id;
      let item1_payload1 = {
        "email": useremail,
        "previousAdvanceExpTxnPrimId": pendingId
      }
      let Item_config12 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
      axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/advanceExpense/displayUnsettledAdvances`, item1_payload1, Item_config12).then(Itemdata11 => {
        unsettledadvance.push(Itemdata11.data.userAdvExpTxnUnsettledAdvances[0])
        let count1 = count + 1
        if (typeof expenseadv[count1] == "undefined") {
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
          res.header('Access-Control-Allow-Headers', 'x-auth-token');
          res.status(200).send(unsettledadvance)
        }
        count++
      }).catch(err => {
        res.status(500).send(err)
      })
    })
  })


})

app.post('/getUnsettledAdvances', function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let body = JSON.parse(req.body)

  let item_payload111 = {
    "email": useremail,
    "previousAdvanceExpTxnPrimId": body.previousAdvanceExpTxnPrimId
  }
  let Item12_config1 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/advanceExpense/displayUnsettledAdvances`, item_payload111, Item12_config1).then(Itemdata11 => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(Itemdata11.status).send(Itemdata11.data)
  }).catch(err => {
    res.status(500).send(err)
  })
})


//add api here

app.get('/getreimbursement', function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let name = []
  let counttt = 0
  let reconfig = { headers: { 'Authorization': req.headers['authorization'] } }
  axios.get("https://dkmzogmjnl.execute-api.us-east-1.amazonaws.com/dev/availableTravelExpenseGroups?useremail=" + useremail, reconfig).then(redata => {
   // axios.get("https://1cb2ie3yp6.execute-api.ap-south-1.amazonaws.com/qa/availableTravelExpenseGroups?useremail=" + useremail, reconfig).then(redata => {
    console.log("reimbursement", redata.data.expensearray)
    let reimbursement = redata.data.expensearray
    reimbursement.forEach(function (item112) {
      name[counttt] = item112.name
      counttt++
    })

    let repayload4 = {

      "email": useremail,
      "coaAccountCode": "2000000000000000000",
      "identForDataValid": 0,
      "trialBalanceForBranch": "",
      "trialBalanceFromDate": "",
      "trialBalanceToDate": ""

    }

    let config123 = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/trialBalance/display', repayload4, config123).then(data => {
      // axios.get('https://chmwo9vq83.execute-api.us-east-1.amazonaws.com/dev/getCoaExpenseItems', repayload4, config123).then(data => {

      let coadatapay = data.data.coaSpecfChildData
      // let coadatapay = data.data.coaItemData.tdsItemDetails
      //let coadata = coadatapay
      let counttt3 = 0
      let matcheditem = []
      let cnt = 0
      console.log(name, name)
      name.forEach(function (itemm1) {
        let matcheditem1 = coadatapay.find(item => item.accountName == itemm1)
        if (matcheditem1 != undefined) {
          matcheditem[counttt3] = matcheditem1
          counttt3++
        }
      })
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'x-auth-token');
      res.status(200).send(matcheditem)

    }).catch(err => {
      res.status(500).send(err)
    })
  }).catch(err => {
    res.status(500).send(err)
  })

})  


// add table name createClaimExp
app.get('/getClaimData', function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  var params = {
     //TableName: "claimItemExpenses-qa",
    TableName: "createClaimExp",
    FilterExpression: "#em =:email",
    ExpressionAttributeNames: {
      "#em": "email",
    },
    ExpressionAttributeValues: {
      ":email": useremail
    }
  };


  dynamodb.scan(params, onScan);
  var count = 0;

  function onScan(err, data) {
    if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Scan succeeded.");
      data.Items.forEach(function (itemdata) {
        console.log("Item :", ++count, JSON.stringify(itemdata));
      });


      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        dynamodb.scan(params, onScan);
      }
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.send(data.Items)
    }
  }
})











app.post('/bankAccountsForPayment', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let bankdatabody = JSON.parse(req.body)
  let txn_EntityId = bankdatabody.txnEntityId
  let bankdata_payload = {

    "email": useremail,
    "txnEntityId": txn_EntityId
  }
  let bank_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/claimsbranch/bankAccountsForPayment`, bankdata_payload, bank_config).then(bankdata => {
    // res.status(data.status).send(data.data)
    console.log("BankData", bankdata.data)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(200).send(bankdata.data)
  }).catch(err => {
    res.status(500).send(err)
  })

})


app.post('/cashPayNow', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let cashbody = JSON.parse(req.body)
  let transaction_PrimId = cashbody.transactionPrimId
  let selected_ApproverAction = cashbody.selectedApproverAction
  let payment_Details = cashbody.paymentDetails
  let bank_Inf = cashbody.bankInf

  let pay_payload = {
    "email": useremail,
    "selectedApproverAction": selected_ApproverAction,
    "transactionPrimId": transaction_PrimId,
    "paymentDetails": payment_Details,
    "bankInf": bank_Inf
  }

  let pay_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/claims/empPendingClaimSettlement`, pay_payload, pay_config).then(paydata => {
    // res.status(data.status).send(data.data)
    console.log("PayNow", paydata.data)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(paydata.status).send({ "Paid": paydata.data })
  }).catch(err => {
    res.status(500).send(err)
  })
})


app.post('/bankPayNow', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let bankbody = JSON.parse(req.body)
  let selected_ApproverAction = bankbody.selectedApproverAction
  let transaction_PrimId = bankbody.transactionPrimId
  let payment_Details = bankbody.paymentDetails
  let txnPayment_Bank = bankbody.txnPaymentBank
  let txn_InstrumentNum = bankbody.txnInstrumentNum
  let txn_InstrumentDate = bankbody.txnInstrumentDate
  let bank_Inf = bankbody.bankInf

  let BankPay_Payload = {
    email: useremail,
    selectedApproverAction: selected_ApproverAction,
    transactionPrimId: transaction_PrimId,
    paymentDetails: payment_Details,
    txnPaymentBank: txnPayment_Bank,
    txnInstrumentNum: txn_InstrumentNum,
    txnInstrumentDate: txn_InstrumentDate,
    bankInf: bank_Inf
  }
  let BankPay_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/claims/empPendingClaimSettlement`, BankPay_Payload, BankPay_config).then(bankpaydata => {
    console.log("BankPaymentDetails", bankpaydata.data)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(200).send({ "BankAccountDetails": bankpaydata.data })

  }).catch(err => {
    res.status(500).send(err)
  })
})









app.get('/getPaidEmployeeClaims', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let paid_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/claims/getPaidEmployeeClaims', { body: { "email": useremail } }, paid_config).then(paidData => {
    console.log("getalluser", paidData.data)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(200).send(paidData.data)
  }).catch(err => {
    res.status(500).send(err)

  })

})

app.get('/getPendingEmployeeClaims', async function (req, res) {

  var useremail = req.query.useremail;
  useremail = useremail.toString();
  let paid_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  axios.post('http://idosast.southeastasia.cloudapp.azure.com:5001/claims/getPendingEmployeeClaims', { body: { "email": useremail } }, paid_config).then(paidData => {
    console.log("getalluser", paidData.data)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth-token');
    res.status(200).send(paidData.data)
  }).catch(err => {
    res.status(500).send(err)

  })


})


//Dev and Qa tableName same requestAdvanceForExpenseSubmit 
app.post('/request_Advance_for_expense', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  console.log(JSON.parse(req.body))
  var exp = JSON.parse(req.body)
  let advanceForExp_TxnBnch = exp.advanceForExpTxnBnch
  let advanceForExp_TxnPjct = exp.advanceForExpTxnPjct
  let expenseAdvanceConf_DetailsStr = exp.expenseAdvanceConfDetailsStr
  let expenseAdvance_KlContents = exp.expenseAdvanceKlContents
  let expenseAdvanceklmandatory_followednotfollowed = exp.expenseAdvanceklmandatoryfollowednotfollowed
  let expenseAdvancepurposeOfExpense_Advance = exp.expenseAdvancepurposeOfExpenseAdvance
  let expenseAdvancetxn_Remarks = exp.expenseAdvancetxnRemarks
  let expenseAdvance_SupportingDocuments = exp.expenseAdvanceSupportingDocuments
  let advanceForExp_TxnItemSpecf = exp.advanceForExpTxnItemSpecf
  let expenseAdvance_RequiredAmount = exp.expenseAdvanceRequiredAmount
  let expenseAdvanceTotal_AdvanceAmount = exp.expenseAdvanceTotalAdvanceAmount
  let claimTxnPurpose_Text = exp.claimTxnPurposeText
  let claimTxnPurpose_Val = exp.claimTxnPurposeVal

  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string_length = 8;
  var randomstring = "";
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }


  // let adv_payload = {
    var params1 = {
      // TableName: 'requestAdvanceForExpenseSubmit',
      TableName: "requestAdvanceForExpenseSubmit",
      Item: {
    transactionPrimId: randomstring.toString(),
    email: useremail,
    advanceForExpTxnBnch: advanceForExp_TxnBnch,
    advanceForExpTxnPjct: advanceForExp_TxnPjct,
    advanceForExpTxnItemSpecf: advanceForExp_TxnItemSpecf,
    expenseAdvanceConfDetailsStr: expenseAdvanceConf_DetailsStr,
    expenseAdvanceRequiredAmount: expenseAdvance_RequiredAmount,
    expenseAdvanceTotalAdvanceAmount: expenseAdvanceTotal_AdvanceAmount,
    expenseAdvanceKlContents: expenseAdvance_KlContents,
    expenseAdvanceklmandatoryfollowednotfollowed: expenseAdvanceklmandatory_followednotfollowed,
    expenseAdvancepurposeOfExpenseAdvance: expenseAdvancepurposeOfExpense_Advance,
    expenseAdvancetxnRemarks: expenseAdvancetxn_Remarks,
    expenseAdvanceSupportingDocuments: expenseAdvance_SupportingDocuments,
    claimTxnPurposeText: claimTxnPurpose_Text,
    claimTxnPurposeVal: claimTxnPurpose_Val,

      }
  };
  Object.keys(params1.Item).map(item => {
    if (!params1.Item[item].toString().length) {
      params1.Item[item] = null;
    }
  }); 

  console.log("boby",params1) 
  let advance_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/expenseclaims/submitForApproval`, exp, advance_config).then(data_adv => {
    let transaction_PrimId = data_adv.data.transactionPrimId
    let approve1_payload = {

      "email": useremail,
      "selectedApproverAction": "1",
      "transactionPrimId": transaction_PrimId,
      "selectedAddApproverEmail": "",
      "suppDoc": "",
      "txnRmarks": ""

    }
    let app1_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/reimbursement/reimbursementApproverAction`, approve1_payload, app1_config).then(app_data => {
      let com1_payload = {

        "email": useremail,
        "selectedApproverAction": "4",
        "transactionPrimId": transaction_PrimId,
        "selectedAddApproverEmail": "",
        "suppDoc": "",
        "txnRmarks": ""

      }
      let com1_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
      axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/reimbursement/reimbursementApproverAction`, com1_payload, com1_config).then(com1_data => {
        dynamodb.put(params1, (err, data) => {
          if (err) {
            res.status(400);
            console.log(err);
          } else {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods","GET,PUT,POST,DELETE,OPTIONS");
            res.header("Access-Control-Allow-Headers", "x-auth-token");
            res.status(com1_data.status).send(data_adv.data)
          }
        })
      }).catch(err => {
        res.status(500).send(err)
      })
    }).catch(err => {
      res.status(500).send(err)
    })
  })

})
// add table name settle_Advance_for_expense
app.post('/settle_Advance_for_expense', async function (req, res) {
  var useremail = req.query.useremail;
  useremail = useremail.toString();
  console.log(JSON.parse(req.body))
  var settle_exp = JSON.parse(req.body)
  let availableUser_Unsettled_Expense_Advances = settle_exp.availableUserUnsettledExpenseAdvances
  let unsettledUser_ExpenseAdvances_Details = settle_exp.unsettledUserExpenseAdvancesDetails
  let item1ExpIncurredOn_ThisTxnAmount = settle_exp.item1ExpIncurredOnThisTxnAmount
  let amtDueFrom_Company = settle_exp.amtDueFromCompany
  let amtDueTo_Company = settle_exp.amtDueToCompany
  let amtReturnInCaseOf_DueToCompany = settle_exp.amtReturnInCaseOfDueToCompany
  let amtUpdated_Unsettled_Amount = settle_exp.amtUpdatedUnsettledAmount
  let amtTotalExpenses_IncurredOnThisTxn = settle_exp.amtTotalExpensesIncurredOnThisTxn
  let expense_AdvancetxnRemarks = settle_exp.expenseAdvancetxnRemarks
  let expense_Advance_Supporting_Documents = settle_exp.expenseAdvanceSupportingDocuments
  let claim_TxnPurposeText = settle_exp.claimTxnPurposeText
  let claimTxn_PurposeVal = settle_exp.claimTxnPurposeVal
  let incurred_Expenses_Details = settle_exp.incurredExpensesDetails[0]
  let travel_Expence_TotalAmt = settle_exp.travelExpenceTotalAmt
  let travelExpenceTotalTax = settle_exp.travelExpenceTotalTax

  var set_params = {
     //TableName: 'settle-Advance-for-expense-qa',
    TableName: 'settle_Advance_for_expense',
    Item: {

      "transactionPrimId": availableUser_Unsettled_Expense_Advances,
      "email": useremail,
      "availableUserUnsettledExpenseAdvances": availableUser_Unsettled_Expense_Advances,
      "unsettledUserExpenseAdvancesDetails": unsettledUser_ExpenseAdvances_Details,
      "item1ExpIncurredOnThisTxnAmount": item1ExpIncurredOn_ThisTxnAmount,
      "amtDueFromCompany": amtDueFrom_Company,
      "amtDueToCompany": amtDueTo_Company,
      "amtReturnInCaseOfDueToCompany": amtReturnInCaseOf_DueToCompany,
      "amtUpdatedUnsettledAmount": amtUpdated_Unsettled_Amount,
      "amtTotalExpensesIncurredOnThisTxn": amtTotalExpenses_IncurredOnThisTxn,
      "expenseAdvancetxnRemarks": expense_AdvancetxnRemarks,
      "expenseAdvanceSupportingDocuments": expense_Advance_Supporting_Documents,
      "claimTxnPurposeText": claim_TxnPurposeText,
      "claimTxnPurposeVal": claimTxn_PurposeVal,
      "incurredExpensesDetails": [incurred_Expenses_Details],
      "travelExpenceTotalAmt": travel_Expence_TotalAmt,
      "travelExpenceTotalTax": travelExpenceTotalTax
    }
  }

  //console.log("settle",settle_payload,)
  let set_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
  await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/expenseclaims/submitForApproval`, set_params, set_config).then(setdata => {
    // res.status(data.status).send(data.data)
    console.log("sett", setdata.data.transactionPrimId)
    let transaction_PrimId = setdata.data.transactionPrimId
    console.log("transactionPrimId", transaction_PrimId)
    let set_payload = {
      "email": useremail,
      "selectedApproverAction": "4",
      "transactionPrimId": transaction_PrimId,
      "selectedAddApproverEmail": "",
      "suppDoc": "",
      "txnRmarks": ""

    }
    let settle_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/reimbursement/reimbursementApproverAction`, set_payload, settle_config).then(settledata => {
      console.log("params", set_params)
      dynamodb.put(set_params, (err, data) => {
        if (err) {
          res.status(400)
          console.log(err)
        } else {
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
          res.header('Access-Control-Allow-Headers', 'x-auth-token');
          res.send({ "Settle Advance for expense": setdata.data })
        }

      })
    }).catch(err => {
      res.status(500).send(err)
    })

  })
})

  // Dev and Qa tableName same reimbursementSubmit
app.post("/claim_submitForApprovals", async (req, res) => {
    var useremail = req.query.useremail;
    useremail = useremail.toString();
    console.log(JSON.parse(req.body))
    var exp1 = JSON.parse(req.body)
    let reimbursement_TxnBnch = exp1.reimbursementTxnBnch
    let reimbursement_TxnPjct = exp1.reimbursementTxnPjct
    let reimbursement_TxnItemSpecf = exp1.reimbursementTxnItemSpecf
    let reimbursementExpenseReimbursement_EligibilityDetailsDiv = exp1.reimbursementExpenseReimbursementEligibilityDetailsDiv
    let reimbursement_AmountEntered = exp1.reimbursementAmountEntered
    let reimbursementkl_contents = exp1.reimbursementklcontents
    let reimbursement_followedkl = exp1.reimbursementfollowedkl
    let reimbursement_Purpose = exp1.reimbursementPurpose
    let reimbursement_txnRemarks = exp1.reimbursementtxnRemarks
    let reimbursement_SupportingDocuments = exp1.reimbursementSupportingDocuments
    let claimTxn_PurposeText = exp1.claimTxnPurposeText
    let claimTxn_PurposeVal = exp1.claimTxnPurposeVal
    let reiEmbExpenses_Details = exp1.reiEmbExpensesDetails[0]
    let travelExpence_TotalAmt = exp1.travelExpenceTotalAmt
    let travelExpence_TotalTax = exp1.travelExpenceTotalTax
  
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var randomstring = "";
    for (var i = 0; i < string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
  
  
    // let claim_payload = {
      var params = {
        // TableName: 'reimbursementSubmit',
        TableName: "reimbursementSubmit",
        Item: {
      "transactionPrimId": randomstring.toString(),
      "email": useremail,
      "reimbursementTxnBnch": reimbursement_TxnBnch,
      "reimbursementTxnPjct": reimbursement_TxnPjct,
      "reimbursementTxnItemSpecf": reimbursement_TxnItemSpecf,
      "reimbursementExpenseReimbursementEligibilityDetailsDiv": reimbursementExpenseReimbursement_EligibilityDetailsDiv,
      "reimbursementAmountEntered": reimbursement_AmountEntered,
      "reimbursementklcontents": reimbursementkl_contents,
      "reimbursementfollowedkl": reimbursement_followedkl,
      "reimbursementPurpose": reimbursement_Purpose,
      "reimbursementtxnRemarks": reimbursement_txnRemarks,
      "reimbursementSupportingDocuments": reimbursement_SupportingDocuments,
      "claimTxnPurposeText": claimTxn_PurposeText,
      "claimTxnPurposeVal": claimTxn_PurposeVal,
      "reiEmbExpensesDetails": [reiEmbExpenses_Details],
      "travelExpenceTotalAmt": travelExpence_TotalAmt,
      "travelExpenceTotalTax": travelExpence_TotalTax
    }
  }
  Object.keys(params.Item).map(item => {
    if (!params.Item[item].toString().length) {
      params.Item[item] = null;
    }
  }); 
    console.log("adv", params)
  
    let config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
    await axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/expenseclaims/submitForApproval`, exp1, config).then(data1 => {
      let transaction_PrimId = data1.data.transactionPrimId
      console.log("transactionPrimId", transaction_PrimId)
      let approve_payload = {
  
        "email": useremail,
        "selectedApproverAction": "1",
        "transactionPrimId": transaction_PrimId,
        "selectedAddApproverEmail": "",
        "suppDoc": "",
        "txnRmarks": ""
  
      }
      let app_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
      axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/reimbursement/reimbursementApproverAction`, approve_payload, app_config).then(app_data => {
        // res.status(app_data.status).send(app_data.data)
        let com_payload = {
  
          "email": useremail,
          "selectedApproverAction": "4",
          "transactionPrimId": transaction_PrimId,
          "selectedAddApproverEmail": "",
          "suppDoc": "",
          "txnRmarks": ""
  
        }
        let com_config = { headers: { 'X-AUTH-TOKEN': req.headers['authorization'] } }
        axios.post(`http://idosast.southeastasia.cloudapp.azure.com:5001/reimbursement/reimbursementApproverAction`, com_payload, com_config).then(com_data => {
          dynamodb.put(params, (err, data) => {
            if (err) {
              res.status(400);
              console.log(err);
            } else {
              res.header("Access-Control-Allow-Origin", "*");
              res.header("Access-Control-Allow-Methods","GET,PUT,POST,DELETE,OPTIONS");
              res.header("Access-Control-Allow-Headers", "x-auth-token");
              res.status(com_data.status).send({ "reimbursementSubmitForApprovals": data1.data })
            }
          })
  
        }).catch(err => {
          res.status(500).send(err)
        })
      })
    })
  
})
  

    





module.exports.Expenses_TransactionType_Details = serverless(app);



