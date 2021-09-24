import { Command } from "commander";
import { info, warning } from "./common/console";
import { GoogleSpreadsheet, TextFormat } from "google-spreadsheet";
import fs from "fs";
import { getSuspectByFile, updateSuspect } from "./common/suspect";
const { execSync } = require("child_process");

require("dotenv").config();

const cmd = new Command();
cmd.parse(process.argv);

const publishSheet = async () => {
  info("Updating Google Sheet");

  const doc = new GoogleSpreadsheet("1cVgkHuQdnyJOmmiP8gYmd1LaADgffKj262ejikL3bR0");

  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  // load document properties and worksheets
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  console.log("clearing data");
  await sheet.clear();

  const ROW_HEADERS = [
    "Last Name",
    "Full Name",
    "Status",
    "Residence",
    "Age",
    "Case Number",
    "Charges (conviction only)",
    "Charged",
    "Indicted",
    "Convicted",
    "Sentenced",
    "Dismissed",
    "Deceased",
    "News Story",
    "SOF",
    "Information",
    "Indictment",
    "Plea Agreement",
    "Judgement",
  ];

  await sheet.setHeaderRow(ROW_HEADERS);

  // ensure formatting on header row
  const headerFormat: TextFormat = {
    bold: true,
  };
  await sheet.loadCells("A1:Z1");

  ROW_HEADERS.forEach((_value, index) => {
    const cell = sheet.getCell(0, index);
    cell.textFormat = headerFormat;
  });

  await sheet.saveUpdatedCells();

  // publish suspect data
  console.log("publishing suspects");
  const suspects = fs.readdirSync("./docs/_suspects");

  const rowData = [];

  for (const filename of suspects) {
    const suspect = getSuspectByFile(filename);

    const links = suspect.links;

    if (!suspect.published) {
      continue;
    }

    rowData.push({
      "Last Name": suspect.lastName,
      "Full Name": suspect.name,
      Status: suspect.status,
      Residence: suspect.residence,
      Age: suspect.age,
      "Case Number": suspect.caseNumber,
      Charged: suspect.charged,
      Indicted: suspect.indicted,
      Convicted: suspect.convicted,
      Sentenced: suspect.sentenced,
      Dismissed: suspect.dismissed,
      Deceased: suspect.deceased,
      "News Story": links["News Story"] || "",
      SOF: links["Statement of Facts"] || "",
      Information: links["Information"] || "",
      Indictment: links["Indictment"] || "",
      "Plea Agreement": links["Plea Agreement"] || "",
      Judgement: links["Judgement"] || "",
    });
  }

  await sheet.addRows(rowData);
};

const sleep = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

publishSheet();
