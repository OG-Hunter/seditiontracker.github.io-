import { Command } from "commander";
import { info, warning } from "./common/console";
import fs from "fs";
import axios from 'axios'
import { HTMLElement, parse } from 'node-html-parser';
import { capitalize, isEmpty, toLower } from 'lodash';
import moment from 'moment';
import { dasherizeName, getSuspect, getSuspectByFile, Suspect, updateSuspect } from "./common/suspect";
const { execSync } = require('child_process')

const cmd = new Command();
cmd.parse(process.argv);

const importSuspects = async() => {
  info("Reading list of current suspects");

  await importDoj(getNameSet());
  await importGw(getNameSet());
  await importUSA(getNameSet());
}

const getNameSet = (): Set<string> => {
  const suspectFiles = fs.readdirSync('./docs/_suspects');
  const nameSet:Set<string> = new Set();

  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile)

    // special hack to deal with duplicate william sywak
    if (suspect.name == "William Jason Sywak") {
      suspect.name = "William Sywak"
    }

    const names = suspect.name.split(" ")
    const firstName = names.shift();

    nameSet.add(dasherizeName(firstName, names.join(" ")));
  }
  return nameSet;
}

const importUSA = async (nameSet: Set<string>) => {
  info("Importing suspects from USA Today site");

  const html = await axios.get("https://www.usatoday.com/storytelling/capitol-riot-mob-arrests/");
  const root = parse(html.data);
  const divs:HTMLElement[] = root.querySelectorAll(".character.svelte-1b6kbib.svelte-1b6kbib");

  for (const div of divs) {
    const nameText = div.querySelector("h4").innerText.replace("Jr.", "").replace(",", "").trim();
    const names = nameText.split(" ");
    const firstName = names[0];
    const lastName = names.pop();

    if (falsePositives("USA").has(lastName)) {
      continue;
    }

    const lis:HTMLElement[] = div.querySelectorAll("ul li");

    let age = "";
    let date = "";
    let residence = "";

    for (const li of lis) {
      const dateMatch = li.innerText.match(/Arrested or charged on: (.*)/);
      const ageMatch = li.innerText.match(/Age: (\d{1,2})/);
      const residenceMatch = li.innerText.match(/Home state: (.*)/);

      if (ageMatch) {
        age = ageMatch[1];
      }

      if (dateMatch) {
        const dateString = dateMatch[1];
        date = moment(dateString, "M, D, YYYY").format("MM/DD/YY");
      }

      if (residenceMatch) {
        residence = residenceMatch[1];
      }
    }

    addData({nameSet, firstName, lastName, residence, age});
  }
}

const importGw = async (nameSet: Set<string>) => {
  info("Importing suspects from GW site");

  const html = await axios.get("https://extremism.gwu.edu/Capitol-Hill-Cases");

  const root = parse(html.data);
  const divs:HTMLElement[] = root.querySelectorAll(".panel-body");

  for (let i=0; i < 6; i++) {
    const div = divs[i];
    const entries: HTMLElement[] = div.querySelectorAll("p");

    for (const entry of entries) {
      if (entry.innerText == "&nbsp;") {
        continue
      }

      const nameTag = (entry.querySelector("strong") || entry.querySelector("em") || entry.querySelector("font"))

      if (!nameTag) {
        continue
      }

      let nameText = nameTag.innerText

      if (nameText.match(/.*Malley.*/)) {
        nameText = "O'Malley, Timothy"
      }

      if (nameText.match(/.*Brien.*/)) {
        nameText = "O'Brien, Kelly"
      }

      if (nameText.match(/Hayah\. Uliyahu/)) {
        nameText = "Hayah, Uliyahu"
      }

      if (nameText.match(/Burlew, Benjamen/)) {
        nameText = "Burlew, Benjamin"
      }

      const [lastName, rest] = nameText.split(",").map( (chunk:string) => chunk.trim().replace("&nbsp;", "").replace(" IV", "").replace(" Jr.", "").replace(" Sr.", "").replace(" III", "").replace(" II", ""));

      const firstName = rest.split(" ")[0];
      let residence = ''

      if (entry.innerText.match(/State: (.*)/) && !entry.innerText.match(/State: Pending/)) {
        residence = RegExp.$1.replace("Unknown", "").replace("&nbsp;", "").replace("Massachusets", "Massachusetts");
      }

      if (falsePositives("GW").has(lastName)) {
        continue;
      }

      const ulTag = entry.nextElementSibling

      const links = getLinks(ulTag, "", lastName)
      addData({nameSet, firstName, lastName, links, residence})
    }
  }
}

const importDoj = async (nameSet: Set<string>) => {
  info("Importing suspects from DOJ site");

  const html = await axios.get("https://www.justice.gov/usao-dc/capitol-breach-cases");

  const root = parse(html.data);
  const tbody = root.querySelector("tbody");
  const rows:HTMLElement[] = tbody.querySelectorAll("tr");

  for (const row of rows) {
    const cells:HTMLElement[] = row.querySelectorAll("td");

    let name = cells[1]?.innerText.trim();
    name = name.replace("FINLEY, Jeffrey", "FINLEY, Jeffery")
    if (!name) {
      continue
    }

    if (name == "BAGGOTT") {
      name = "BAGGOTT, Matthew"
    }

    if (name == "WOODS,") {
      name = "WOODS, Shane"
    }

    if (name.match(/.*Timothy Earl$/)) {
      name = "O'MALLEY, Timothy"
    }

    if (name == "GALLGHER, Thomas") {
      name = "GALLAGHER, Thomas"
    }

    if (name == "PERETTA, Nicholas") {
      name = "PERRETTA, Nicholas"
    }

    if (name.match(/.*;BRIEN, Kelley/)) {
      name = "O'BRIEN, Kelly"
    }

    const nameChunks = name.split(",")

    const lastName = toLower(nameChunks[0]).replace('jr.', '').replace('sr.', '').replace('iii', '').replace(' ii', '').replace(' iv', '').replace('sr', '').replace(/\w+/g, capitalize).trim();

    const firstName = nameChunks[1].trim().split(" ")[0];

    if (falsePositives("DOJ").has(lastName)) {
      continue;
    }

    const dateRegEx = /\d{1,2}([\/.-])\d{1,2}\1\d{2,4}/;
    const dateMatch = cells[5].text.match(dateRegEx) || cells[6].text.match(dateRegEx);
    const dateString = dateMatch ? dateMatch[0] : "";
    const links = getLinks(<HTMLElement>cells[3], "https://www.justice.gov");

    const caseNumberText = cells[0].text.trim()
    const caseNumber = /(\d:\d{2}-\D\D-\d{1,3})/.test(caseNumberText) ? RegExp.$1 : undefined

    addData({
      nameSet,
      firstName,
      lastName,
      dateString,
      links,
      caseNumber
    })
  }
}

const falsePositives = (site: string) => {
  const set:Set<string> = new Set();

  switch(site) {
    case "USA":
      set.add("Ryan");
      set.add("Ianni");
      set.add("Jensen");
      set.add("Madden");
      set.add("Courtwright");
      set.add("Blair"); // state charges
      set.add("Moore"); // state charges
      set.add("Kuehn");
      set.add("Sr.");
      set.add("IV")
      set.add("III")
      set.add("Kostolksy")
      set.add("Bishai")
      set.add("Mink")
      set.add("II")
      set.add("Rehl")
      set.add("Carlton")
      set.add("Norwood")
      set.add("Witcher")
      set.add("Bernewitz")
      set.add("Todisco")
      set.add("Hazelton")
      set.add("466")
      break;
    case "GW":
      set.add("Bentacur");
      set.add("Carlton");
      set.add("Courtwright");
      set.add("DeCarlo");
      set.add("DeGrave");
      set.add("Phipps");
      set.add("Sparks");
      set.add("Spencer");
      set.add("Mazzocco");
      set.add("Munn");
      set.add("Curzio");
      set.add("Clark")
      set.add("Mink");
      set.add("Rehl")
      set.add("Norwood")
      set.add("Witcher")
      set.add("Sueski")
      set.add("Sunstrum")
      set.add("Sywak")
      set.add("Gonzalez")
      set.add("Vargas")
      set.add("Weyer")
      set.add("George")
      set.add("Wilson")
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
      set.add("Stackhouse");
      set.add("Ehrke");
      set.add("Moors");
      break;
  }

  return set
}

const getLinks = (element: HTMLElement, prefix = "", lastName?:string) => {
  const links = {}
  const anchors = element.querySelectorAll("a");
  for (const anchor of anchors) {
    const type = linkType(anchor.rawText, lastName);
    if (type) {
      links[type] = `${prefix}${anchor.attributes.href}`
    }
  }

  return links
}

const linkType = (description: string, lastName?: string) => {
    description = unescape(description)
    description = description.replace(/&#39;/g, "'")

    switch(true) {
      // standard documents
      case /Detention Order/.test(description):
      case /Order of Detention/.test(description):
        return "Detention Order"

      case /Plea Agreement/.test(description):
      case /.* Plea/.test(description):
      case /.*plea_agreement/.test(description):
        return "Plea Agreement"

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
      case /Statement of Offense/.test(description):
      case /Factual Profile/.test(description):
        return "Statement of Facts"

      case /Indictment/.test(description):
      case /indictment/.test(description):
      case /caldwell_et_al.*/.test(description):
        return "Indictment"

      case /Ammended Complaint/.test(description):
        return "Ammended Complaint"

      case /Complaint/.test(description):
      case /complaint/.test(description):
        return "Complaint"

      case /Government Detention Exhibits/.test(description):
        return "Detention Exhibits"

      case /Detention Exhibit (\d)/.test(description):
        return `Detention Exhibit ${RegExp.$1}`;

      case /Arrest Warrant/.test(description):
        return "Arrest Warrant"

      case /Ammended Statement of Facts/.test(description):
        return "Ammended Statement of Facts"

      case /Information/.test(description):
      case /information/.test(description):
        return "Information"

      case /Memorandum in Aid of Sentencing/.test(description):
      case /.*Government Sentencing Memorandum.*/.test(description):
      case /.*Sentencing Memo.*/.test(description):
        return "Sentencing Memo"

      case /Detention Hearing Transcript/.test(description):
      case /Preliminary Hearing and Detention Transcript/.test(description):
        return "Detention Hearing Transcript"

      case /Arraignment and Status Conference Hearing Transcript/.test(description):
        return "Arraignment and Status Conference Hearing Transcript"

      case description == "Judgement":
      case description == "Judgment":
      case /.* Judgement/.test(description):
        return "Judgement"

      case /Order Denying Defendant's Motion for Conditional Release/.test(description):
        return "Order Denying Bond"

      case /Court of Appeals/.test(description):
      case /Appeals Court/.test(description):
        return "Appeals Court Ruling"

      case /Memorandum Opinion Granting Governments Motion to Revoke Release Order/.test(description):
        return "Order Revoking Bond"

      // government motions
      case /Government's Motion to Continue/.test(description):
        return "Government motion to Continue"

      case /Government's Motion to Modify Conditions of Release/.test(description):
        return "Government's Motion to Modify Conditions of Release"

      case /Detention Memo/.test(description):
      case /Government Detention Memorandum/.test(description):
      case /Memorandum in Support of Pretrial Detention/.test(description):
      case /Government's Motion and Memorandum for Pretrial Detention/.test(description):
      case /Government's Brief in Support of Detention/.test(description):
      case /Government Memorandum in Support of Detention/.test(description):
      case /Motion for Pretrial Detention/.test(description):
      case /Memorandum in Support of Pre-Trial Detention/.test(description):
        return "Detention Memo"

      case /Government Motion for Emergency Appeal of Release Order/.test(description):
      case /Governments Motion for Emergency Stay and for Review and Appeal of Release Order/.test(description):
        return 'Government Motion for Emergency Appeal of Release Order'

      // government response
      case /Government Reply to Opposition to Motion to Continue/.test(description):
        return "Government's reploy to Defense Opposition to Continue"

      case /Response to Defendants Motion for Bond/.test(description):
      case /Opposition to Motion to Set Bond and Conditions of Release/.test(description):
      case /Government Opposition to Motion for Conditional Release/.test(description):
      case /Government's Opposition to Defendant's Motion for Release/.test(description):
      case /Government Opposition to Defendant's Motion for Conditional Release/.test(description):
        return "Government Opposition to Release"

      case /Opposition to Defendants Motion to Reconsider/.test(description):
      case /Governments Opposition to Defendants Motion for Reconsideration/.test(description):
      case /Opposition to Defendants Motion for Revocation of Detention Order/.test(description):
      case /Governments Opposition to Defendants Motion to Revoke Order of Detention/.test(description):
      case /Government's Opposition to Defendant's Motion for Reconsideration of Detention/.test(description):
      case /Government's Omnibus Opposition to Defendants' Motions for Release from Custody/.test(description):
      case /Government Opposition to Motion for Reconsideration of Motion for Conditional Release/.test(description):
        return "Government Opposition to Reconsideration of Release"

      case /Supplement to Government's Opposition to Defendant's Motion for Conditional Release/.test(description):
        return "Supplement to Government's Opposition to Defendant's Motion for Conditional Release"

      case /Government Motion to Revoke Release Order/.test(description):
      case /Motion to Revoke Pretrial Release/.test(description):
      case /Government's Motion for Revocation of Order of Release/.test(description):
        return "Motion to Revoke Pretrial Release"

      case /Governments Opposition to Defendants Motion to Modify Conditions of Release/.test(description):
      case /Government's Memorandum in Opposition to Defendant's Bond Review Motion/.test(description):
      case /Government Response to Motion to Modify Conditions of Release/.test(description):
      case /Government's Opposition to Motion for Modification of Conditions of Release/.test(description):
      case /Government Opposition to Motion for Modification of Bond/.test(description):
      case /Government Opposition to Motion for Review of Bond Decision/.test(description):
      case /Government Opposition to Motion for Reconsideration of Conditions of Release/.test(description):
        return "Government's Opposition to Modifying Conditions of Release"

      case /\.*Opposition to Defendant's Motion for Discovery/.test(description):
        return "Government's Opposition to Defendent's Motion for Discovery"

      case /Government Opposition to Defendants Motion to Lift Stay on Release Order/.test(description):
        return "Government Opposition to to Lift Stay on Release Order"

      // defense motions
      case /Defendant's Notice of Government's Violation of Due Process Protections Act/.test(description):
        return "Defendant's Notice of Government's Violation of Due Process Protections Act"

      case /Defense Motion for Modification of Bond/.test(description):
      case /Defendants Motion to Modify Bond Conditions/.test(description):
      case /Defense Motion to Modify Conditions of Release/.test(description):
      case /Defendant's Motion for Bond Review/.test(description):
      case /Defense Motion for Modification of Conditions of Release/.test(description):
        return "Defense Motion for Modification of Bond"

      case /Defense Motion for Release/.test(description):
      case /Defendants Motion to Revoke Order of Detention/.test(description):
      case /Defense Motion to Amend Order of Detention/.test(description):
      case /Defendant's Memorandum in Support of Pretrial Release/.test(description):
      case /Defendant's Motion for Reconsideration of Detention/.test(description):
      case /Defendant's Motion for Conditional Release Pending Trial/.test(description):
          return "Defense Motion for Release"

      case /Defense Memorandum in Support of Probationary Sentence/.test(description):
        return "Defense Memorandum in Support of Probationary Sentence"

      case /Defense Motion for Reconsideration of Conditions of Release/.test(description):
      case /Defense Motion for Reconsideration of Bond/.test(description):
      case /Motion to Reopen Detention Hearing and for Release on Conditions/.test(description):
        return "Defense Motion for Reconsideration of Release"

      case /Defendant's Motion for a Bill of Particulars/.test(description):
        return "Defendant's Motion for a Bill of Particulars"

      case /Defendant's Motion to Dismiss or Exclude Evidence/.test(description):
      case /Defendant's Motion to Suppress Statement/.test(description):
        return "Defense Motion to Dismiss or Exclude Evidence"

      // defense response
      case /Defense Opposition to Government's Motion to Continue/.test(description):
        return "Defense Opposition to Continue"

      case /Defendant's Reply to Government's Memorandum in Opposition to Bond Review Motion/.test(description):
      case /Reply to Government's Opposition to Motion for Modifications of Conditions of Release/.test(description):
        return "Defendant's Reply to Government's Opposition to Modifying Conditions of Release"

      case /Defense Reply to Opposition to Motion for Release from Custody/.test(description):
      case /Defense Reply to Opposition to Motion for Conditional Release/.test(description):
        return "Defense Reply to Opposition to Motion for Release from Custody"

      case /Defense Response to Motion for Appeal of Release Order/.test(description):
      case /Defense Opposition to Governments Bail Appeal/.test(description):
        return "Defense Response to Motion for Appeal of Release Order"

      case /Defense Response to Motion for Revocation of Order of Release/.test(description):
        return "Defense Response to Motion for Revocation of Order of Release"

      // press release
      case /Charged/.test(description):
      case /Indicted/.test(description):
      case /Arrested/.test(description):
        return "DOJ Press Release"

      // misc
      case /^S$/.test(description):
      case /^tatement of Facts/.test(description):
        // ignore messed up GW links
        return null;

      case /Bustle*/.test(description):
      case /grods\.pdf/.test(description):
        return "DOJ Press Release"

      default:
        warning(`unknown link type for ${lastName}: ${description}`)
        return "DOJ Press Release"
    }
}

interface suspectData {
  nameSet: Set<string>,
  firstName: string,
  lastName: string,
  dateString: string,
  links: string,
  caseNumber?: string,
  residence?: string
  age?: string
}
const addData = (suspectData) => {
  const { firstName, lastName, nameSet, residence, age, caseNumber, links} = suspectData
  const nameToCheck = dasherizeName(firstName, lastName);

  if (!nameSet.has(nameToCheck)) {
    // suspect does not yet exist in our database so let's add them
    newSuspect(suspectData);
    return;
  }

  // suspect exists already but there may be new data to update
  const suspect = getSuspect(firstName, lastName)

  if (isEmpty(suspect.residence) && !isEmpty(residence)) {
    console.log(`${suspect.name}: ${residence}`)
    suspect.residence = residence
    updateSuspect(suspect)
  }

  if (isEmpty(suspect.age) && !isEmpty(age)) {
    console.log(`${suspect.name}: Age ${age}`)
    suspect.age = age
    updateSuspect(suspect)
  }

  if (isEmpty(suspect.caseNumber) && !isEmpty(caseNumber)) {
    console.log(`${suspect.name}: Case Number ${caseNumber}`)
    suspect.caseNumber = caseNumber
    updateSuspect(suspect)
  }

  // pick up any new links
  for (const [type, url] of Object.entries(links)) {
    if (suspect.links[type]) {
      // link already exists but there may be a "better" one from DOJ
      if (/^https:\/\/www.justice.gov/.test(<string>url) && suspect.links[type] != url) {
        console.log(`${suspect.name}: ${type} (Updated Link)`);
        suspect.links[type] = <string>url
      } else {
        continue
      }
    } else {
      // make sure there is not a similar link already
      if (type == "Complaint" && suspect.links["Statement of Facts"]) {
        continue;
      }

      console.log(`${suspect.name}: ${type}`);
      suspect.links[type] = <string>url

      if (type == "Indictment" && suspect.status != "Sentenced" && suspect.status != "Convicted") {
        suspect.status = "Indicted"
        if (suspect.published) {
          updatePreview(suspect)
        }
      }

      if (type == "Plea Agreement" && suspect.status != "Sentenced") {
        suspect.status = "Convicted"
        updatePreview(suspect)
      }

      if (type == "Judgement") {
        suspect.status = "Sentenced"
        updatePreview(suspect)
      }
    }
    updateSuspect(suspect)
  }

  // TODO - replace non DOJ links
}

const newSuspect = (suspectData) => {
  const { firstName, lastName, residence, age, links, caseNumber, dateString} = suspectData

  const suspect:Suspect = {
    name: `${firstName} ${lastName}`,
    lastName,
    residence,
    age,
    status: "Charged",
    links: {"News Report": "", ...links},
    jurisdiction: "Federal",
    image: `/images/preview/${dasherizeName(firstName, lastName)}.jpg`,
    suspect: `${dasherizeName(firstName, lastName)}.jpg`,
    title: `${firstName} ${lastName} charged on [longDate]`,
    published: false,
    caseNumber,
  }

  if (dateString) {
    const date = moment(dateString, "MM/DD/YY");
    suspect.date = date.format("YYYY-MM-DD");
    suspect.title = suspect.title.replace("[longDate]", date.format("MMMM Do, YYYY"))
  }

  console.log(`${suspect.name}`);
  updateSuspect(suspect)
}

const updatePreview = (suspect:Suspect) => {
  const previewImage = suspect.image.replace("/images/preview/", "")
  execSync(`yarn suspect preview -f ${previewImage} -s ${suspect.status}`)
}

importSuspects();
