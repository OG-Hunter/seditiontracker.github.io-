import { Command } from "commander";
import { info } from "./common/console";
import { GoogleSpreadsheet, TextFormat } from "google-spreadsheet";
import fs from "fs";
import { dasherizeName, getSuspectByFile } from "./common/suspect";
import { listWanted } from "./common/wanted";
import { Suspect } from "./common/suspect";

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

  const suspectSheet = doc.sheetsByIndex[0];

  console.log("clearing data");
  await suspectSheet.clear();

  const SUSPECT_HEADERS = [
    "Image",
    "Last Name",
    "Full Name",
    "Status",
    "Residence",
    "Age",
    "Case Number",
    "Hashtag",
    "Sedition Track",
    "Charged",
    "Indicted",
    "Plea Hearing",
    "Trial Date",
    "Trial Type",
    "Convicted",
    "Sentencing",
    "Sentenced",
    "Acquitted",
    "Dismissed",
    "Deceased",
    "News Report",
    "SOF",
    "Information",
    "Indictment",
    "Plea Agreement",
    "Judgement",
    "Convicted Charges",
    "Sentence",
    "Mug Shot",
    "Case",
    "Judge",
    "Status Conference",
    "Felony Conviction",
    "Fine",
    "Restitution",
    "Confinement",
    "Home Detention (Days)",
    "Intermittent Confinement (Days)",
    "Incarceration (Days)",
    "Probation (Months)",
  ];

  await suspectSheet.setHeaderRow(SUSPECT_HEADERS);

  // ensure formatting on header row
  const headerFormat: TextFormat = {
    bold: true,
  };
  await suspectSheet.loadCells("A1:AN1");

  SUSPECT_HEADERS.forEach((_value, index) => {
    const cell = suspectSheet.getCell(0, index);
    cell.textFormat = headerFormat;
  });

  await suspectSheet.saveUpdatedCells();

  console.log("publishing suspects");
  const suspects = fs.readdirSync("./docs/_suspects");

  const rowData = [];

  for (const filename of suspects) {
    const suspect = getSuspectByFile(filename);

    const links = suspect.links;

    if (!suspect.published) {
      continue;
    }

    const suspectUrl = `https://seditiontracker.com/suspects/${dasherizeName(suspect.name)}`;

    const { confinement, fine, home_detention, incarceration, intermittent_confinement, probation, restitution } =
      getSentence(suspect);

    const suspectData = {
      "Last Name": suspect.lastName,
      "Full Name": suspect.name,
      Status: suspect.status,
      Residence: suspect.residence,
      Age: suspect.age,
      "Case Number": suspect.caseNumber,
      Hashtag: suspect.hashtag
        ? `=HYPERLINK("https://twitter.com/search?q=${suspect.hashtag}", "#${suspect.hashtag}")`
        : "",
      "Sedition Track": suspectUrl,
      Charged: suspect.charged,
      Indicted: suspect.indicted,
      "Plea Hearing": suspect.plea_hearing,
      "Trial Date": suspect.trial_date,
      "Trial Type": suspect.trial_type,
      Convicted: suspect.convicted,
      Sentencing: suspect.sentencing,
      Sentenced: suspect.sentenced,
      Acquitted: suspect.acquitted,
      Dismissed: suspect.dismissed,
      Deceased: suspect.deceased,
      "News Report": links["News Report"] || "",
      SOF: links["Statement of Facts"] || "",
      Information: links["Information"] || "",
      Indictment: links["Indictment"] || "",
      "Plea Agreement": links["Plea Agreement"] || "",
      Judgement: links["Judgement"] || "",
      Case: suspect.caseName || "",
      Judge: suspect.judge || "",
      "Status Conference": suspect.status_conference || "",
      "Felony Conviction": felonyConviction(suspect),
      Fine: fine,
      Restitution: restitution,
      Confinement: confinement,
      "Home Detention (Days)": home_detention,
      "Intermittent Confinement (Days)": intermittent_confinement,
      "Incarceration (Days)": incarceration,
      "Probation (Months)": probation,
    };

    if (suspect.charges?.length > 0) {
      suspectData["Convicted Charges"] = suspect.charges
        .map((c) => {
          return `${c.code}: ${c.title}`;
        })
        .join("\n");
    }

    if (suspect.sentence?.length > 0) {
      suspectData["Sentence"] = suspect.sentence.join("\n");
    }

    if (suspect.suspect && !/.*arrest.*/.test(suspect.suspect)) {
      suspectData["Image"] = `=IMAGE("https://seditiontracker.com/images/cropped/${suspect.suspect}")`;
    }

    if (suspect.booking) {
      suspectData["Mug Shot"] = `=IMAGE("https://seditiontracker.com/images/booking/${suspect.booking}")`;
    }

    rowData.push(suspectData);
  }

  await suspectSheet.addRows(rowData);

  const fbiSheet = doc.sheetsByIndex[1];

  console.log("publishing wanted");

  const wanted = listWanted().sort((a, b) => a.id - b.id);

  await fbiSheet.clear();

  const FBI_HEADERS = [
    "Number",
    "Photo",
    "Hashtag",
    "Name",
    "Identified",
    "Arrested",
    "Charged",
    "Minor",
    "Fugitive",
    "Deceased",
    "Sedition Track",
    "AFO",
    "AOM",
    "Notes",
  ];

  const wantedData = [];

  await fbiSheet.setHeaderRow(FBI_HEADERS);

  for (const perp of wanted) {
    if (perp.duplicate) {
      continue;
    }

    const {
      src,
      id,
      missingImage,
      hashtag,
      charged,
      name,
      afo,
      aom,
      arrested,
      identified,
      sedition_link,
      notes,
      minor,
      fugitive,
      deceased,
    } = perp;

    const perpData = {
      Number: src ? `=HYPERLINK("${perp.src.replace("@@images/image/pre", "")}", ${id})` : id,
      Photo:
        missingImage || !hashtag
          ? `=IMAGE("${src}")`
          : `=IMAGE("https://jan6evidence.com/poi_thumbnails/${hashtag.toLowerCase()}.jpeg")`,
      Name: charged || deceased ? name : "",
      AFO: afo ? "yes" : "no",
      AOM: aom ? "yes" : "no",
      Arrested: arrested ? "yes" : "no",
      Identified: identified ? "yes" : "no",
      Charged: charged ? "yes" : "no",
      Minor: minor ? "yes" : "no",
      Fugitive: fugitive ? "yes" : "no",
      Deceased: deceased ? "yes" : "no",
      Hashtag: hashtag ? `=HYPERLINK("https://twitter.com/hashtag/${hashtag}", "#${hashtag}")` : "",
      "Sedition Track": sedition_link,
      Notes: notes,
    };

    wantedData.push(perpData);
  }

  await fbiSheet.addRows(wantedData);
};

const felonyConviction = (suspect: Suspect) => {
  if (!suspect.convicted) {
    return "";
  }

  for (const charge of suspect.charges) {
    if (charge.felony == true) {
      return "Yes";
    }
  }

  return "No";
};

type Sentence = {
  fine?: number;
  restitution?: number;
  confinement?: string;
  home_detention?: number;
  incarceration?: number;
  intermittent_confinement?: number;
  probation?: number;
  community_service?: number;
};

const getSentence = (suspect: Suspect) => {
  if (suspect.sentence.length == 0) {
    return {};
  }

  const sentence: Sentence = {};

  for (let item of suspect.sentence) {
    item = item.replace(",", "");

    if (/.*\$(\d+)\sfine/.test(item)) {
      sentence.fine = parseInt(RegExp.$1);
    } else if (/.*\$(\d+)\srestitution/.test(item)) {
      sentence.restitution = parseInt(RegExp.$1);
    } else if (/(\d+) days intermittent/.test(item)) {
      sentence.intermittent_confinement = parseInt(RegExp.$1);
    }

    if (/(\d+) days incarceration/.test(item)) {
      sentence.incarceration = parseInt(RegExp.$1);
    } else if (/(\d+) months incarceration/.test(item)) {
      sentence.incarceration = parseInt(RegExp.$1) * 30;
    } else if (/(\d+) years incarceration/.test(item)) {
      sentence.incarceration = parseInt(RegExp.$1) * 365;
    }

    if (/(\d+) months probation/.test(item)) {
      sentence.probation = parseInt(RegExp.$1);
    } else if (/(\d+) years? probation/.test(item)) {
      sentence.probation = parseInt(RegExp.$1) * 12;
    }

    if (/(\d+) days home detention/.test(item)) {
      sentence.home_detention = parseInt(RegExp.$1);
    } else if (/(\d+) month(s) home detention/.test(item)) {
      sentence.home_detention = parseInt(RegExp.$1) * 30;
    }
  }

  sentence.confinement =
    sentence.home_detention > 0 || sentence.intermittent_confinement > 0 || sentence.incarceration > 0 ? "Yes" : "No";

  return sentence;
};

publishSheet();
