import { Command } from "commander";
import { info, warning } from "./common/console";
import fs from "fs";
import axios from 'axios'
import { HTMLElement, parse } from 'node-html-parser';
import { capitalize, isEmpty, toLower } from 'lodash';
import moment from 'moment';
import { getSuspect, getSuspectByFile, Suspect, updateSuspect } from "./common/suspect";
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

    addData(nameSet, firstName, lastName, null, {}, residence, age);
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

      let nameText = (entry.querySelector("strong") || entry.querySelector("em") || entry.querySelector("font")).innerText

      if (nameText.match(/.*Malley.*/)) {
        nameText = "O'Malley, Timothy"
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

      const links = getLinks(entry, "", lastName)
      addData(nameSet, firstName, lastName, null, links, residence)
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

    addData(nameSet, firstName, lastName, dateString, links);
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
      case /Plea Agreement/.test(description):
      case /Grods Plea/.test(description):
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
      case /Charged/.test(description):
      case /Indicted/.test(description):
      case /Arrested/.test(description):
        return "DOJ Press Release"
      case /Government Detention Exhibits/.test(description):
        return "Detention Exhibits"
      case /Detention Exhibit (\d)/.test(description):
        return `Detention Exhibit ${RegExp.$1}`;
      case /Detention Memo/.test(description):
      case /Government Detention Memorandum/.test(description):
      case /Memorandum in Support of Pretrial Detention/.test(description):
        return "Detention Memo"
      case /Arrest Warrant/.test(description):
        return "Arrest Warrant"
      case /Ammended Statement of Facts/.test(description):
        return "Ammended Statement of Facts"
      case /^S$/.test(description):
      case /^tatement of Facts/.test(description):
        // ignore messed up GW links
        return null;
      case /Information/.test(description):
      case /information/.test(description):
        return "Information"
      case /Motion for Pretrial Detention/.test(description):
      case /Memorandum in Support of Pre-Trial Detention/.test(description):
        return "Motion for Pretrial Detention"
      case /Defense Motion for Modification of Bond/.test(description):
      case /Defendants Motion to Modify Bond Conditions/.test(description):
        return "Defense Motion for Modification of Bond"
      case /Defense Motion for Release/.test(description):
      case /Defendants Motion to Revoke Order of Detention/.test(description):
        return "Defense Motion for Release"
      case /Government Opposition/.test(description):
      case /Response to Defendants Motion for Bond/.test(description):
        return "Government Opposition to Release"
      case /Motion for Reconsideration of Detention/.test(description):
      case /Opposition to Defendants Motion to Reconsider/.test(description):
      case /Governments Opposition to Defendants Motion for Reconsideration/.test(description):
      case /Opposition to Defendants Motion for Revocation of Detention Order/.test(description):
      case /Governments Opposition to Defendants Motion to Revoke Order of Detention/.test(description):
        return "Government Opposition to Reconsideration of Release"
      case /Memorandum in Aid of Sentencing/.test(description):
        return "Memorandum in Aid of Sentencing"
      case /Defense Memorandum in Support of Probationary Sentence/.test(description):
        return "Defense Memorandum in Support of Probationary Sentence"
      case /Defense Motion for Reconsideration of Conditions of Release/.test(description):
        return "Defense Motion for Reconsideration of Release"
      case /Detention Hearing Transcript/.test(description):
      case /Preliminary Hearing and Detention Transcript/.test(description):
        return "Detention Hearing Transcript"
      case /Government Motion to Revoke Release Order/.test(description):
      case /Motion to Revoke Pretrial Release/.test(description):
        return "Motion to Revoke Pretrial Release"
      case /Governments Opposition to Defendants Motion to Modify Conditions of Release/.test(description):
        return "Government's Opposition to Modifying Conditions of Release"
      case /\.*Opposition to Defendant's Motion for Discovery/.test(description):
        return "Government's Opposition to Defendent's Motion for Discovery"
      case /\.*Judgement\.*/.test(description):
        return "Judgement"
      case /Bustle*/.test(description):
      case /grods\.pdf/.test(description):
        return "DOJ Press Release"
      default:
        warning(`unknown link type for ${lastName}: ${description}`)
        return "DOJ Press Release"
    }
}

const addData = (nameSet:Set<string>, firstName, lastName, dateString, links, residence?: string, age?: string) => {
  const nameToCheck = dasherizeName(firstName, lastName);

  if (!nameSet.has(nameToCheck)) {
    // suspect does not yet exist in our database so let's add them
    newSuspect(firstName, lastName, dateString, links, residence);
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

  // pick up any new links
  for (const [type, url] of Object.entries(links)) {
    if (!suspect.links[type]) {
      // make sure there is not a similar link already
      if (type == "Complaint" && suspect.links["Statement of Facts"]) {
        continue;
      }

      console.log(`${suspect.name}: ${type}`);
      suspect.links[type] = <string>url

      if (type == "Indictment") {
        suspect.status = "Indicted"
        const previewImage = suspect.image.replace("/images/preview/", "")
        execSync(`yarn suspect preview -f ${previewImage} -s ${suspect.status}`)
      }

      updateSuspect(suspect)
    }
  }

  // TODO - replace non DOJ links
}

const newSuspect = (firstName, lastName, dateString, links, residence?: string, age?: string) => {
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
    published: false
  }

  if (dateString) {
    const date = moment(dateString, "MM/DD/YY");
    suspect.date = date.format("YYYY-MM-DD");
    suspect.title = suspect.title.replace("[longDate]", date.format("MMMM Do, YYYY"))
  }

  console.log(`${suspect.name}`);
  updateSuspect(suspect)
}

const dasherizeName = (firstName:string, lastName:string) => {
  return `${firstName} ${lastName}`.replace(/\s/g, "-").toLowerCase();
}

importSuspects();
