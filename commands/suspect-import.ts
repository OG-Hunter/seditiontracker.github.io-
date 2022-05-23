import { Command } from "commander";
import { info, warning } from "./common/console";
import fs from "fs";
import axios from "axios";
import { HTMLElement, parse } from "node-html-parser";
import { capitalize, isEmpty, toLower } from "lodash";
import moment from "moment";
import { dasherizeName, getSuspect, getSuspectByFile, Suspect, updateSuspect } from "./common/suspect";
import { execSync } from "child_process";

const cmd = new Command();
cmd.parse(process.argv);

const importSuspects = async () => {
  info("Reading list of current suspects");

  await importDoj(getNameSet());
  await importGw(getNameSet());
};

const getNameSet = (): Set<string> => {
  const suspectFiles = fs.readdirSync("./docs/_suspects");
  const nameSet: Set<string> = new Set();

  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile);

    // special hack to deal with duplicate william sywak
    if (suspect.name == "William Sywak") {
      suspect.name = "William Jason Sywak";
    }

    const names = suspect.name.split(" ");
    const firstName = names.shift();

    nameSet.add(dasherizeName(firstName, names.join(" ")));
  }
  return nameSet;
};

const importGw = async (nameSet: Set<string>) => {
  info("Importing suspects from GW site");

  const html = await axios.get("https://extremism.gwu.edu/capitol-hill-siege-cases");

  const root = parse(html.data);
  const divs: HTMLElement[] = root.querySelectorAll(".panel-body");

  for (let i = 0; i < 6; i++) {
    const div = divs[i];
    const entries: HTMLElement[] = div.querySelectorAll("p");

    for (const entry of entries) {
      if (entry.innerText == "&nbsp;") {
        continue;
      }

      if (entry.innerText.match(/.*Note:.*/)) {
        continue;
      }

      const nameTag = entry.querySelector("strong") || entry.querySelector("em") || entry.querySelector("font");

      if (!nameTag) {
        continue;
      }

      let nameText = nameTag.innerText;

      if (nameText.match(/.*Malley.*/)) {
        nameText = "O'Malley, Timothy";
      }

      if (nameText.match(/.*Brien.*/)) {
        nameText = "O'Brien, Kelly";
      }

      if (nameText.match(/Hayah\. Uliyahu/)) {
        nameText = "Hayah, Uliyahu";
      }

      if (nameText.match(/Burlew, Benjamen/)) {
        nameText = "Burlew, Benjamin";
      }

      if (nameText.match(/Alvarado/)) {
        nameText = "Alvarado, Wilmar";
      }

      if (nameText.match(/Caplinger/)) {
        nameText = "Caplinger, Jeramiah ";
      }

      if (nameText.match(/Boughner/)) {
        nameText = "Boughner, Tim";
      }

      if (nameText.match(/brien/)) {
        nameText = "O'Brien, Kelly";
      }

      if (nameText.match(/Zoyganeles/)) {
        nameText = "Zoyganeles, Athanasois";
      }

      if (nameText.match(/Heneghan/)) {
        nameText = "Heneghan, Jon";
      }

      if (nameText.match(/Morrisson/)) {
        nameText = "Morrison, Katharine";
      }

      if (nameText.match(/Mazzio/)) {
        nameText = "Mazzio, Anthony";
      }

      const [lastName, rest] = nameText
        .split(",")
        .map((chunk: string) =>
          chunk
            .trim()
            .replace("&nbsp;", "")
            .replace(" IV", "")
            .replace(" Jr.", "")
            .replace(" Sr.", "")
            .replace(" III", "")
            .replace(" II", ""),
        );

      const firstName = rest.split(" ")[0];
      let residence = "";

      if (entry.innerText.match(/State: (.*)/) && !entry.innerText.match(/State: Pending/)) {
        residence = RegExp.$1.replace("Unknown", "").replace("&nbsp;", "").replace("Massachusets", "Massachusetts");
      }

      residence = residence.replace("Resides in District of Columbia", "Washington, DC");

      if (falsePositives("GW").has(lastName)) {
        continue;
      }

      const ulTag = entry.nextElementSibling;

      const links = getLinks(ulTag, "", lastName);
      addData({ nameSet, firstName, lastName, links, residence });
    }
  }
};

const importDoj = async (nameSet: Set<string>) => {
  info("Importing suspects from DOJ site");

  const html = await axios.get("https://www.justice.gov/usao-dc/capitol-breach-cases");

  const root = parse(html.data);
  const tbody = root.querySelector("tbody");
  const rows: HTMLElement[] = tbody.querySelectorAll("tr");

  for (const row of rows) {
    const cells: HTMLElement[] = row.querySelectorAll("td");

    let name = cells[1]?.innerText.trim();
    name = name.replace("FINLEY, Jeffrey", "FINLEY, Jeffery");
    if (!name) {
      continue;
    }

    if (name == "BOSTIC, Willard") {
      name = "BOSTIC, William";
    }

    if (name == "BAGGOTT") {
      name = "BAGGOTT, Matthew";
    }

    if (name == "WOODS,") {
      name = "WOODS, Shane";
    }

    if (name.match(/.*Timothy Earl$/)) {
      name = "O'MALLEY, Timothy";
    }

    if (name == "GALLGHER, Thomas") {
      name = "GALLAGHER, Thomas";
    }

    if (name == "PERETTA, Nicholas") {
      name = "PERRETTA, Nicholas";
    }

    if (name.match(/BRIEN/)) {
      name = "OBRIEN, Kelly";
    }

    if (name == "HOSTSETTER, Alan") {
      name = "HOSTETTER, Alan";
    }

    if (name == "KRZYWICKI, Carly") {
      name = "KRZYWICKI, Carla";
    }

    if (name == "SYWAK, William Jason") {
      name = "JASON SYWAK, William";
    }

    if (name == "SYWAK, William Michael") {
      name = "MICHAEL SYWAK, William";
    }

    if (name == "CAPLINGER, Jeremiah") {
      name = "Caplinger, Jeramiah ";
    }

    if (name == "BUXTON, James") {
      name = "Buxton, Jonas ";
    }

    if (name == "LOGDSON, Tina") {
      name = "Logsdon, Tina";
    }

    if (name == "GILLESPIE, VINCENT") {
      name = "Gillespie, Vincent";
    }

    if (name == "YAZDANI, Elijah") {
      name = "Yazdani-Isfehani, Loammi";
    }

    if (name == "HAYAH, Uliyahu") {
      name = "Haya, Uliyahu";
    }

    if (name == "NIEMALA, Kirstyn") {
      name = "Niemela, Kirstyn";
    }

    if (name == "NESTER, Lynnwood") {
      name = "Nester, Lynwood";
    }

    let nameChunks = name.split(",");

    let lastName = toLower(nameChunks[0])
      .replace("jr.", "")
      .replace("sr.", "")
      .replace("iii", "")
      .replace(" ii", "")
      .replace(" iv", "")
      .replace("sr", "")
      .replace(/\w+/g, capitalize)
      .trim();

    /** Special hack for linwood robinson since 2 of them were charged */
    if (name.match(/Linwood Alan, Sr\./)) {
      name = "Robinson Sr, Linwood";
      lastName = "Robinson Sr";
      nameChunks = name.split(",");
    }

    if (name.match(/Linwood Alan II/)) {
      name = "Robinson II, Linwood";
      lastName = "Robinson II";
      nameChunks = name.split(",");
    }

    const firstName = nameChunks[1].trim().split(" ")[0];

    if (falsePositives("DOJ").has(lastName)) {
      continue;
    }

    const dateRegEx = /\d{1,2}([\/.-])\d{1,2}\1\d{2,4}/;
    const dateMatch = cells[5].text.match(dateRegEx) || cells[6].text.match(dateRegEx);
    const dateString = dateMatch ? dateMatch[0] : "";
    const links = getLinks(<HTMLElement>cells[3], "https://www.justice.gov");

    const caseNumberText = cells[0].text.trim();
    const caseNumber = /(\d:\d{2}-\D\D-\d{1,3})/.test(caseNumberText) ? RegExp.$1 : undefined;

    if (caseNumber === "1:21-mj-561") {
      // ignore duplicate entry for O'Brien
      continue;
    }

    addData({
      nameSet,
      firstName,
      lastName,
      dateString,
      links,
      caseNumber,
    });
  }
};

const falsePositives = (site: string) => {
  const set: Set<string> = new Set();

  switch (site) {
    case "GW":
      set.add("Bentacur");
      set.add("Carlton");
      set.add("Courtwright");
      set.add("DeCarlo");
      set.add("DeGrave");
      set.add("Phipps");
      set.add("Sparks");
      set.add("Hayah");
      set.add("Spencer");
      set.add("Mazzocco");
      set.add("Munn");
      set.add("Curzio");
      set.add("Celentaro");
      set.add("Clark");
      set.add("Mink");
      set.add("OBrien");
      set.add("Rehl");
      set.add("Norwood");
      set.add("Witcher");
      set.add("Sueski");
      set.add("Sunstrum");
      set.add("Sywak");
      set.add("Gonzalez");
      set.add("Vargas");
      set.add("Weyer");
      set.add("George");
      set.add("Seymour");
      set.add("Wilson");
      set.add("Rhodes");
      set.add("Rubenacker");
      set.add("Zoyganeles");
      set.add("Riddle");
      set.add("Robinson");
      break;
    case "DOJ":
      set.add("Capsel");
      set.add("Madden");
      set.add("Alvear");
      set.add("Willams");
      set.add("Mink");
      set.add("Tanios");
      set.add("St");
      set.add("Witcher");
      set.add("Kelly");
      set.add("Portlock");
      set.add("Stackhouse");
      set.add("Ehrke");
      set.add("Moors");
      set.add("Morgan-Lloyd");
      set.add("Yazdani");
      set.add("Tarrio");
      set.add("Seymour");
      break;
  }

  return set;
};

const getLinks = (element: HTMLElement, prefix = "", lastName?: string) => {
  const links = {};
  const anchors = element.querySelectorAll("a");
  for (const anchor of anchors) {
    const type = linkType(anchor.rawText, lastName);
    if (type) {
      links[type] = `${prefix}${anchor.attributes.href}`;
    }
  }

  return links;
};

const linkType = (description: string, lastName?: string) => {
  description = unescape(description);
  description = description.replace(/&#39;/g, "'");

  if (description === "Memorandum") {
    return null;
  }

  switch (true) {
    // standard documents
    case /Memorandum Opinion on Split Sentence/.test(description):
      return "Memorandum Opinion on Split Sentence";

    case /Memorandum Opinion Denying Motion to Dismiss/.test(description):
      return "Memorandum Opinion Denying Motion to Dismiss";

    case /Detention Order/.test(description):
    case /Order of Detention/.test(description):
      return "Detention Order";

    case /Plea Agreement/.test(description):
    case /plea agreement/.test(description):
    case /.* Plea/.test(description):
    case /.*plea_agreement/.test(description):
      return "Plea Agreement";

    case /Affidavit/.test(description):
    case /Affidavit in Support of Criminal Complaint/.test(description):
    case /Affadavit/.test(description):
    case /Statement of Fact/.test(description):
    case /statement_of_fact/.test(description):
    case /_sof/.test(description):
    case /sof\.pdf/.test(description):
    case /charging_docs\.pdf/.test(description):
    case /affadavit/.test(description):
    case /Charging Documents/.test(description):
    case /mchugh/.test(description):
    case /Factual Profile/.test(description):
    case /charging_documents.pdf/.test(description):
    case /statement_of_offense/.test(description):
    case /Panayiotou Marcos/.test(description):
      return "Statement of Facts";
    case /Statement of Offense/.test(description):
    case /statement of offense/.test(description):
    case /.*statement_of_offense.pdf/.test(description):
      return "Statement of Offense";
    case /Indictment/.test(description):
    case /indictment/.test(description):
    case /caldwell_et_al.*/.test(description):
    case /Second Superseding/.test(description):
      return "Indictment";

    case /Ammended Complaint/.test(description):
      return "Ammended Complaint";

    case /Complaint/.test(description):
    case /complaint/.test(description):
      return "Complaint";

    case /Government Detention Exhibits/.test(description):
      return "Detention Exhibits";

    case /Detention Exhibit (\d)/.test(description):
      return `Detention Exhibit ${RegExp.$1}`;

    case /Arrest Warrant/.test(description):
      return "Arrest Warrant";

    case /Ammended Statement of Facts/.test(description):
      return "Ammended Statement of Facts";

    case /Information/.test(description):
    case /information/.test(description):
    case /Third Amended Informaiton/.test(description):
      return "Information";

    case /Memorandum in Aid of Sentencing/.test(description):
    case /.*Government Sentencing Memorandum.*/.test(description):
    case /.*Sentencing Memo.*/.test(description):
      return "Sentencing Memo";

    case /Detention Hearing Transcript/.test(description):
    case /Preliminary Hearing and Detention Transcript/.test(description):
      return "Detention Hearing Transcript";

    case /Arraignment and Status Conference Hearing Transcript/.test(description):
      return "Arraignment and Status Conference Hearing Transcript";

    case description == "Judgement":
    case description == "Judgment":
    case /.* Judgement/.test(description):
      return "Judgement";

    case description == "Amended Judgment":
      return "Ammended Judgement";

    case /Order Denying Defendant's Motion for Conditional Release/.test(description):
    case /Memorandum Opinion Denying Defense Motion for Bail/.test(description):
      return "Order Denying Bond";

    case /Order Setting Conditions of Release/.test(description):
    case /^Memorandum Opinion$/.test(description):
      return "Order Granting Bond";

    case /Court of Appeals/.test(description):
    case /Appeals Court/.test(description):
      return "Appeals Court Ruling";

    case /Memorandum Opinion Granting Governments Motion to Revoke Release Order/.test(description):
      return "Order Revoking Bond";

    case /Order Denying Defense Motion to Modify Conditions of Release/.test(description):
      return "Order Denying Defense Motion to Modify Conditions of Release";

    case /Initial Appearance Hearing Transcript/.test(description):
      return "Initial Appearance (Transcript)";

    case /Government Sentencing Exhibit/.test(description):
      return "Government Sentencing Exhibit";

    case /Stipulation of Facts/.test(description):
      return "Stipulation of Facts";

    case /Sentencing Guidelines/.test(description):
      return "Sentencing Guidelines";

    case /Sentencing Hearing Transcript/.test(description):
      return "Sentencing Hearing Transcript";

    case /Plea Hearing Transcript/.test(description):
      return "Plea Hearing Transcript";

    // government motions
    case /Government's Motion to Continue/.test(description):
      return "Government motion to Continue";

    case /Government's Motion to Modify Conditions of Release/.test(description):
      return "Government's Motion to Modify Conditions of Release";

    case /Detention Memo/.test(description):
    case /Government Detention Memorandum/.test(description):
    case /Memorandum in Support of Pretrial Detention/.test(description):
    case /Government's Motion and Memorandum for Pretrial Detention/.test(description):
    case /Government's Brief in Support of Detention/.test(description):
    case /Government Memorandum in Support of Detention/.test(description):
    case /Motion for Pretrial Detention/.test(description):
    case /Memorandum in Support of Pre-Trial Detention/.test(description):
      return "Detention Memo";

    case /Government Motion for Emergency Appeal of Release Order/.test(description):
    case /Governments Motion for Emergency Stay and for Review and Appeal of Release Order/.test(description):
    case /Government Motion for Emergency Stay and for Review of Release Order/.test(description):
    case /Government Motion for Emergency Stay and Revocation of Release Order/.test(description):
      return "Government Motion for Emergency Appeal of Release Order";

    case /Application for Search Warrant/.test(description):
      return "Application for Search Warrant";

    // government response
    case /Government Reply to Opposition to Motion to Continue/.test(description):
      return "Government's reploy to Defense Opposition to Continue";

    case /Response to Defendants Motion for Bond/.test(description):
    case /Opposition to Motion to Set Bond and Conditions of Release/.test(description):
    case /Government Opposition to Motion for Conditional Release/.test(description):
    case /Government's Opposition to Defendant's Motion for Release/.test(description):
    case /Government Opposition to Defendant's Motion for Conditional Release/.test(description):
    case /Government Opposition to Motion for Pretrial Release/.test(description):
    case /Government Opposition to Defense Motion for Bail/.test(description):
      return "Government Opposition to Release";

    case /Opposition to Defendants Motion to Reconsider/.test(description):
    case /Governments Opposition to Defendants Motion for Reconsideration/.test(description):
    case /Opposition to Defendants Motion for Revocation of Detention Order/.test(description):
    case /Governments Opposition to Defendants Motion to Revoke Order of Detention/.test(description):
    case /Government's Opposition to Defendant's Motion for Reconsideration of Detention/.test(description):
    case /Government's Omnibus Opposition to Defendants' Motions for Release from Custody/.test(description):
    case /Government Opposition to Motion for Reconsideration of Motion for Conditional Release/.test(description):
    case /Government Opposition to Motion for Reconsideration of Revocation of Bond/.test(description):
    case /Government Opposition to Motion for Reconsideration of Pretrial Detention/.test(description):
      return "Government Opposition to Reconsideration of Release";

    case /Supplement to Government's Opposition to Defendant's Motion for Conditional Release/.test(description):
      return "Supplement to Government's Opposition to Defendant's Motion for Conditional Release";

    case /Government Motion to Revoke Release Order/.test(description):
    case /Motion to Revoke Pretrial Release/.test(description):
    case /Government's Motion for Revocation of Order of Release/.test(description):
      return "Motion to Revoke Pretrial Release";

    case /Governments Opposition to Defendants Motion to Modify Conditions of Release/.test(description):
    case /Government's Memorandum in Opposition to Defendant's Bond Review Motion/.test(description):
    case /Government Response to Motion to Modify Conditions of Release/.test(description):
    case /Government's Opposition to Motion for Modification of Conditions of Release/.test(description):
    case /Government Opposition to Motion for Modification of Bond/.test(description):
    case /Government Opposition to Motion for Review of Bond Decision/.test(description):
    case /Government Opposition to Motion for Reconsideration of Conditions of Release/.test(description):
      return "Government's Opposition to Modifying Conditions of Release";

    case /\.*Opposition to Defendant's Motion for Discovery/.test(description):
      return "Government's Opposition to Defendent's Motion for Discovery";

    case /Government Opposition to Defendants Motion to Lift Stay on Release Order/.test(description):
      return "Government Opposition to to Lift Stay on Release Order";

    case /Govt Surreply to Def Motion to Dismiss/.test(description):
    case /Defense Emergency Motion to Dismiss and for Release from Custody/.test(description):
    case /Government Response to Emergency Motion to Dismiss and for Release from Custody/.test(description):
      return "Government's Opposition to Defense Motion to Dismiss";

    case /Government Opposition to Defense Motion for Severance/.test(description):
      return "Government Opposition to Defense Motion for Severance";

    case /Government Opposition to Motion to Suppress Evidence/.test(description):
      return "Government Opposition to Motion to Suppress Evidence";

    // defense motions
    case /Defendant's Notice of Government's Violation of Due Process Protections Act/.test(description):
      return "Defendant's Notice of Government's Violation of Due Process Protections Act";

    case /Defense Motion for Modification of Bond/.test(description):
    case /Defendants Motion to Modify Bond Conditions/.test(description):
    case /Defense Motion to Modify Conditions of Release/.test(description):
    case /Defendant's Motion for Bond Review/.test(description):
    case /Defense Motion for Modification of Conditions of Release/.test(description):
    case /Defense Motion to Reconsider Bail Status/.test(description):
      return "Defense Motion for Modification of Bond";

    case /Defense Motion for Release/.test(description):
    case /Defendants Motion to Revoke Order of Detention/.test(description):
    case /Defense Motion to Amend Order of Detention/.test(description):
    case /Defendant's Memorandum in Support of Pretrial Release/.test(description):
    case /Defendant's Motion for Reconsideration of Detention/.test(description):
    case /Defendant's Motion for Conditional Release Pending Trial/.test(description):
    case /Defense Motion to Set Bond and Conditions of Release/.test(description):
    case /Defense Memorandum in Support of Pretrial Release/.test(description):
    case /Defense Motion for Bail/.test(description):
      return "Defense Motion for Release";

    case /Defense Memorandum in Support of Probationary Sentence/.test(description):
      return "Defense Memorandum in Support of Probationary Sentence";

    case /Defense Motion for Reconsideration of Conditions of Release/.test(description):
    case /Defense Motion for Reconsideration of Bond/.test(description):
    case /Motion to Reopen Detention Hearing and for Release on Conditions/.test(description):
    case /Defense Motion for Reconsideration of Revocation of Bond/.test(description):
    case /Defense Motion for Reconsideration of Pretrial Detention/.test(description):
      return "Defense Motion for Reconsideration of Release";

    case /Defendant's Motion for a Bill of Particulars/.test(description):
      return "Defendant's Motion for a Bill of Particulars";

    case /Defendant's Motion to Dismiss or Exclude Evidence/.test(description):
    case /Defendant's Motion to Suppress Statement/.test(description):
    case /Defense Motion to Suppress/.test(description):
      return "Defense Motion to Dismiss or Exclude Evidence";

    case /Defense Motion to Dismiss/.test(description):
      return "Defense Motion to Dismiss";

    case /Defense Motion for Discovery/.test(description):
      return "Defense Motion for Discovery";

    case /Defense Motion to Sever/.test(description):
      return "Defense Motion to Sever";

    case /Defense Motion to Amend Sentence/.test(description):
      return "Defense Motion to Amend Sentence";

    case /Defense Preliminary Guideline Analysis/.test(description):
      return "Defense Analysis of Sentencing Guidelines";

    // defense response
    case /Defense Opposition to Government's Motion to Continue/.test(description):
      return "Defense Opposition to Continue";

    case /Defendant's Reply to Government's Memorandum in Opposition to Bond Review Motion/.test(description):
    case /Reply to Government's Opposition to Motion for Modifications of Conditions of Release/.test(description):
      return "Defendant's Reply to Government's Opposition to Modifying Conditions of Release";

    case /Defense Reply to Opposition to Motion for Release from Custody/.test(description):
    case /Defense Reply to Opposition to Motion for Conditional Release/.test(description):
    case /Defense Reply to Government Opposition to Motion for Reconsideration of Pretrial Detention/.test(description):
      return "Defense Reply to Opposition to Motion for Release from Custody";

    case /Defense Response to Motion for Appeal of Release Order/.test(description):
    case /Defense Opposition to Governments Bail Appeal/.test(description):
      return "Defense Response to Motion for Appeal of Release Order";

    case /Defense Response to Motion for Revocation of Order of Release/.test(description):
    case /Defense Response to Motion for Revocation of Release Order/.test(description):
      return "Defense Response to Motion for Revocation of Order of Release";

    case /Defense Reply to Govt Opposition to Motion to Dismiss/.test(description):
      return "Defense Reply to Opposition to Motion to Dismiss";

    case /Defense Objection to Government Summary of Sentencing Range/.test(description):
    case /Defense Response to Government/.test(description) && lastName === "Croy":
      return "Defense Objection to Sentencing Guidelines";

    // press release
    case /Charged/.test(description):
    case /Indicted/.test(description):
    case /Arrested/.test(description):
      return "DOJ Press Release";

    // misc
    case /^S$/.test(description):
    case /^tatement of Facts/.test(description):
      // ignore messed up GW links
      return null;

    case /Bustle*/.test(description):
    case /grods\.pdf/.test(description):
      return "DOJ Press Release";

    default:
      warning(`unknown link type for ${lastName}: ${description}`);
      return "DOJ Press Release";
  }
};

const addData = (suspectData) => {
  const { firstName, lastName, nameSet, residence, age, caseNumber, links } = suspectData;
  const nameToCheck = dasherizeName(firstName, lastName);

  if (!nameSet.has(nameToCheck)) {
    // suspect does not yet exist in our database so let's add them
    newSuspect(suspectData);
    return;
  }

  // suspect exists already but there may be new data to update
  const suspect = getSuspect(firstName, lastName);

  if (isEmpty(suspect.residence) && !isEmpty(residence)) {
    console.log(`${suspect.name}: ${residence}`);
    suspect.residence = residence;
    updateSuspect(suspect);
  }

  if (isEmpty(suspect.age) && !isEmpty(age)) {
    console.log(`${suspect.name}: Age ${age}`);
    suspect.age = age;
    updateSuspect(suspect);
  }

  if (isEmpty(suspect.caseNumber) && !isEmpty(caseNumber)) {
    console.log(`${suspect.name}: Case Number ${caseNumber}`);
    suspect.caseNumber = caseNumber;
    updateSuspect(suspect);
  }

  // pick up any new links
  for (const [type, url] of Object.entries(links)) {
    if (suspect.links[type]) {
      // link already exists but there may be a "better" one from DOJ
      if (/^https:\/\/www.justice.gov/.test(<string>url) && suspect.links[type] !== url) {
        suspect.links[type] = <string>url;
      } else {
        continue;
      }
    } else {
      // make sure there is not a similar link already
      if (type == "Complaint" && suspect.links["Statement of Facts"]) {
        continue;
      }

      console.log(`${suspect.name}: ${type}`);
      suspect.links[type] = <string>url;

      if (type == "Indictment" && suspect.status != "Sentenced" && suspect.status != "Convicted") {
        suspect.status = "Indicted";
        if (suspect.published) {
          updatePreview(suspect);
        }
      }

      if (type == "Plea Agreement" && suspect.status != "Sentenced") {
        suspect.status = "Convicted";
        if (suspect.suspect === "charged.jpg") {
          suspect.image = "/images/preview/convicted.jpg";
        } else {
          updatePreview(suspect);
        }
      }

      if (type == "Judgement") {
        suspect.status = "Sentenced";
        updatePreview(suspect);
      }
    }
    updateSuspect(suspect);
  }

  // TODO - replace non DOJ links
};

const newSuspect = (suspectData) => {
  const { firstName, lastName, residence, age, links, caseNumber, dateString } = suspectData;

  const suspect: Suspect = {
    name: `${firstName} ${lastName}`,
    lastName,
    residence,
    age,
    status: "Charged",
    links: { "News Report": "", ...links },
    jurisdiction: "Federal",
    image: `/images/preview/${dasherizeName(firstName, lastName)}.jpg`,
    suspect: `${dasherizeName(firstName, lastName)}.jpg`,
    title: `${firstName} ${lastName} charged on [longDate]`,
    published: false,
    caseNumber,
  };

  if (dateString) {
    const date = moment(dateString, "MM/DD/YY");
    suspect.date = date.format("YYYY-MM-DD");
    suspect.charged = date.format("YYYY-MM-DD");
    suspect.title = suspect.title.replace("[longDate]", date.format("MMMM Do, YYYY"));
  }

  console.log(`${suspect.name}`);
  updateSuspect(suspect);
};

const updatePreview = (suspect: Suspect) => {
  const previewImage = suspect.image.replace("/images/preview/", "");
  execSync(`yarn suspect preview -f ${previewImage} -s ${suspect.status}`);
};

importSuspects();
